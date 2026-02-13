<script setup>
defineProps({
  id: String,
  data: Object
})
</script>

<template>
  <div class="group-node">
    <div class="group-header">
      <span class="group-icon">&#128193;</span>
      <span class="group-label">{{ data?.label || '' }}</span>
      <span class="group-count">{{ data?.fileCount ?? 0 }}</span>
    </div>
  </div>
</template>

<style scoped>
.group-node {
  width: 100%;
  height: 100%;
  border: 2px dashed rgba(71, 85, 105, 0.5);
  border-radius: 12px;
  background: rgba(71, 85, 105, 0.08);
  pointer-events: none;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  pointer-events: none;
  user-select: none;
}

.group-icon {
  font-size: 0.875rem;
}

.group-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary, #94A3B8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-count {
  margin-left: auto;
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--text-muted, #64748B);
  background: rgba(71, 85, 105, 0.15);
  padding: 0.0625rem 0.375rem;
  border-radius: 4px;
}
</style>
