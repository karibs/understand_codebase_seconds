<script setup>
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'

const props = defineProps({
  id: String,
  type: String,
  data: Object,
  selected: Boolean
})

const typeConfig = {
  publishing: {
    icon: '🎨',
    color: 'var(--color-publishing)',
    bgColor: 'rgba(236, 72, 153, 0.1)'
  },
  logic: {
    icon: '⚙️',
    color: 'var(--color-logic)',
    bgColor: 'rgba(139, 92, 246, 0.1)'
  },
  backend: {
    icon: '🔌',
    color: 'var(--color-backend)',
    bgColor: 'rgba(6, 182, 212, 0.1)'
  }
}

const statusConfig = {
  pending: { label: 'Pending', class: 'status-pending' },
  in_progress: { label: 'In Progress', class: 'status-in-progress' },
  in_review: { label: 'In Review', class: 'status-in-review' },
  completed: { label: 'Completed', class: 'status-completed' },
  failed: { label: 'Failed', class: 'status-failed' }
}

const config = computed(() => typeConfig[props.type] || typeConfig.publishing)
const status = computed(() => statusConfig[props.data?.status] || statusConfig.pending)

const nodeClass = computed(() => ({
  'custom-node': true,
  'node-selected': props.selected,
  [`node-${props.type}`]: true,
  [`node-${props.data?.status}`]: true
}))
</script>

<template>
  <div :class="nodeClass" :style="{ '--node-color': config.color, '--node-bg': config.bgColor }">
    <Handle type="target" :position="Position.Left" />

    <div class="node-header">
      <span class="node-icon">{{ config.icon }}</span>
      <span :class="['node-status', status.class]">{{ status.label }}</span>
    </div>

    <div class="node-body">
      <h4 class="node-label">{{ data?.label || 'Untitled' }}</h4>
      <p v-if="data?.target_files?.length" class="node-files">
        {{ data.target_files.length }} files
      </p>
    </div>

    <Handle type="source" :position="Position.Right" />
  </div>
</template>

<style scoped>
.custom-node {
  min-width: 180px;
  background: var(--bg-secondary);
  border: 2px solid var(--node-color);
  border-radius: 12px;
  padding: 0;
  overflow: hidden;
  transition: all 0.2s;
  cursor: pointer;
}

.custom-node:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.node-selected {
  box-shadow: 0 0 0 3px var(--node-color);
}

.node-pending {
  opacity: 0.6;
}

.node-in-progress {
  animation: pulse-border 2s ease-in-out infinite;
}

@keyframes pulse-border {
  0%, 100% { box-shadow: 0 0 0 0 var(--node-color); }
  50% { box-shadow: 0 0 0 4px transparent; }
}

.node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: var(--node-bg);
  border-bottom: 1px solid var(--border-color);
}

.node-icon {
  font-size: 1.125rem;
}

.node-status {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
}

.status-pending {
  background: rgba(156, 163, 175, 0.2);
  color: var(--color-pending);
}

.status-in-progress {
  background: rgba(59, 130, 246, 0.2);
  color: var(--accent-primary);
}

.status-in-review {
  background: rgba(245, 158, 11, 0.2);
  color: var(--color-warning);
}

.status-completed {
  background: rgba(16, 185, 129, 0.2);
  color: var(--color-success);
}

.status-failed {
  background: rgba(239, 68, 68, 0.2);
  color: var(--color-error);
}

.node-body {
  padding: 0.75rem;
}

.node-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  line-height: 1.3;
}

.node-files {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

/* Handle Styles */
:deep(.vue-flow__handle) {
  width: 10px;
  height: 10px;
  background: var(--bg-tertiary);
  border: 2px solid var(--node-color);
}

:deep(.vue-flow__handle:hover) {
  background: var(--node-color);
}
</style>
