<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../api'
import { useWorkflowStore } from '../stores/workflowStore'

const store = useWorkflowStore()

const projectPath = ref('')
const isAnalyzing = ref(false)
const analysisResult = ref(null)
const analysisError = ref('')

const emit = defineEmits(['back', 'view-workflow'])

const isBrowsing = ref(false)

const recentProjects = computed(() => store.recentProjects)

onMounted(() => {
  store.loadRecentProjects()
})

function selectRecent(proj) {
  projectPath.value = proj.path
  runAnalysis()
}

async function browseFolder() {
  isBrowsing.value = true
  try {
    const res = await api.get('/api/project/browse')
    if (res.data.path) {
      projectPath.value = res.data.path
    }
  } catch (err) {
    analysisError.value = err.response?.data?.error || 'Failed to select folder.'
  } finally {
    isBrowsing.value = false
  }
}

async function runAnalysis() {
  if (!projectPath.value.trim()) return

  isAnalyzing.value = true
  analysisError.value = ''
  analysisResult.value = null

  try {
    const result = await store.analyzeProject(projectPath.value.trim())
    analysisResult.value = result
  } catch (err) {
    analysisError.value = err.response?.data?.error || err.message || 'An error occurred during analysis.'
  } finally {
    isAnalyzing.value = false
  }
}

function viewWorkflow() {
  store.markInitialized()
  emit('view-workflow')
}
</script>

<template>
  <div class="analysis-container">
    <!-- Input Section -->
    <div class="analysis-input-card">
      <div class="card-header-row">
        <div>
          <h2 class="card-title">
            <span class="card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </span>
            Analyze Project
          </h2>
          <p class="card-description">
            Enter a project folder path to analyze its structure and visualize as a workflow graph.
          </p>
        </div>
      </div>

      <div class="input-row">
        <input
          v-model="projectPath"
          type="text"
          class="path-input"
          placeholder="e.g. C:/Users/me/my-project"
          @keyup.enter="runAnalysis"
          :disabled="isAnalyzing"
        />
        <button
          class="btn-browse"
          @click="browseFolder"
          :disabled="isAnalyzing || isBrowsing"
          title="Browse folder"
        >
          <svg v-if="!isBrowsing" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <span v-else class="spinner-sm"></span>
        </button>
        <button
          class="btn-analyze"
          @click="runAnalysis"
          :disabled="!projectPath.trim() || isAnalyzing"
        >
          <span v-if="isAnalyzing" class="spinner-sm"></span>
          {{ isAnalyzing ? 'Analyzing...' : 'Analyze' }}
        </button>
      </div>
    </div>

    <!-- Recent Projects -->
    <div v-if="recentProjects.length && !analysisResult" class="recent-card">
      <div class="recent-header">
        <h3 class="recent-title">Recent</h3>
        <button class="btn-clear" @click="store.clearRecentProjects()">Clear</button>
      </div>
      <div class="recent-list">
        <button
          v-for="proj in recentProjects"
          :key="proj.path"
          class="recent-item"
          @click="selectRecent(proj)"
        >
          <div class="recent-info">
            <span class="recent-name">{{ proj.name }}</span>
            <span class="recent-path">{{ proj.path }}</span>
          </div>
          <div class="recent-meta">
            <span v-if="proj.framework" class="recent-framework">{{ proj.framework }}</span>
            <button class="recent-remove" @click.stop="store.removeRecentProject(proj.path)">&times;</button>
          </div>
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="analysisError" class="error-card">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
      {{ analysisError }}
    </div>

    <!-- Results -->
    <div v-if="analysisResult" class="results-section">
      <!-- Diagnostics Card -->
      <div class="diagnostics-card">
        <h3 class="section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          Analysis Result
        </h3>

        <div class="diagnostics-grid">
          <!-- Framework -->
          <div class="diag-item">
            <span class="diag-label">Frontend</span>
            <span class="diag-value">{{ analysisResult.framework?.frontend || 'Not detected' }}</span>
          </div>
          <div class="diag-item">
            <span class="diag-label">Backend</span>
            <span class="diag-value">{{ analysisResult.framework?.backend || 'Not detected' }}</span>
          </div>
          <div class="diag-item">
            <span class="diag-label">Languages</span>
            <span class="diag-value">{{ analysisResult.framework?.languages?.join(', ') || '-' }}</span>
          </div>

          <!-- Counts -->
          <div class="diag-item">
            <span class="diag-label">Total Files</span>
            <span class="diag-value highlight">{{ analysisResult.diagnostics?.total_files }}</span>
          </div>
          <div class="diag-item">
            <span class="diag-label">Pages / Components</span>
            <span class="diag-value color-pink">{{ analysisResult.diagnostics?.page_count }}</span>
          </div>
          <div class="diag-item">
            <span class="diag-label">Logic / State</span>
            <span class="diag-value color-violet">{{ analysisResult.diagnostics?.logic_count }}</span>
          </div>
          <div class="diag-item">
            <span class="diag-label">Backend / API</span>
            <span class="diag-value color-cyan">{{ analysisResult.diagnostics?.backend_count }}</span>
          </div>
          <div class="diag-item">
            <span class="diag-label">Other</span>
            <span class="diag-value">{{ analysisResult.diagnostics?.other_count }}</span>
          </div>
        </div>

        <!-- Node/Edge summary -->
        <div class="graph-summary">
          <span>{{ analysisResult.nodes?.length || 0 }} nodes</span>
          <span class="sep">·</span>
          <span>{{ analysisResult.edges?.length || 0 }} edges</span>
        </div>
      </div>

      <!-- View Workflow Button -->
      <button class="btn-view-workflow" @click="viewWorkflow">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M11 18H8a2 2 0 0 1-2-2V9"/></svg>
        View Workflow Graph
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.analysis-container {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ---------- Input Card ---------- */
.analysis-input-card {
  background: #fff;
  border: 1px solid #F1F5F9;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.card-header-row {
  margin-bottom: 1.5rem;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #1a1a2e;
  margin-bottom: 0.375rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  letter-spacing: -0.01em;
}

.card-icon {
  color: #6366F1;
  display: inline-flex;
}

.card-description {
  color: #64748B;
  font-size: 0.875rem;
  line-height: 1.5;
}

.input-row {
  display: flex;
  gap: 0.5rem;
}

.path-input {
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  background: #F8FAFC;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  color: #1a1a2e;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
}

.path-input:focus {
  outline: none;
  border-color: #6366F1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.path-input::placeholder {
  color: #94A3B8;
}

.path-input:disabled {
  opacity: 0.6;
}

.btn-browse {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  padding: 0;
  background: #fff;
  color: #64748B;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-browse:hover:not(:disabled) {
  border-color: #6366F1;
  color: #6366F1;
  background: #F8F7FF;
}

.btn-browse:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-analyze {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: #fff;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  transition: transform 0.15s, box-shadow 0.15s;
  flex-shrink: 0;
  white-space: nowrap;
}

.btn-analyze:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
}

.btn-analyze:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

.btn-browse .spinner-sm {
  border-color: #E2E8F0;
  border-top-color: #6366F1;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ---------- Error ---------- */
.error-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: #FFF5F5;
  border: 1px solid #FEE2E2;
  border-radius: 12px;
  color: #DC2626;
  font-size: 0.875rem;
}

/* ---------- Results ---------- */
.results-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.diagnostics-card {
  background: #fff;
  border: 1px solid #F1F5F9;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title svg {
  color: #6366F1;
}

.diagnostics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
}

.diag-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: #F8FAFC;
  border: 1px solid #F1F5F9;
  border-radius: 10px;
}

.diag-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.diag-value {
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a2e;
}

.diag-value.highlight {
  color: #6366F1;
}

.diag-value.color-pink {
  color: #EC4899;
}

.diag-value.color-violet {
  color: #8B5CF6;
}

.diag-value.color-cyan {
  color: #06B6D4;
}

.graph-summary {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #F1F5F9;
  text-align: center;
  font-size: 0.875rem;
  color: #64748B;
  font-weight: 500;
}

.graph-summary .sep {
  margin: 0 0.5rem;
  color: #CBD5E1;
}

.btn-view-workflow {
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  font-size: 0.9375rem;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: #fff;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.35);
  transition: transform 0.15s, box-shadow 0.15s;
}

.btn-view-workflow:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 28px rgba(99, 102, 241, 0.45);
}

/* ---------- Recent Projects ---------- */
.recent-card {
  background: #fff;
  border: 1px solid #F1F5F9;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.recent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.recent-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.btn-clear {
  background: none;
  border: none;
  color: #94A3B8;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  transition: color 0.15s;
}

.btn-clear:hover {
  color: #DC2626;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.recent-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  padding: 0.625rem 0.875rem;
  background: #F8FAFC;
  border: 1.5px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  color: inherit;
  font-family: inherit;
}

.recent-item:hover {
  border-color: #6366F1;
  background: #F8F7FF;
}

.recent-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
  flex: 1;
}

.recent-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1a1a2e;
}

.recent-path {
  font-size: 0.6875rem;
  color: #94A3B8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.recent-framework {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.2rem 0.625rem;
  border-radius: 6px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08));
  color: #6366F1;
  white-space: nowrap;
}

.recent-remove {
  background: none;
  border: none;
  color: #CBD5E1;
  font-size: 1.125rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.125rem 0.25rem;
  border-radius: 4px;
  transition: color 0.15s;
}

.recent-remove:hover {
  color: #DC2626;
}

/* ---------- Responsive ---------- */
@media (max-width: 640px) {
  .input-row {
    flex-direction: column;
  }

  .btn-browse {
    width: 100%;
  }

  .diagnostics-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
