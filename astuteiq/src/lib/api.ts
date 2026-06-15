// src/lib/api.ts
import axios from 'axios'
import type { ChatResponse } from '../types/chat'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

const apiClient = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 5400000,
  headers: { 'Content-Type': 'application/json' },
})

/**
 * Auth is managed via the Zustand `useAuthStore` (persist middleware),
 * which stores { state: { user, token }, version } under the
 * 'astuteiq-auth' localStorage key. Read the token directly from there.
 */
function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem('astuteiq-auth')
    if (!raw) return null

    const parsed = JSON.parse(raw)
    return parsed?.state?.token ?? null
  } catch (err) {
    console.error('Failed to read auth token from storage:', err)
    return null
  }
}

apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      console.warn('NO TOKEN — unauthenticated request to', config.url)
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Optional: handle expired/invalid tokens centrally.
// If the backend returns 401, clear the persisted auth state so the UI
// can redirect to /login (adjust the storage key/shape if your
// useAuthStore logout logic differs).
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      try {
        localStorage.removeItem('astuteiq-auth')
      } catch (err) {
        console.error('Failed to clear auth storage:', err)
      }

      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export async function sendMessage(
  message: string
): Promise<ChatResponse> {
  const { data } = await apiClient.post('/assistant/chat', {
    message,
  })

  return data
}

export default apiClient