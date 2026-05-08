// src/lib/api.ts
import axios from 'axios';
import supabase from './supabase';
/* ============================================================================
   API BASE URL
============================================================================ */
const API_BASE = import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL ??
    'http://127.0.0.1:8001';
/* ============================================================================
   AXIOS INSTANCE
============================================================================ */
const apiClient = axios.create({
    baseURL: `${API_BASE}/api`,
    timeout: 5400000, // 3 min for streaming / SOA reviews
    headers: {
        'Content-Type': 'application/json',
    },
});
/* ============================================================================
   REQUEST INTERCEPTOR
   Attach Supabase JWT automatically
============================================================================ */
apiClient.interceptors.request.use(async (config) => {
    try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    catch (err) {
        console.error('Auth interceptor error:', err);
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
/* ============================================================================
   RESPONSE INTERCEPTOR
============================================================================ */
apiClient.interceptors.response.use((response) => response, async (error) => {
    const status = error.response?.status;
    // Unauthorized
    if (status === 401) {
        try {
            await supabase.auth.signOut();
        }
        catch {
            //
        }
        window.location.href = '/login';
    }
    // Timeout
    if (error.code === 'ECONNABORTED') {
        console.error('Request timeout');
    }
    // Server unavailable
    if (!error.response) {
        console.error('Backend unreachable');
    }
    return Promise.reject(error);
});
export default apiClient;
