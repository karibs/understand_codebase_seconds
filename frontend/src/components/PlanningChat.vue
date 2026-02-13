<script setup>
import { ref, nextTick, watch, onMounted } from 'vue'
import api from '../api'
import { useWorkflowStore } from '../stores/workflowStore'

const props = defineProps({
  idea: String
})

const emit = defineEmits(['confirm', 'back'])
const store = useWorkflowStore()

const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const summary = ref(null)
const chatContainer = ref(null)
const isEditing = ref(false)
const newFeature = ref('')
const projectFolder = ref('')
const folderError = ref('')

// Load current project root on mount
onMounted(async () => {
  const root = await store.fetchProjectRoot()
  projectFolder.value = root
})

// Start conversation when component mounts
async function startConversation() {
  isLoading.value = true
  try {
    const response = await api.post('/api/plan/chat', {
      idea: props.idea,
      messages: []
    })
    messages.value.push({
      role: 'assistant',
      content: response.data.message
    })
    if (response.data.summary) {
      summary.value = response.data.summary
    }
  } catch (error) {
    console.error('Failed to start conversation:', error)
    messages.value.push({
      role: 'assistant',
      content: 'Sorry, there was a connection problem. Please try again.'
    })
  } finally {
    isLoading.value = false
  }
}

async function sendMessage() {
  if (!inputMessage.value.trim() || isLoading.value) return

  const userMessage = inputMessage.value.trim()
  inputMessage.value = ''

  // Add user message
  messages.value.push({
    role: 'user',
    content: userMessage
  })

  await scrollToBottom()

  // Get AI response
  isLoading.value = true
  try {
    const response = await api.post('/api/plan/chat', {
      idea: props.idea,
      messages: messages.value
    })
    messages.value.push({
      role: 'assistant',
      content: response.data.message
    })
    if (response.data.summary) {
      summary.value = response.data.summary
    }
  } catch (error) {
    console.error('Failed to send message:', error)
    messages.value.push({
      role: 'assistant',
      content: 'Sorry, an error occurred. Please try again.'
    })
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }
}

async function scrollToBottom() {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

async function confirmAndCreate() {
  // Set project root folder first
  if (projectFolder.value.trim()) {
    try {
      folderError.value = ''
      await store.setProjectRoot(projectFolder.value.trim())
    } catch (err) {
      folderError.value = 'The folder path is invalid.'
      return
    }
  }

  emit('confirm', {
    idea: props.idea,
    requirements: summary.value
  })
}

function goBack() {
  emit('back')
}

function editSummary(field, value) {
  if (summary.value) {
    summary.value[field] = value
  }
}

function toggleEdit() {
  isEditing.value = !isEditing.value
}

function addFeature() {
  if (newFeature.value.trim() && summary.value) {
    summary.value.core_features.push(newFeature.value.trim())
    newFeature.value = ''
  }
}

function removeFeature(index) {
  if (summary.value) {
    summary.value.core_features.splice(index, 1)
  }
}

function toggleAuth() {
  if (summary.value) {
    summary.value.auth_required = !summary.value.auth_required
  }
}

// Start conversation on mount
startConversation()
</script>

<template>
  <div class="planning-chat">
    <!-- Header -->
    <div class="chat-header">
      <button class="back-btn" @click="goBack">&larr; Back</button>
      <div class="header-info">
        <h2>Project Planning Chat</h2>
        <p class="idea-preview">{{ idea }}</p>
      </div>
    </div>

    <div class="chat-layout">
      <!-- Chat Area -->
      <div class="chat-area">
        <div class="messages" ref="chatContainer">
          <div
            v-for="(msg, index) in messages"
            :key="index"
            :class="['message', msg.role]"
          >
            <div class="message-avatar">
              {{ msg.role === 'user' ? '👤' : '🤖' }}
            </div>
            <div class="message-content">
              <div class="message-text">{{ msg.content }}</div>
            </div>
          </div>

          <div v-if="isLoading" class="message assistant">
            <div class="message-avatar">🤖</div>
            <div class="message-content">
              <div class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="chat-input">
          <input
            v-model="inputMessage"
            type="text"
            placeholder="Type your message..."
            @keyup.enter="sendMessage"
            :disabled="isLoading"
          />
          <button
            class="send-btn"
            @click="sendMessage"
            :disabled="!inputMessage.trim() || isLoading"
          >
            Send
          </button>
        </div>
      </div>

      <!-- Summary Panel -->
      <div class="summary-panel">
        <div class="summary-header">
          <h3>Requirements Summary</h3>
          <button v-if="summary" class="edit-toggle" @click="toggleEdit">
            {{ isEditing ? 'Done' : 'Edit' }}
          </button>
        </div>

        <div v-if="summary" class="summary-content">
          <div class="summary-field">
            <label>Project Name</label>
            <input
              :value="summary.project_name"
              @input="editSummary('project_name', $event.target.value)"
              :readonly="!isEditing"
              :class="{ readonly: !isEditing }"
            />
          </div>

          <div class="summary-field">
            <label>Description</label>
            <textarea
              :value="summary.description"
              @input="editSummary('description', $event.target.value)"
              :readonly="!isEditing"
              :class="{ readonly: !isEditing }"
            ></textarea>
          </div>

          <div class="summary-field">
            <label>Target Users</label>
            <input
              :value="summary.target_users"
              @input="editSummary('target_users', $event.target.value)"
              :readonly="!isEditing"
              :class="{ readonly: !isEditing }"
            />
          </div>

          <div class="summary-field">
            <label>Core Features</label>
            <ul class="feature-list">
              <li v-for="(feature, idx) in summary.core_features" :key="idx">
                <span class="feature-text">✅ {{ feature }}</span>
                <button
                  v-if="isEditing"
                  class="remove-feature"
                  @click="removeFeature(idx)"
                  title="Remove"
                >×</button>
              </li>
            </ul>
            <div v-if="isEditing" class="add-feature">
              <input
                v-model="newFeature"
                placeholder="Add new feature..."
                @keyup.enter="addFeature"
              />
              <button @click="addFeature">+</button>
            </div>
          </div>

          <div class="summary-field">
            <label>Auth Required</label>
            <button
              class="auth-toggle"
              :class="summary.auth_required ? 'yes' : 'no'"
              @click="isEditing && toggleAuth()"
              :disabled="!isEditing"
            >
              {{ summary.auth_required ? 'Yes' : 'No' }}
            </button>
          </div>

          <div class="summary-field">
            <label>UI Style</label>
            <input
              :value="summary.ui_style"
              @input="editSummary('ui_style', $event.target.value)"
              :readonly="!isEditing"
              :class="{ readonly: !isEditing }"
            />
          </div>

          <div class="summary-field folder-field">
            <label>Working Folder</label>
            <input
              v-model="projectFolder"
              type="text"
              placeholder="e.g. C:/Users/me/my-project"
              class="folder-input"
            />
            <p class="folder-hint">Specify the project folder path where code will be generated.</p>
            <p v-if="folderError" class="folder-error">{{ folderError }}</p>
          </div>

          <div class="confirm-section">
            <p class="confirm-hint">Review and edit the requirements, then generate the workflow.</p>
            <button class="confirm-btn" @click="confirmAndCreate">
              Confirm &amp; Generate Workflow
            </button>
          </div>
        </div>

        <div v-else class="summary-empty">
          <div class="empty-icon">💬</div>
          <p>Continue chatting with AI and<br/>requirements will be organized automatically.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.planning-chat {
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.back-btn {
  padding: 0.5rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.875rem;
}

.back-btn:hover {
  background: var(--bg-primary);
}

.header-info h2 {
  font-size: 1.125rem;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.idea-preview {
  font-size: 0.8125rem;
  color: var(--text-muted);
  max-width: 500px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 1px;
  background: var(--border-color);
  overflow: hidden;
  min-height: 0;
}

.chat-area {
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  min-height: 0;
  overflow: hidden;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
}

.message {
  display: flex;
  gap: 0.75rem;
  max-width: 80%;
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  flex-shrink: 0;
}

.message-content {
  background: var(--bg-secondary);
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.message.user .message-content {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.message-text {
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--text-primary);
  white-space: pre-wrap;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 0.25rem 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: var(--text-muted);
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}

.chat-input {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.chat-input input {
  flex: 1;
  padding: 0.75rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.9375rem;
}

.chat-input input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.send-btn {
  padding: 0.75rem 1.5rem;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Summary Panel */
.summary-panel {
  background: var(--bg-secondary);
  padding: 1.25rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.summary-panel h3 {
  font-size: 1rem;
  color: var(--text-primary);
  margin: 0;
}

.edit-toggle {
  padding: 0.375rem 0.75rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 0.75rem;
  cursor: pointer;
}

.edit-toggle:hover {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.summary-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.summary-field label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}

.summary-field input,
.summary-field textarea {
  padding: 0.5rem 0.625rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 0.8125rem;
  width: 100%;
}

.summary-field input.readonly,
.summary-field textarea.readonly {
  background: transparent;
  border-color: transparent;
  cursor: default;
}

.summary-field textarea {
  min-height: 50px;
  resize: vertical;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.feature-list li {
  font-size: 0.8125rem;
  color: var(--text-primary);
  padding: 0.375rem 0.5rem;
  background: var(--bg-tertiary);
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.feature-text {
  flex: 1;
}

.remove-feature {
  background: none;
  border: none;
  color: var(--color-error);
  font-size: 1.125rem;
  cursor: pointer;
  padding: 0 0.25rem;
  line-height: 1;
}

.add-feature {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.add-feature input {
  flex: 1;
  padding: 0.375rem 0.5rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 0.75rem;
}

.add-feature button {
  padding: 0.375rem 0.75rem;
  background: var(--accent-primary);
  border: none;
  border-radius: 4px;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.auth-toggle {
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.auth-toggle.yes {
  background: rgba(16, 185, 129, 0.2);
  color: var(--color-success);
}

.auth-toggle.no {
  background: rgba(156, 163, 175, 0.2);
  color: var(--text-muted);
}

.auth-toggle:disabled {
  cursor: default;
}

.auth-toggle:not(:disabled):hover {
  opacity: 0.8;
}

.folder-field {
  background: var(--bg-tertiary);
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.folder-input {
  font-family: 'Monaco', 'Menlo', monospace !important;
  font-size: 0.8125rem !important;
}

.folder-hint {
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.folder-error {
  font-size: 0.75rem;
  color: var(--color-error);
  margin-top: 0.25rem;
}

.confirm-section {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.confirm-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: center;
  margin-bottom: 0.75rem;
}

.confirm-btn {
  width: 100%;
  padding: 0.875rem;
  background: var(--color-success);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.confirm-btn:hover {
  background: #059669;
}

.summary-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* Responsive */
@media (max-width: 1100px) {
  .chat-layout {
    grid-template-columns: 1fr 320px;
  }
}

@media (max-width: 900px) {
  .chat-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }

  .summary-panel {
    max-height: 280px;
    border-top: 1px solid var(--border-color);
  }
}

@media (max-height: 700px) {
  .chat-header {
    padding: 0.75rem 1rem;
  }

  .messages {
    padding: 1rem;
  }

  .chat-input {
    padding: 0.75rem 1rem;
  }

  .summary-panel {
    padding: 1rem;
  }

  .summary-field {
    margin-bottom: 0.5rem;
  }
}
</style>
