// src/lib/api.ts

import axios from 'axios'
import supabase from './supabase'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  'http://127.0.0.1:8000'

const apiClient = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 5400000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use(
  async (config) => {
    try {
      // FIX: try localStorage token first (set at login)
      let token = localStorage.getItem('token')

      // FIX: fallback to live Supabase session
      if (!token) {
        const { data } = await supabase.auth.getSession()
        token = data.session?.access_token ?? null
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        console.log('AUTH HEADER ATTACHED', config.url)
      } else {
        console.warn('NO TOKEN — unauthenticated request to', config.url)
      }
    } catch (err) {
      console.error('Auth interceptor error:', err)
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default apiClient