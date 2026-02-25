<script setup>
import { computed, ref } from 'vue'
import { useWorkflowStore } from '../stores/workflowStore'

const store = useWorkflowStore()

// Set of expanded folder IDs
const expanded = ref(new Set())

// Build hierarchical tree from flat store nodes
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

// Flatten tree respecting expanded state for rendering
const flatList = computed(() => {
  const result = []
  function walk(nodes, depth) {
    nodes.forEach(node => {
      result.push({ ...node, depth, hasChildren: node.children.length > 0 })
      if (expanded.value.has(node.id) && node.children.length > 0) {
        walk(node.children, depth + 1)
      }
    })
  }
  walk(folderTree.value, 0)
  return result
})

const totalFolders = computed(() => store.nodes.filter(n => n.type === 'directory').length)

function toggle(id) {
  if (expanded.value.has(id)) expanded.value.delete(id)
  else expanded.value.add(id)
}

function selectFolder(id) {
  store.selectFolder(id)
}

function clearFilter() {
  store.selectFolder(null)
  // force null (store.selectFolder toggles, so call directly)
  store.selectedFolderNodeId = null
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
    <div class="tree-header">
      <div class="tree-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        Folders
        <span class="tree-total">{{ totalFolders }}</span>
      </div>
      <div class="tree-actions">
        <button class="tree-action-btn" title="Expand all" @click="expandAll">+</button>
        <button class="tree-action-btn" title="Collapse all" @click="collapseAll">−</button>
      </div>
    </div>

    <div v-if="store.selectedFolderNodeId" class="active-filter">
      <span class="active-filter-label">Filtered</span>
      <button class="active-filter-clear" @click="store.selectedFolderNodeId = null" title="Clear filter">✕</button>
    </div>

    <div class="tree-body">
      <div v-if="flatList.length === 0" class="tree-empty">
        No folders
      </div>
      <button
        v-for="item in flatList"
        :key="item.id"
        class="tree-item"
        :class="{ active: store.selectedFolderNodeId === item.id }"
        :style="{ paddingLeft: `${0.625 + item.depth * 0.875}rem` }"
        @click="selectFolder(item.id)"
      >
        <span
          class="tree-expand"
          :class="{ visible: item.hasChildren, open: expanded.has(item.id) }"
          @click.stop="toggle(item.id)"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </span>
        <svg class="folder-icon" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <span class="tree-label" :title="item.label">{{ item.label }}</span>
        <span class="tree-count">{{ item.fileCount }}</span>
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

.active-filter-clear:hover {
  opacity: 1;
}

.tree-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.375rem 0;
}

.tree-body::-webkit-scrollbar {
  width: 4px;
}

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

.tree-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  width: 100%;
  padding-top: 0.3125rem;
  padding-bottom: 0.3125rem;
  padding-right: 0.625rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary, #94A3B8);
  font-size: 0.75rem;
  font-family: inherit;
  text-align: left;
  transition: background 0.1s, color 0.1s;
  border-radius: 0;
}

.tree-item:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary, #E2E8F0);
}

.tree-item.active {
  background: rgba(99, 102, 241, 0.15);
  color: #A5B4FC;
}

.tree-item.active .folder-icon {
  color: #818CF8;
}

.tree-expand {
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text-muted, #64748B);
  opacity: 0;
  border-radius: 3px;
  transition: transform 0.15s, opacity 0.15s;
}

.tree-expand.visible {
  opacity: 1;
}

.tree-expand.open {
  transform: rotate(90deg);
}

.tree-expand:hover {
  background: rgba(255, 255, 255, 0.08);
}

.folder-icon {
  flex-shrink: 0;
  color: var(--text-muted, #64748B);
  opacity: 0.7;
}

.tree-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-count {
  flex-shrink: 0;
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--text-muted, #64748B);
  background: var(--bg-tertiary, #0F172A);
  padding: 0.0625rem 0.3rem;
  border-radius: 4px;
  min-width: 1.25rem;
  text-align: center;
}
</style>
