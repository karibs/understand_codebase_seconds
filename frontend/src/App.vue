<script setup>
import { ref } from 'vue'
import { useWorkflowStore } from './stores/workflowStore'
import LandingPage from './components/LandingPage.vue'
import ProjectAnalysis from './components/ProjectAnalysis.vue'
import WorkflowGraph from './components/WorkflowGraph.vue'
import NodeDetails from './components/NodeDetails.vue'

const store = useWorkflowStore()
const currentView = ref('landing') // 'landing' | 'analysis' | 'workflow'

function goToLanding() {
  store.reset()
  currentView.value = 'landing'
}

function onAnalysisViewWorkflow() {
  currentView.value = 'workflow'
}

function backToAnalysis() {
  store.reset()
  currentView.value = 'analysis'
}
</script>

<template>
  <div class="app-container">
    <!-- Landing Page -->
    <LandingPage
      v-if="currentView === 'landing'"
      @start="currentView = 'analysis'"
    />

    <!-- Header (shown only for analysis/workflow views) -->
    <header v-if="currentView !== 'landing'" class="app-header">
      <div class="header-left">
        <button class="btn-home" @click="goToLanding" title="Home">
          <span class="logo-mark">A</span>
        </button>
        <h1 class="app-title">Architect</h1>
        <span class="app-subtitle">Project Analyzer</span>
      </div>
      <div class="header-actions">
        <button v-if="currentView === 'workflow'" class="btn btn-back" @click="backToAnalysis">
          &#x2190; New Analysis
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main v-if="currentView !== 'landing'" class="main-content">
      <!-- Project Analysis View -->
      <ProjectAnalysis
        v-if="currentView === 'analysis'"
        @view-workflow="onAnalysisViewWorkflow"
      />

      <!-- Graph View -->
      <template v-else-if="currentView === 'workflow'">
        <div class="workflow-layout">
          <div class="graph-panel">
            <WorkflowGraph />
          </div>
          <div class="details-panel">
            <NodeDetails v-if="store.selectedNode" />
            <div v-else class="no-selection">
              <div class="no-selection-icon">&#x1F4CB;</div>
              <p>Select a node to view details</p>
            </div>
          </div>
        </div>
      </template>
    </main>

    <!-- Loading Overlay -->
    <div v-if="store.isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Analyzing...</p>
    </div>

    <!-- Error Toast -->
    <div v-if="store.error" class="error-toast" @click="store.clearError">
      <span class="error-icon">&#x26A0;&#xFE0F;</span>
      {{ store.error }}
      <button class="error-close">&times;</button>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #FAFBFF;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 2rem;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.app-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #1a1a2e;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  letter-spacing: -0.01em;
}

.app-subtitle {
  color: #94A3B8;
  font-size: 0.8125rem;
  font-weight: 500;
}

.btn-home {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: transform 0.15s;
}

.btn-home:hover {
  transform: scale(1.08);
}

.logo-mark {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: #fff;
  font-size: 1rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #fff;
  color: #334155;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  border-color: #6366F1;
  background: #F8F7FF;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  gap: 1.5rem;
}

.workflow-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 1.5rem;
  min-height: 0;
}

.graph-panel {
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.details-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
}

.no-selection {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #F1F5F9;
  padding: 2rem;
  text-align: center;
  color: #94A3B8;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.no-selection-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.4;
}

.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #1a1a2e;
  z-index: 1000;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #E2E8F0;
  border-top-color: #6366F1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-toast {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  background: #fff;
  color: #DC2626;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  border: 1px solid #FEE2E2;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.15);
  z-index: 1001;
}

.error-close {
  background: none;
  border: none;
  color: #94A3B8;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  margin-left: 0.5rem;
}

.error-close:hover {
  color: #DC2626;
}
</style>
