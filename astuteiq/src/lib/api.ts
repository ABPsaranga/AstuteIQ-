// src/lib/api.ts

import axios from 'axios'
import supabase from './supabase'

/* ============================================================================
   API BASE URL
============================================================================ */

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  'http://127.0.0.1:8000'

/* ============================================================================
   AXIOS INSTANCE
============================================================================ */

const apiClient = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 5400000, // 3 min for streaming / SOA reviews
  headers: {
    'Content-Type': 'application/json',
  },
})

/* ============================================================================
   REQUEST INTERCEPTOR
   Attach Supabase JWT automatically
============================================================================ */

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const { data } = await supabase.auth.getSession()

      const token = data.session?.access_token

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (err) {
      console.error('Auth interceptor error:', err)
    }

    return config
  },

  (error) => {
    return Promise.reject(error)
  }
)

/* ============================================================================
   RESPONSE INTERCEPTOR
============================================================================ */

apiClient.interceptors.request.use(
  async (config) => {
    try {
      let token =
        localStorage.getItem('token')

      if (!token) {
        const { data } =
          await supabase.auth.getSession()

        token =
          data.session?.access_token ??
          null
      }

      if (token) {
        config.headers.Authorization =
          `Bearer ${token}`

        console.log(
          'AUTH HEADER ATTACHED'
        )
      } else {
        console.warn(
          'NO TOKEN FOUND'
        )
      }
    } catch (err) {
      console.error(
        'Auth interceptor error:',
        err
      )
    }

    return config
  },
  (error) =>
    Promise.reject(error)
)

export default apiClient