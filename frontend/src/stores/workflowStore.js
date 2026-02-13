import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api, { API_URL } from '../api'

export const useWorkflowStore = defineStore('workflow', () => {
  // State
  const nodes = ref([])
  const edges = ref([])
  const selectedNode = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const projectRoot = ref('')
  const isInitialized = ref(false)
  const analysisPath = ref('')

  // File content preview state
  const fileContent = ref(null)       // { file, content, lines, size, error? }
  const isLoadingFile = ref(false)

  // Recent projects state
  const RECENT_KEY = 'architect_recent_projects'
  const MAX_RECENT = 8
  const recentProjects = ref([])      // [{ path, name, framework, lastOpened }]

  // Getters
  const nodesByStage = computed(() => {
    const stages = { publishing: [], logic: [], backend: [] }
    nodes.value.forEach(node => {
      if (stages[node.type]) {
        stages[node.type].push(node)
      }
    })
    return stages
  })

  // Actions
  function selectNode(node) {
    selectedNode.value = node
    fileContent.value = null
  }

  function clearError() {
    error.value = null
  }

  function reset() {
    nodes.value = []
    edges.value = []
    selectedNode.value = null
    isInitialized.value = false
    analysisPath.value = ''
    error.value = null
  }

  async function fetchProjectRoot() {
    try {
      const response = await api.get('/api/config/project-root')
      projectRoot.value = response.data.project_root || ''
      return projectRoot.value
    } catch {
      return ''
    }
  }

  async function setProjectRoot(path) {
    try {
      const response = await api.post('/api/config/project-root', { path })
      projectRoot.value = response.data.project_root || path
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to set project root'
      throw err
    }
  }

  async function analyzeProject(path) {
    isLoading.value = true
    error.value = null
    try {
      const response = await api.post('/api/project/analyze', { path })
      const { nodes: n, edges: e } = response.data
      nodes.value = n
      edges.value = e
      analysisPath.value = path
      const fw = response.data.framework
      const fwLabel = [fw?.frontend, fw?.backend].filter(Boolean).join(' + ')
      addRecentProject(path, fwLabel)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to analyze project'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function markInitialized() {
    isInitialized.value = true
  }

  async function searchInFiles(query) {
    const path = analysisPath.value || projectRoot.value
    if (!path) return { results: [], total_files: 0 }
    const response = await api.post('/api/project/search', { path, query })
    return response.data
  }

  async function readFileContent(filePath) {
    const path = analysisPath.value || projectRoot.value
    if (!path) return
    isLoadingFile.value = true
    fileContent.value = null
    try {
      const response = await api.post('/api/project/read-file', { path, file: filePath })
      fileContent.value = response.data
    } catch (err) {
      fileContent.value = { file: filePath, content: null, lines: 0, size: 0, error: err.response?.data?.error || 'Failed to read file' }
    } finally {
      isLoadingFile.value = false
    }
  }

  async function downloadFilesAsZip(files, name) {
    const path = analysisPath.value || projectRoot.value
    if (!path || !files?.length) return
    try {
      const response = await api.post('/api/project/download-zip',
        { path, files, name: name || 'files' },
        { responseType: 'blob' }
      )
      const url = URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      a.download = (name || 'files') + '.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  // Recent projects
  function loadRecentProjects() {
    try {
      const raw = localStorage.getItem(RECENT_KEY)
      recentProjects.value = raw ? JSON.parse(raw) : []
    } catch {
      recentProjects.value = []
    }
  }

  function addRecentProject(path, framework) {
    const name = path.replace(/\\/g, '/').split('/').filter(Boolean).pop() || path
    const entry = { path, name, framework: framework || '', lastOpened: Date.now() }
    const filtered = recentProjects.value.filter(p => p.path !== path)
    recentProjects.value = [entry, ...filtered].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentProjects.value))
  }

  function removeRecentProject(path) {
    recentProjects.value = recentProjects.value.filter(p => p.path !== path)
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentProjects.value))
  }

  function clearRecentProjects() {
    recentProjects.value = []
    localStorage.removeItem(RECENT_KEY)
  }

  return {
    // State
    nodes,
    edges,
    selectedNode,
    isLoading,
    error,
    projectRoot,
    isInitialized,
    analysisPath,
    fileContent,
    isLoadingFile,
    recentProjects,

    // Getters
    nodesByStage,

    // Actions
    selectNode,
    clearError,
    reset,
    fetchProjectRoot,
    setProjectRoot,
    analyzeProject,
    markInitialized,
    searchInFiles,
    readFileContent,
    downloadFilesAsZip,
    loadRecentProjects,
    addRecentProject,
    removeRecentProject,
    clearRecentProjects
  }
})
