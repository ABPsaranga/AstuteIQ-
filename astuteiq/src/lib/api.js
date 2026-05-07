import axios from 'axios';
// ⚠️  Security note: in production, never expose the Anthropic API key client-side.
// This base URL should point to your own backend which holds the key server-side.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'import.meta.env.VITE_API_URL';
const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
});
// ─── Request interceptor: attach JWT ─────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
    // Pull token from persisted Zustand store (localStorage)
    try {
        const raw = localStorage.getItem('astuteiq-auth');
        const state = raw ? JSON.parse(raw) : null;
        const token = state?.state?.token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    catch {
        // Swallow parse errors — request continues without auth header
    }
    return config;
});
// ─── Response interceptor: handle 401 globally ───────────────────────────────
apiClient.interceptors.response.use((res) => res, (err) => {
    if (err.response?.status === 401) {
        // Clear auth and redirect — avoid circular import by using window
        localStorage.removeItem('astuteiq-auth');
        window.location.href = '/login';
    }
    return Promise.reject(err);
});
export default apiClient;
