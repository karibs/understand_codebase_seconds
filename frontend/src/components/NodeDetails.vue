<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useWorkflowStore } from '../stores/workflowStore'

const store = useWorkflowStore()

const node = computed(() => store.selectedNode)
const nodeData = computed(() => node.value?.data || {})

const typeLabels = {
  publishing: 'Publishing',
  logic: 'Front Logic',
  backend: 'Backend'
}

function onFileClick(file) {
  store.readFileContent(file)
}

const previewLines = computed(() => {
  const content = store.fileContent?.content
  if (!content) return []
  return content.split('\n')
})

const isDownloading = ref(false)

async function downloadZip() {
  const files = nodeData.value?.target_files
  if (!files?.length) return
  isDownloading.value = true
  try {
    await store.downloadFilesAsZip(files, nodeData.value.label || 'files')
  } finally {
    isDownloading.value = false
  }
}

const isExpanded = ref(false)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function onKeydown(e) {
  if (e.key === 'Escape' && isExpanded.value) {
    isExpanded.value = false
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="node-details card">
    <div class="details-header">
      <h3 class="card-title">
        <span class="title-icon">&#128203;</span>
        Node Info
      </h3>
      <span :class="['badge', `badge-${node?.type}`]">
        {{ typeLabels[node?.type] || '-' }}
      </span>
    </div>

    <div class="details-content">
      <!-- Basic Info -->
      <div class="info-section">
        <div class="info-row">
          <span class="info-label">Name</span>
          <span class="info-value">{{ nodeData.label || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Path</span>
          <span class="info-value">{{ nodeData.description || '-' }}</span>
        </div>
      </div>

      <!-- Target Files -->
      <div v-if="nodeData.target_files?.length" class="files-section">
        <div class="files-header">
          <h4 class="section-title">Files</h4>
          <button
            class="btn-download"
            @click="downloadZip"
            :disabled="isDownloading"
            title="Download all files as ZIP"
          >
            <span v-if="isDownloading" class="spinner-small"></span>
            <span v-else>&#x1F4E5;</span>
            ZIP
          </button>
        </div>
        <ul class="files-list">
          <li
            v-for="file in nodeData.target_files"
            :key="file"
            class="file-item file-item-clickable"
            :class="{ active: store.fileContent?.file === file }"
            @click="onFileClick(file)"
          >
            <span class="file-icon">&#128196;</span>
            {{ file }}
          </li>
        </ul>
      </div>

      <!-- Code Preview -->
      <div v-if="store.isLoadingFile" class="code-preview-loading">
        <span class="spinner-small"></span>
        Loading file...
      </div>

      <div v-else-if="store.fileContent" class="code-preview" :class="{ expanded: isExpanded }">
        <div v-if="isExpanded" class="expanded-backdrop" @click="toggleExpand"></div>
        <div class="code-preview-inner" :class="{ 'expanded-panel': isExpanded }">
          <div class="code-preview-header">
            <span class="code-preview-filename">{{ store.fileContent.file }}</span>
            <div class="code-preview-actions">
              <span class="code-preview-meta">
                {{ store.fileContent.lines }} lines &middot; {{ (store.fileContent.size / 1024).toFixed(1) }}KB
              </span>
              <button class="btn-expand" @click="toggleExpand" :title="isExpanded ? 'Collapse' : 'Expand'">
                <span v-if="isExpanded">&#x2715;</span>
                <span v-else>&#x26F6;</span>
              </button>
            </div>
          </div>

          <div v-if="store.fileContent.error && !store.fileContent.content" class="code-preview-error">
            {{ store.fileContent.error }}
          </div>

          <div v-else-if="store.fileContent.content !== null" class="code-block-wrapper">
            <pre class="code-block"><code><template v-for="(line, i) in previewLines" :key="i"><span class="line-number">{{ i + 1 }}</span><span class="line-content">{{ line }}</span>
</template></code></pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.node-details {
  overflow-y: auto;
}

.details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.title-icon {
  font-size: 1.125rem;
}

.details-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}

.info-label {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.info-value {
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 500;
}

.section-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0;
}

.files-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.btn-download {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 0.6875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-download:hover:not(:disabled) {
  background: var(--bg-primary);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.btn-download:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.files-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--text-primary);
  padding: 0.375rem 0.5rem;
  background: var(--bg-tertiary);
  border-radius: 6px;
}

.file-item-clickable {
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  border: 1px solid transparent;
}

.file-item-clickable:hover {
  background: var(--bg-primary);
  border-color: var(--accent-primary);
}

.file-item-clickable.active {
  border-color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.1);
}

.file-icon {
  font-size: 0.875rem;
}

/* Code Preview */
.code-preview-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--text-muted);
  padding: 1rem 0;
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.code-preview {
  position: relative;
}

.code-preview-inner {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.code-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.code-preview-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.code-preview-filename {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.code-preview-meta {
  font-size: 0.6875rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.btn-expand {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  transition: all 0.15s;
  flex-shrink: 0;
}

.btn-expand:hover {
  background: var(--bg-primary);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.code-preview-error {
  font-size: 0.8125rem;
  color: var(--color-error, #ef4444);
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.08);
  border-radius: 8px;
}

.code-block-wrapper {
  max-height: 40vh;
  overflow: auto;
  border-radius: 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
}

/* Expanded / fullscreen overlay */
.expanded-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
}

.expanded-panel {
  position: fixed;
  inset: 2rem;
  z-index: 1000;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
}

.expanded-panel .code-block-wrapper {
  max-height: none;
  flex: 1;
  min-height: 0;
}

.code-block {
  margin: 0;
  padding: 0.75rem 0;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  white-space: pre;
  tab-size: 4;
}

.line-number {
  display: inline-block;
  width: 3.5rem;
  padding-right: 0.75rem;
  text-align: right;
  color: var(--text-muted);
  user-select: none;
  opacity: 0.5;
}

.line-content {
  /* allow long lines to extend */
}

.badge {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
}

.badge-publishing {
  background: rgba(236, 72, 153, 0.15);
  color: var(--color-publishing);
}

.badge-logic {
  background: rgba(139, 92, 246, 0.15);
  color: var(--color-logic);
}

.badge-backend {
  background: rgba(6, 182, 212, 0.15);
  color: var(--color-backend);
}
</style>
