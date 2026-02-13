<script setup>
import { ref, onMounted } from 'vue'
import { useWorkflowStore } from '../stores/workflowStore'

const store = useWorkflowStore()
const idea = ref('')
const existingProject = ref(null)
const isLoadingExisting = ref(false)

const emit = defineEmits(['start-chat'])

const exampleIdeas = [
  'Todo App - category sorting and priority features',
  'Real-time Chat App - 1:1 and group chat support',
  'Simple Blog Platform - markdown support, comment feature'
]

onMounted(async () => {
  existingProject.value = await store.checkExistingProject()
})

function handleSubmit() {
  if (!idea.value.trim()) return
  emit('start-chat', idea.value.trim())
}

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

function useExample(example) {
  idea.value = example
}
</script>

<template>
  <div class="idea-input-container">
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

    <div class="main-content-row">
    <!-- Left: Input Card -->
    <div class="idea-input-card">
      <div class="card-header">
        <h2 class="card-title">
          <span class="title-icon">💡</span>
          Start New Project
        </h2>
        <p class="card-description">
          Enter a web app idea, and AI will generate a project plan and development roadmap.
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="idea-form">
        <div class="form-group">
          <label for="idea" class="form-label">Project Idea</label>
          <textarea
            id="idea"
            v-model="idea"
            class="textarea"
            placeholder="e.g. A calendar app where users can manage schedules and receive notifications"
            :disabled="isSubmitting"
          ></textarea>
        </div>

        <button
          type="submit"
          class="btn btn-primary submit-btn"
          :disabled="!idea.trim()"
        >
          Start Planning with AI
        </button>
      </form>

      <div class="examples-section">
        <h3 class="examples-title">Example Ideas</h3>
        <div class="examples-list">
          <button
            v-for="(example, index) in exampleIdeas"
            :key="index"
            class="example-btn"
            @click="useExample(example)"
            :disabled="isSubmitting"
          >
            {{ example }}
          </button>
        </div>
      </div>
    </div>

    <!-- Right: Workflow Preview (2/3 of screen) -->
    <div class="workflow-preview">
      <h3 class="preview-title">
        <span>📊</span>
        Workflow Preview
      </h3>
      <div class="preview-stages">
        <div class="stage-item">
          <div class="stage-icon stage-planning">📋</div>
          <div class="stage-info">
            <h4>1. Planning</h4>
            <p>overview.md</p>
            <p>feature_list.md</p>
          </div>
        </div>
        <div class="stage-arrow">→</div>
        <div class="stage-item">
          <div class="stage-icon stage-publishing">🎨</div>
          <div class="stage-info">
            <h4>2. Publishing</h4>
            <p>ui-contract.md</p>
            <p>Screen definitions & components</p>
          </div>
        </div>
        <div class="stage-arrow">→</div>
        <div class="stage-item">
          <div class="stage-icon stage-logic">⚙️</div>
          <div class="stage-info">
            <h4>3. Front Logic</h4>
            <p>logic-contract.md</p>
            <p>Data flow & state management</p>
          </div>
        </div>
        <div class="stage-arrow">→</div>
        <div class="stage-item">
          <div class="stage-icon stage-backend">🔌</div>
          <div class="stage-info">
            <h4>4. Backend</h4>
            <p>api-contract.md</p>
            <p>API spec & schema</p>
          </div>
        </div>
      </div>

      <div class="preview-description">
        <h4>Development Process</h4>
        <ul>
          <li><strong>Contract-based development:</strong> Each stage's output feeds into the next</li>
          <li><strong>Human-in-the-loop:</strong> AI plans, humans implement</li>
          <li><strong>Stage-by-stage approval:</strong> Review artifacts before proceeding</li>
        </ul>
      </div>
    </div>
    </div>
  </div>
</template>

<style scoped>
.idea-input-container {
  width: 100%;
  height: calc(100vh - 140px);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Existing Project Banner */
.existing-project-banner {
  flex-shrink: 0;
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

.main-content-row {
  flex: 1;
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
  min-height: 0;
}

.idea-input-card {
  flex: 1;
  min-width: 0;
  background: var(--bg-secondary);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.card-header {
  margin-bottom: 1rem;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.375rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-icon {
  font-size: 1.5rem;
}

.card-description {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.idea-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.form-group .textarea {
  flex: 1;
  min-height: 100px;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.submit-btn {
  align-self: flex-end;
  padding: 0.75rem 1.5rem;
  font-size: 0.9375rem;
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

.examples-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.examples-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.examples-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.example-btn {
  text-align: left;
  padding: 0.625rem 0.875rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s;
}

.example-btn:hover:not(:disabled) {
  background: var(--bg-primary);
  border-color: var(--accent-primary);
}

.example-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Right Panel: Workflow Preview (2/3 of screen) */
.workflow-preview {
  flex: 2;
  min-width: 0;
  background: var(--bg-secondary);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.preview-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preview-stages {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-tertiary);
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.stage-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 0.75rem;
  background: var(--bg-secondary);
  border-radius: 10px;
  transition: all 0.2s;
  text-align: center;
  border: 2px solid transparent;
}

.stage-item:hover {
  border-color: var(--accent-primary);
  transform: translateY(-2px);
}

.stage-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.stage-planning { background: rgba(59, 130, 246, 0.2); }
.stage-publishing { background: rgba(236, 72, 153, 0.2); }
.stage-logic { background: rgba(139, 92, 246, 0.2); }
.stage-backend { background: rgba(6, 182, 212, 0.2); }

.stage-info {
  min-width: 0;
  width: 100%;
}

.stage-info h4 {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.375rem;
}

.stage-info p {
  font-size: 0.6875rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
}

.stage-arrow {
  color: var(--accent-primary);
  font-size: 1.5rem;
  flex-shrink: 0;
  opacity: 0.6;
}

.preview-description {
  background: var(--bg-tertiary);
  border-radius: 12px;
  padding: 1.25rem;
}

.preview-description h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.preview-description ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-description li {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  padding-left: 1rem;
  position: relative;
}

.preview-description li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: var(--accent-primary);
}

.preview-description strong {
  color: var(--text-primary);
}

/* Responsive: Stack on smaller screens */
@media (max-width: 1200px) {
  .preview-stages {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .stage-item {
    flex: 1 1 calc(50% - 2rem);
    min-width: 140px;
  }

  .stage-arrow {
    display: none;
  }
}

@media (max-width: 900px) {
  .idea-input-container {
    flex-direction: column;
    height: auto;
    min-height: calc(100vh - 140px);
  }

  .idea-input-card {
    flex: none;
  }

  .workflow-preview {
    flex: 1;
  }

  .preview-stages {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }

  .stage-item {
    flex: 1 1 calc(50% - 1rem);
    min-width: 140px;
  }
}
</style>
