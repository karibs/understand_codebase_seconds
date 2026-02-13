<script setup>
import { computed } from 'vue'
import { useWorkflowStore } from '../stores/workflowStore'

const store = useWorkflowStore()

const stages = [
  { id: 'planning', label: 'Planning', icon: '📋', artifact: 'overview.md, feature_list.md' },
  { id: 'publishing', label: 'Publishing', icon: '🎨', artifact: 'ui-contract.md' },
  { id: 'logic', label: 'Front Logic', icon: '⚙️', artifact: 'logic-contract.md' },
  { id: 'backend', label: 'Backend', icon: '🔌', artifact: 'api-contract.md' }
]

const currentStageIndex = computed(() => {
  return stages.findIndex(s => s.id === store.currentStage)
})

function getStageStatus(index) {
  const current = currentStageIndex.value
  if (index < current) return 'completed'
  if (index === current) return 'current'
  return 'upcoming'
}

const stageProgress = computed(() => {
  const nodesByStage = store.nodesByStage
  const progress = {}

  Object.keys(nodesByStage).forEach(stage => {
    const nodes = nodesByStage[stage]
    if (nodes.length === 0) {
      progress[stage] = 0
    } else {
      const completed = nodes.filter(n => n.data?.status === 'completed').length
      progress[stage] = Math.round((completed / nodes.length) * 100)
    }
  })

  return progress
})
</script>

<template>
  <div class="stage-indicator">
    <div class="stages-container">
      <div
        v-for="(stage, index) in stages"
        :key="stage.id"
        :class="['stage', `stage-${getStageStatus(index)}`]"
      >
        <div class="stage-icon">{{ stage.icon }}</div>
        <div class="stage-content">
          <span class="stage-label">{{ stage.label }}</span>
          <span class="stage-artifact">{{ stage.artifact }}</span>
        </div>
        <div v-if="stageProgress[stage.id] !== undefined" class="stage-progress">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${stageProgress[stage.id]}%` }"
            ></div>
          </div>
          <span class="progress-text">{{ stageProgress[stage.id] }}%</span>
        </div>

        <!-- Connector -->
        <div v-if="index < stages.length - 1" class="stage-connector">
          <div :class="['connector-line', { 'line-completed': index < currentStageIndex }]"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stage-indicator {
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 1rem 1.5rem;
}

.stages-container {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.stage {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  padding: 0.75rem;
  background: var(--bg-tertiary);
  border-radius: 10px;
  transition: all 0.3s;
}

.stage-completed {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid var(--color-success);
}

.stage-current {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.stage-upcoming {
  opacity: 0.5;
  border: 1px solid transparent;
}

.stage-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.stage-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.stage-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.stage-artifact {
  font-size: 0.6875rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stage-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.progress-bar {
  width: 60px;
  height: 6px;
  background: var(--bg-primary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-success);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 32px;
  text-align: right;
}

.stage-connector {
  position: absolute;
  right: -1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  z-index: 1;
}

.connector-line {
  width: 100%;
  height: 2px;
  background: var(--border-color);
}

.line-completed {
  background: var(--color-success);
}

@media (max-width: 900px) {
  .stages-container {
    flex-direction: column;
    gap: 0.75rem;
  }

  .stage-connector {
    display: none;
  }

  .stage {
    width: 100%;
  }
}
</style>
