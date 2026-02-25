<script setup>
import { computed, ref } from 'vue'
import { useWorkflowStore } from '../stores/workflowStore'

const store = useWorkflowStore()

const expanded = ref(new Set())

const TYPE_COLORS = {
  publishing: '#EC4899',
  logic:      '#8B5CF6',
  backend:    '#06B6D4'
}

// Build hierarchical folder tree
const folderTree = computed(() => {
  const dirs = store.nodes.filter(n => n.type === 'directory')
  const dirIds = new Set(dirs.map(n => n.id))

  function children(parentId) {
    return dirs
      .filter(n => n.parentNode === parentId)
      .map(n => ({
        id: n.id,
        label: n.data.label,
        fileCount: n.data.fileCount ?? 0,
        children: children(n.id)
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }

  return dirs
    .filter(n => !n.parentNode || !dirIds.has(n.parentNode))
    .map(n => ({
      id: n.id,
      label: n.data.label,
      fileCount: n.data.fileCount ?? 0,
      children: children(n.id)
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

// Flatten tree: folders + file nodes when folder is expanded
const flatList = computed(() => {
  const result = []
  const fileNodes = store.nodes.filter(n => n.type !== 'directory')

  function walk(nodes, depth) {
    nodes.forEach(folder => {
      const isOpen = expanded.value.has(folder.id)
      result.push({
        id: folder.id,
        label: folder.label,
        fileCount: folder.fileCount,
        depth,
        isFolder: true,
        hasChildren: folder.children.length > 0 || folder.fileCount > 0,
        isOpen
      })

      if (isOpen) {
        // nested sub-folders first
        if (folder.children.length > 0) walk(folder.children, depth + 1)

        // then file nodes belonging to this folder
        fileNodes
          .filter(n => n.parentNode === folder.id)
          .sort((a, b) => (a.data.label || '').localeCompare(b.data.label || ''))
          .forEach(n => {
            result.push({
              id: n.id,
              label: n.data.label || n.id,
              depth: depth + 1,
              isFolder: false,
              hasChildren: false,
              isOpen: false,
              nodeType: n.type,
              storeNode: n
            })
          })
      }
    })
  }

  walk(folderTree.value, 0)
  return result
})

const totalFolders = computed(() => store.nodes.filter(n => n.type === 'directory').length)

function toggleFolder(id) {
  if (expanded.value.has(id)) expanded.value.delete(id)
  else expanded.value.add(id)
}

function clickFolder(id) {
  // expand/collapse + set folder filter
  toggleFolder(id)
  store.selectFolder(id)
}

function clickFile(item) {
  store.selectNode(item.storeNode)
}

function expandAll() {
  store.nodes.filter(n => n.type === 'directory').forEach(n => expanded.value.add(n.id))
}

function collapseAll() {
  expanded.value.clear()
}
</script>

<template>
  <div class="folder-tree">
    <!-- Header -->
    <div class="tree-header">
      <div class="tree-title">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        Explorer
        <span class="tree-total">{{ totalFolders }}</span>
      </div>
      <div class="tree-actions">
        <button class="tree-action-btn" title="Expand all" @click="expandAll">+</button>
        <button class="tree-action-btn" title="Collapse all" @click="collapseAll">−</button>
      </div>
    </div>

    <!-- Active folder filter banner -->
    <div v-if="store.selectedFolderNodeId" class="active-filter">
      <span class="active-filter-label">Folder filter active</span>
      <button class="active-filter-clear" @click="store.selectedFolderNodeId = null" title="Clear filter">✕</button>
    </div>

    <!-- Tree body -->
    <div class="tree-body">
      <div v-if="flatList.length === 0" class="tree-empty">No folders</div>

      <button
        v-for="item in flatList"
        :key="item.id"
        class="tree-item"
        :class="{
          'is-folder': item.isFolder,
          'is-file': !item.isFolder,
          'folder-active': item.isFolder && store.selectedFolderNodeId === item.id,
          'file-active': !item.isFolder && store.selectedNode?.id === item.id
        }"
        :style="{ paddingLeft: `${0.5 + item.depth * 0.875}rem` }"
        @click="item.isFolder ? clickFolder(item.id) : clickFile(item)"
      >
        <!-- Expand chevron (folders only) -->
        <span
          v-if="item.isFolder"
          class="tree-chevron"
          :class="{ open: item.isOpen, visible: item.hasChildren }"
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </span>
        <span v-else class="tree-chevron"></span>

        <!-- Folder icon -->
        <svg
          v-if="item.isFolder"
          class="item-icon folder-icon"
          :class="{ open: item.isOpen }"
          width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>

        <!-- File type dot -->
        <span
          v-else
          class="file-dot"
          :style="{ background: TYPE_COLORS[item.nodeType] || '#475569' }"
        ></span>

        <!-- Label -->
        <span class="tree-label" :title="item.label">{{ item.label }}</span>

        <!-- File count (folders only) -->
        <span v-if="item.isFolder" class="tree-count">{{ item.fileCount }}</span>

        <!-- File type tag -->
        <span
          v-else
          class="file-type-tag"
          :style="{ color: TYPE_COLORS[item.nodeType] || '#475569' }"
        >{{ item.nodeType }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.folder-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary, #1E293B);
  border-right: 1px solid var(--border-color, #334155);
  overflow: hidden;
}

/* ── Header ── */
.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0.875rem;
  border-bottom: 1px solid var(--border-color, #334155);
  flex-shrink: 0;
}

.tree-title {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-muted, #64748B);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tree-total {
  background: var(--bg-tertiary, #0F172A);
  color: var(--text-muted, #64748B);
  font-size: 0.625rem;
  padding: 0.0625rem 0.35rem;
  border-radius: 4px;
  font-weight: 700;
}

.tree-actions {
  display: flex;
  gap: 0.25rem;
}

.tree-action-btn {
  background: none;
  border: 1px solid var(--border-color, #334155);
  color: var(--text-muted, #64748B);
  width: 20px;
  height: 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.15s;
}

.tree-action-btn:hover {
  color: var(--text-primary, #E2E8F0);
  border-color: var(--text-secondary, #94A3B8);
}

/* ── Active filter banner ── */
.active-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.3rem 0.875rem;
  background: rgba(99, 102, 241, 0.12);
  border-bottom: 1px solid rgba(99, 102, 241, 0.25);
  flex-shrink: 0;
}

.active-filter-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #818CF8;
}

.active-filter-clear {
  background: none;
  border: none;
  color: #818CF8;
  font-size: 0.625rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.15s;
}

.active-filter-clear:hover { opacity: 1; }

/* ── Tree body ── */
.tree-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.25rem 0;
}

.tree-body::-webkit-scrollbar { width: 4px; }
.tree-body::-webkit-scrollbar-thumb {
  background: var(--border-color, #334155);
  border-radius: 2px;
}

.tree-empty {
  padding: 1.5rem 1rem;
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-muted, #64748B);
}

/* ── Tree items ── */
.tree-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  width: 100%;
  padding-top: 0.28rem;
  padding-bottom: 0.28rem;
  padding-right: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  font-family: inherit;
  text-align: left;
  transition: background 0.1s, color 0.1s;
}

.is-folder {
  color: var(--text-secondary, #94A3B8);
}

.is-file {
  color: var(--text-muted, #64748B);
  font-size: 0.6875rem;
}

.tree-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.tree-item.is-folder:hover { color: var(--text-primary, #E2E8F0); }
.tree-item.is-file:hover   { color: var(--text-secondary, #94A3B8); }

.folder-active {
  background: rgba(99, 102, 241, 0.14) !important;
  color: #A5B4FC !important;
}

.file-active {
  background: rgba(255, 255, 255, 0.06) !important;
  color: var(--text-primary, #E2E8F0) !important;
}

/* ── Expand chevron ── */
.tree-chevron {
  width: 13px;
  height: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text-muted, #64748B);
  opacity: 0;
  border-radius: 3px;
  transition: transform 0.15s, opacity 0.15s;
}

.tree-chevron.visible { opacity: 1; }
.tree-chevron.open    { transform: rotate(90deg); }

/* ── Icons ── */
.item-icon {
  flex-shrink: 0;
}

.folder-icon {
  color: #94A3B8;
  opacity: 0.65;
  transition: color 0.15s, opacity 0.15s;
}

.folder-icon.open {
  color: #A5B4FC;
  opacity: 1;
}

.folder-active .folder-icon {
  color: #818CF8;
  opacity: 1;
}

.file-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  opacity: 0.85;
}

/* ── Labels & badges ── */
.tree-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.tree-count {
  flex-shrink: 0;
  font-size: 0.5625rem;
  font-weight: 700;
  color: var(--text-muted, #64748B);
  background: var(--bg-tertiary, #0F172A);
  padding: 0.0625rem 0.3rem;
  border-radius: 4px;
  min-width: 1.1rem;
  text-align: center;
}

.file-type-tag {
  flex-shrink: 0;
  font-size: 0.5625rem;
  font-weight: 600;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
</style>
