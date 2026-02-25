<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { useWorkflowStore } from '../stores/workflowStore'
import CustomNode from './CustomNode.vue'
import GroupNode from './GroupNode.vue'

const store = useWorkflowStore()
const { fitView, getViewport, setViewport } = useVueFlow()

// Circle focus layout state
const focusPositions = ref(null)   // null or { [nodeId]: {x, y} } — absolute positions for circle
const savedViewport = ref(null)    // saved {x, y, zoom} before focus

const isRefreshing = ref(false)

async function refreshGraph() {
  if (!store.analysisPath || isRefreshing.value) return
  isRefreshing.value = true
  try {
    await store.analyzeProject(store.analysisPath)
    await nextTick()
    fitView({ padding: 0.2, duration: 400 })
  } finally {
    isRefreshing.value = false
  }
}

const searchQuery = ref('')
const contentSearchEnabled = ref(false)
const contentMatchFiles = ref(null)
const isSearching = ref(false)
let searchDebounce = null

const nodeTypes = {
  publishing: CustomNode,
  logic: CustomNode,
  backend: CustomNode,
  directory: GroupNode
}

const EDGE_TYPE_COLORS = {
  import: '#475569',
  state_usage: '#8B5CF6',
  api_call: '#06B6D4'
}

// Set of node IDs connected to the selected node (including itself)
const connectedNodeIds = computed(() => {
  if (!store.selectedNode) return null
  const id = store.selectedNode.id
  const ids = new Set([id])
  store.edges.forEach(edge => {
    if (edge.source === id) ids.add(edge.target)
    if (edge.target === id) ids.add(edge.source)
  })
  return ids
})

// Set of group IDs that contain connected children
const connectedGroupIds = computed(() => {
  if (!connectedNodeIds.value) return null
  const groupIds = new Set()
  store.nodes.forEach(node => {
    if (node.parentNode && connectedNodeIds.value.has(node.id))
      groupIds.add(node.parentNode)
  })
  return groupIds
})

// Node search: match file nodes whose label contains the query (min 2 chars)
const MIN_SEARCH_LEN = 2

const searchMatchIds = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (q.length < MIN_SEARCH_LEN) return null
  const ids = new Set()
  store.nodes.forEach(node => {
    if (node.type === 'directory') return
    const label = (node.data?.label || '').toLowerCase()
    const desc = (node.data?.description || '').toLowerCase()
    if (label.includes(q) || desc.includes(q))
      ids.add(node.id)
  })
  return ids
})

const searchGroupIds = computed(() => {
  if (!searchMatchIds.value) return null
  const groupIds = new Set()
  store.nodes.forEach(node => {
    if (node.parentNode && searchMatchIds.value.has(node.id))
      groupIds.add(node.parentNode)
  })
  return groupIds
})

// Content search: map backend file results to node IDs
const contentMatchIds = computed(() => {
  if (!contentMatchFiles.value) return null
  const ids = new Set()
  store.nodes.forEach(node => {
    if (node.type === 'directory') return
    const files = node.data?.target_files || []
    if (files.some(f => contentMatchFiles.value.has(f)))
      ids.add(node.id)
  })
  return ids
})

const contentGroupIds = computed(() => {
  if (!contentMatchIds.value) return null
  const groupIds = new Set()
  store.nodes.forEach(node => {
    if (node.parentNode && contentMatchIds.value.has(node.id))
      groupIds.add(node.parentNode)
  })
  return groupIds
})

// Debounced content search trigger
watch([searchQuery, contentSearchEnabled], () => {
  clearTimeout(searchDebounce)
  if (!contentSearchEnabled.value) {
    contentMatchFiles.value = null
    return
  }
  const q = searchQuery.value.trim()
  if (q.length < MIN_SEARCH_LEN) {
    contentMatchFiles.value = null
    return
  }
  isSearching.value = true
  searchDebounce = setTimeout(async () => {
    try {
      const data = await store.searchInFiles(q)
      contentMatchFiles.value = new Set(data.results.map(r => r.file))
    } catch {
      contentMatchFiles.value = null
    } finally {
      isSearching.value = false
    }
  }, 300)
})

// Connected edge type counts for the focus badge
const focusEdgeCounts = computed(() => {
  if (!store.selectedNode) return null
  const id = store.selectedNode.id
  const counts = {}
  store.edges.forEach(edge => {
    if (edge.source === id || edge.target === id) {
      const t = edge.type || 'import'
      counts[t] = (counts[t] || 0) + 1
    }
  })
  return counts
})

// Compute absolute position accounting for parentNode offset
function getAbsolutePosition(nodeId) {
  const node = store.nodes.find(n => n.id === nodeId)
  if (!node) return { x: 0, y: 0 }
  let x = node.position.x
  let y = node.position.y
  if (node.parentNode) {
    const parent = store.nodes.find(n => n.id === node.parentNode)
    if (parent) {
      x += parent.position.x
      y += parent.position.y
    }
  }
  return { x, y }
}

async function activateFocusLayout(selectedNode) {
  // Collect connected node IDs (excluding the selected node itself)
  const id = selectedNode.id
  const connectedIds = []
  store.edges.forEach(edge => {
    if (edge.source === id && edge.target !== id) connectedIds.push(edge.target)
    if (edge.target === id && edge.source !== id) connectedIds.push(edge.source)
  })

  if (connectedIds.length === 0) {
    focusPositions.value = null
    return
  }

  // Save viewport only on first activation
  if (!savedViewport.value) {
    savedViewport.value = getViewport()
  }

  // Center = absolute position of selected node
  const center = getAbsolutePosition(id)
  const radius = Math.max(250, connectedIds.length * 50)

  // Build position map
  const positions = {}
  positions[id] = { x: center.x, y: center.y }

  connectedIds.forEach((cid, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / connectedIds.length
    positions[cid] = {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle)
    }
  })

  focusPositions.value = positions

  await nextTick()
  const focusedNodeIds = [id, ...connectedIds]
  fitView({ nodes: focusedNodeIds, padding: 0.3, duration: 400 })
}

async function deactivateFocusLayout() {
  const svp = savedViewport.value
  focusPositions.value = null
  if (svp) {
    await nextTick()
    setViewport(svp, { duration: 400 })
    savedViewport.value = null
  }
}

function deselectNode() {
  store.selectNode(null)
  deactivateFocusLayout()
}

const flowNodes = computed(() => {
  const connected = connectedNodeIds.value
  const connectedGroups = connectedGroupIds.value
  const searched = contentSearchEnabled.value ? contentMatchIds.value : searchMatchIds.value
  const searchedGroups = contentSearchEnabled.value ? contentGroupIds.value : searchGroupIds.value

  // Build effective filter: union when both search + focus are active
  let visibleNodes = null
  let visibleGroups = null
  if (searched && connected) {
    visibleNodes = new Set([...searched, ...connected])
    visibleGroups = new Set([...(searchedGroups || []), ...(connectedGroups || [])])
  } else if (searched) {
    visibleNodes = searched
    visibleGroups = searchedGroups
  } else if (connected) {
    visibleNodes = connected
    visibleGroups = connectedGroups
  }

  const fp = focusPositions.value

  return store.nodes.map(node => {
    // When circle focus is active, override layout
    if (fp) {
      if (node.type === 'directory') {
        // Hide group nodes entirely
        return {
          ...node,
          style: {
            ...(node.style || {}),
            opacity: 0,
            pointerEvents: 'none'
          }
        }
      }

      if (fp[node.id]) {
        // Focused node: detach from parent, place at absolute circle position
        return {
          ...node,
          parentNode: undefined,
          expandParent: undefined,
          position: fp[node.id],
          style: {
            ...getNodeStyle(node.type),
            ...(node.style || {})
          }
        }
      }

      // Non-focused file node: nearly invisible
      return {
        ...node,
        style: {
          ...getNodeStyle(node.type),
          ...(node.style || {}),
          opacity: 0.05,
          filter: 'grayscale(100%)',
          pointerEvents: 'none'
        }
      }
    }

    // Default behavior (no circle focus)
    let dimmed = false
    if (visibleNodes) {
      if (node.type === 'directory')
        dimmed = visibleGroups && !visibleGroups.has(node.id)
      else
        dimmed = !visibleNodes.has(node.id)
    }
    return {
      ...node,
      style: {
        ...(node.type === 'directory' ? {} : getNodeStyle(node.type)),
        ...(node.style || {}),
        ...(dimmed ? { opacity: 0.12, filter: 'grayscale(80%)' } : {})
      }
    }
  })
})

const flowEdges = computed(() => {
  const selectedId = store.selectedNode?.id
  return store.edges.map(edge => {
    const isConnected = selectedId
      ? (edge.source === selectedId || edge.target === selectedId)
      : false
    const edgeType = edge.type || 'import'
    return {
      ...edge,
      style: {
        stroke: selectedId
          ? (isConnected ? EDGE_TYPE_COLORS[edgeType] || '#475569' : 'transparent')
          : '#475569',
        strokeWidth: isConnected ? 3 : 2
      },
      animated: selectedId
        ? isConnected && edgeType === 'api_call'
        : edge.animated || false,
      hidden: selectedId ? !isConnected : false
    }
  })
})

function getNodeStyle(type) {
  const typeColors = {
    publishing: 'var(--color-publishing)',
    logic: 'var(--color-logic)',
    backend: 'var(--color-backend)'
  }
  return {
    borderColor: typeColors[type] || '#475569'
  }
}

function onNodeClick(event) {
  const node = event.node
  if (node.type === 'directory') return
  store.selectNode(node)
  activateFocusLayout(node)
}

function onPaneClick() {
  deselectNode()
}

onMounted(() => {
  setTimeout(() => {
    fitView({ padding: 0.2 })
  }, 100)
})
</script>

<template>
  <div class="workflow-graph">
    <VueFlow
      v-model:nodes="flowNodes"
      v-model:edges="flowEdges"
      :node-types="nodeTypes"
      :default-zoom="0.8"
      :min-zoom="0.3"
      :max-zoom="2"
      fit-view-on-init
      @node-click="onNodeClick"
      @pane-click="onPaneClick"
    >
      <Background pattern-color="#334155" :gap="20" />
      <Controls position="bottom-left" />
      <MiniMap
        :node-color="(node) => getMinimapNodeColor(node)"
        position="bottom-right"
      />

      <!-- Refresh button -->
      <div class="graph-refresh">
        <button
          class="refresh-btn"
          :class="{ spinning: isRefreshing }"
          :disabled="isRefreshing"
          title="Re-read files and rebuild graph"
          @click="refreshGraph"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
          {{ isRefreshing ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>

      <!-- Node search -->
      <div class="node-search">
        <div class="search-input-wrap">
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            :placeholder="contentSearchEnabled ? 'Search in files...' : 'Search node...'"
          />
          <span v-if="isSearching" class="search-spinner"></span>
          <span
            v-else-if="contentSearchEnabled ? contentMatchIds : searchMatchIds"
            class="search-count"
          >{{ (contentSearchEnabled ? contentMatchIds : searchMatchIds).size }}</span>
          <button
            v-if="searchQuery"
            class="search-clear"
            @click="searchQuery = ''"
          >&#x2715;</button>
          <button
            :class="['search-mode-btn', { active: contentSearchEnabled }]"
            @click="contentSearchEnabled = !contentSearchEnabled"
            :title="contentSearchEnabled ? 'File content search ON' : 'File name search'"
          >
            {{ contentSearchEnabled ? '{ }' : 'Aa' }}
          </button>
        </div>
      </div>

      <!-- Focus badge (shown when a node is selected) -->
      <div v-if="store.selectedNode" class="focus-badge">
        <span class="focus-label">{{ store.selectedNode.data?.label }}</span>
        <span class="focus-count">{{ connectedNodeIds.size - 1 }} connections</span>
        <div v-if="focusEdgeCounts" class="focus-edge-types">
          <span v-if="focusEdgeCounts.import" class="edge-tag edge-import">
            import {{ focusEdgeCounts.import }}
          </span>
          <span v-if="focusEdgeCounts.state_usage" class="edge-tag edge-state">
            state {{ focusEdgeCounts.state_usage }}
          </span>
          <span v-if="focusEdgeCounts.api_call" class="edge-tag edge-api">
            api {{ focusEdgeCounts.api_call }}
          </span>
        </div>
        <button class="focus-reset" @click="deselectNode()">&#x2715;</button>
      </div>

      <!-- Legend -->
      <div class="graph-legend">
        <div class="legend-title">Layers</div>
        <div class="legend-items">
          <div class="legend-item">
            <span class="legend-dot" style="background: var(--color-publishing)"></span>
            Publishing
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: var(--color-logic)"></span>
            Logic
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: var(--color-backend)"></span>
            Backend
          </div>
        </div>

        <!-- Edge type legend (shown when a node is selected) -->
        <template v-if="store.selectedNode">
          <div class="legend-title" style="margin-top: 0.75rem;">Edge Types</div>
          <div class="legend-items">
            <div class="legend-item">
              <span class="legend-line" style="background: #475569"></span>
              import
            </div>
            <div class="legend-item">
              <span class="legend-line" style="background: #8B5CF6"></span>
              state_usage
            </div>
            <div class="legend-item">
              <span class="legend-line" style="background: #06B6D4"></span>
              api_call
            </div>
          </div>
        </template>
      </div>
    </VueFlow>
  </div>
</template>

<script>
function getMinimapNodeColor(node) {
  const typeColors = {
    publishing: '#EC4899',
    logic: '#8B5CF6',
    backend: '#06B6D4',
    directory: '#475569'
  }
  return typeColors[node.type] || '#475569'
}
</script>

<style scoped>
/* Smooth animation for circle focus layout transitions */
:deep(.vue-flow__node) {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}

.workflow-graph {
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.graph-legend {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  z-index: 10;
}

.legend-title {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-line {
  width: 16px;
  height: 3px;
  border-radius: 2px;
}

/* Focus badge */
.focus-badge {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--accent-primary, #3B82F6);
  border-radius: 10px;
  z-index: 10;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.focus-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.focus-count {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.focus-edge-types {
  display: flex;
  gap: 0.375rem;
}

.edge-tag {
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.edge-import {
  background: rgba(71, 85, 105, 0.3);
  color: #94A3B8;
}

.edge-state {
  background: rgba(139, 92, 246, 0.2);
  color: #A78BFA;
}

.edge-api {
  background: rgba(6, 182, 212, 0.2);
  color: #22D3EE;
}

.focus-reset {
  padding: 0.25rem 0.5rem;
  background: none;
  color: var(--text-muted);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.6875rem;
  cursor: pointer;
  transition: all 0.15s;
}

.focus-reset:hover {
  color: var(--text-primary);
  border-color: var(--text-secondary);
}

/* Refresh button */
.graph-refresh {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.4rem 0.875rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.refresh-btn:hover:not(:disabled) {
  border-color: #6366F1;
  color: #818CF8;
  background: rgba(99, 102, 241, 0.08);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-btn.spinning svg {
  animation: refresh-spin 0.8s linear infinite;
}

@keyframes refresh-spin {
  to { transform: rotate(360deg); }
}

/* Node search */
.node-search {
  position: absolute;
  top: 3.25rem;
  right: 1rem;
  z-index: 10;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.375rem 0.625rem;
  transition: border-color 0.2s;
}

.search-input-wrap:focus-within {
  border-color: var(--accent-primary, #3B82F6);
}

.search-input {
  width: 140px;
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 0.8125rem;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-count {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--accent-primary, #3B82F6);
  background: rgba(59, 130, 246, 0.15);
  padding: 0.0625rem 0.375rem;
  border-radius: 4px;
  min-width: 1.25rem;
  text-align: center;
}

.search-clear {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0 0.125rem;
  line-height: 1;
}

.search-clear:hover {
  color: var(--text-primary);
}

.search-mode-btn {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  font-size: 0.6875rem;
  font-weight: 700;
  font-family: monospace;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.search-mode-btn.active {
  background: rgba(6, 182, 212, 0.15);
  color: #22D3EE;
  border-color: #06B6D4;
}

.search-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent-primary, #3B82F6);
  border-radius: 50%;
  animation: search-spin 0.8s linear infinite;
}

@keyframes search-spin {
  to { transform: rotate(360deg); }
}
</style>
