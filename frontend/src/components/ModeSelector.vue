<script setup>
import { ref, onMounted } from 'vue'
import { useWorkflowStore } from '../stores/workflowStore'

const store = useWorkflowStore()
const existingProject = ref(null)
const isLoadingExisting = ref(false)

const emit = defineEmits(['select-mode'])

onMounted(async () => {
  existingProject.value = await store.checkExistingProject()
})

async function continueProject() {
  isLoadingExisting.value = true
  try {
    await store.loadExistingProject()
  } catch (error) {
    console.error('Failed to load project:', error)
  } finally {
    isLoadingExisting.value = false
  }
}
</script>

<template>
  <div class="mode-selector-container">
    <!-- Existing Project Banner -->
    <div v-if="existingProject?.exists" class="existing-project-banner">
      <div class="existing-project-card">
        <div class="existing-icon">📂</div>
        <div class="existing-info">
          <h3>Existing Project</h3>
          <p class="existing-idea">{{ existingProject.idea }}</p>
          <div class="existing-stats">
            <span>{{ existingProject.completedCount }}/{{ existingProject.nodeCount }} completed</span>
          </div>
        </div>
        <button
          class="btn btn-continue"
          @click="continueProject"
          :disabled="isLoadingExisting"
        >
          <span v-if="isLoadingExisting" class="spinner"></span>
          {{ isLoadingExisting ? 'Loading...' : 'Continue →' }}
        </button>
      </div>
    </div>

    <!-- Mode Cards -->
    <div class="mode-cards">
      <div class="mode-card" @click="emit('select-mode', 'create')">
        <div class="mode-icon">🚀</div>
        <h2 class="mode-title">Create New Project</h2>
        <p class="mode-description">
          Plan your idea with AI and<br>generate a workflow
        </p>
        <button class="btn btn-primary mode-btn">Get Started</button>
      </div>

      <div class="mode-card" @click="emit('select-mode', 'analyze')">
        <div class="mode-icon">🔍</div>
        <h2 class="mode-title">Analyze Existing Project</h2>
        <p class="mode-description">
          Select a local project folder to<br>analyze and visualize its structure
        </p>
        <button class="btn btn-analyze mode-btn">Analyze</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mode-selector-container {
  width: 100%;
  height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 2rem;
}

/* Existing Project Banner */
.existing-project-banner {
  width: 100%;
  max-width: 820px;
}

.existing-project-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
  border: 1px solid var(--accent-primary);
  border-radius: 12px;
}

.existing-icon {
  font-size: 2rem;
}

.existing-info {
  flex: 1;
  min-width: 0;
}

.existing-info h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.existing-idea {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.25rem;
}

.existing-stats {
  font-size: 0.75rem;
  color: var(--accent-primary);
  font-weight: 500;
}

.btn-continue {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-continue:hover:not(:disabled) {
  background: #2563EB;
}

.btn-continue:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Mode Cards */
.mode-cards {
  display: flex;
  gap: 2rem;
  width: 100%;
  max-width: 820px;
  justify-content: center;
}

.mode-card {
  flex: 1;
  max-width: 380px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.25s;
}

.mode-card:hover {
  border-color: var(--accent-primary);
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(59, 130, 246, 0.15);
}

.mode-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.mode-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.mode-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.mode-btn {
  margin-top: 0.5rem;
  padding: 0.625rem 1.5rem;
  font-size: 0.9375rem;
  pointer-events: none;
}

.btn-analyze {
  background: var(--accent-secondary);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-analyze:hover {
  background: #7C3AED;
}

@media (max-width: 768px) {
  .mode-cards {
    flex-direction: column;
    align-items: center;
  }

  .mode-card {
    max-width: 100%;
  }
}
</style>
