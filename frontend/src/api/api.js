import axios from 'axios'

// In dev, Vite proxies /api and /uploads to the FastAPI backend (see vite.config.js).
const client = axios.create({ baseURL: '' })
client.interceptors.request.use(config => {
  const token = localStorage.getItem('marinevision_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const checkHealth = () => client.get('/api/health').then(r => r.data)
export const login = (email, password) => client.post('/api/auth/login', { email, password }).then(r => r.data)
export const register = (full_name, email, password) => client.post('/api/auth/register', { full_name, email, password }).then(r => r.data)
export const getMe = () => client.get('/api/auth/me').then(r => r.data)
export const getUsers = () => client.get('/api/admin/users').then(r => r.data)

export const uploadScan = (file, location, depthM, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  form.append('location', location || 'Unknown')
  form.append('depth_m', depthM || 0)
  return client.post('/api/scan', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress) onProgress(Math.round((evt.loaded * 100) / evt.total))
    },
  }).then(r => r.data)
}

export const getHistory = (limit = 100) =>
  client.get(`/api/history?limit=${limit}`).then(r => r.data)

export const getScanDetail = (scanId) =>
  client.get(`/api/history/${scanId}`).then(r => r.data)

export const chatAboutScan = (scanId, message) =>
  client.post(`/api/history/${scanId}/chat`, { message }).then(r => r.data)

export const getScanFeedback = (scanId) => client.get(`/api/history/${scanId}/feedback`).then(r => r.data)
export const saveScanFeedback = (scanId, corrections, note) => client.put(`/api/history/${scanId}/feedback`, { corrections, note }).then(r => r.data)

export const deleteScan = (scanId) =>
  client.delete(`/api/history/${scanId}`).then(r => r.data)

export const getStats = () => client.get('/api/stats').then(r => r.data)

export const summarizeScanChat = (scan_data) =>
  client.post('/api/chatbot/summarize', { scan_data }).then(r => r.data)

export const queryScanChat = (scan_data, question, history = []) =>
  client.post('/api/chatbot/query', { scan_data, question, history }).then(r => r.data)
