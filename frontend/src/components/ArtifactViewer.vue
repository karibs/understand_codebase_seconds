<script setup>
import { ref, computed } from 'vue'
import { useWorkflowStore } from '../stores/workflowStore'

const store = useWorkflowStore()
const selectedArtifact = ref(null)
const isExpanded = ref(false)

const artifactList = computed(() => {
  const artifacts = store.artifacts
  return Object.entries(artifacts).map(([name, content]) => ({
    name,
    content,
    type: getArtifactType(name)
  }))
})

function getArtifactType(name) {
  if (name.includes('overview')) return { icon: '📋', label: 'Planning' }
  if (name.includes('feature')) return { icon: '📝', label: 'Features' }
  if (name.includes('ui-contract')) return { icon: '🎨', label: 'UI Contract' }
  if (name.includes('logic-contract')) return { icon: '⚙️', label: 'Logic Contract' }
  if (name.includes('api-contract')) return { icon: '🔌', label: 'API Contract' }
  return { icon: '📄', label: 'Document' }
}

function selectArtifact(artifact) {
  if (selectedArtifact.value?.name === artifact.name) {
    selectedArtifact.value = null
  } else {
    selectedArtifact.value = artifact
    isExpanded.value = true
  }
}

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div class="artifact-viewer card">
    <div class="viewer-header" @click="toggleExpand">
      <h3 class="card-title">
        <span class="title-icon">📚</span>
        Artifacts
      </h3>
      <button class="expand-btn">
        {{ isExpanded ? '▼' : '▶' }}
      </button>
    </div>

    <div v-show="isExpanded" class="viewer-content">
      <!-- Artifact List -->
      <div class="artifact-list">
        <div
          v-for="artifact in artifactList"
          :key="artifact.name"
          :class="['artifact-item', { 'item-selected': selectedArtifact?.name === artifact.name }]"
          @click="selectArtifact(artifact)"
        >
          <span class="artifact-icon">{{ artifact.type.icon }}</span>
          <div class="artifact-info">
            <span class="artifact-name">{{ artifact.name }}</span>
            <span class="artifact-type">{{ artifact.type.label }}</span>
          </div>
        </div>

        <div v-if="!artifactList.length" class="no-artifacts">
          <p>No artifacts generated yet.</p>
        </div>
      </div>

      <!-- Artifact Content Preview -->
      <div v-if="selectedArtifact" class="artifact-preview">
        <div class="preview-header">
          <h4>{{ selectedArtifact.name }}</h4>
          <button class="close-btn" @click="selectedArtifact = null">×</button>
        </div>
        <pre class="preview-content">{{ selectedArtifact.content }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.artifact-viewer {
  flex-shrink: 0;
}

.viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  margin-bottom: 0;
}

.viewer-header .card-title {
  margin-bottom: 0;
}

.expand-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.25rem;
}

.viewer-content {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.artifact-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.artifact-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-tertiary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.artifact-item:hover {
  background: var(--bg-primary);
}

.item-selected {
  border-color: var(--accent-primary);
  background: rgba(59, 130, 246, 0.1);
}

.artifact-icon {
  font-size: 1.25rem;
}

.artifact-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.artifact-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-primary);
}

.artifact-type {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.no-artifacts {
  padding: 1.5rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.artifact-preview {
  background: var(--bg-tertiary);
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

.preview-header h4 {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: var(--text-primary);
}

.preview-content {
  padding: 1rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
  margin: 0;
  font-family: 'Monaco', 'Menlo', monospace;
  line-height: 1.6;
}
</style>
