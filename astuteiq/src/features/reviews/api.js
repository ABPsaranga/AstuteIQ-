import apiClient from '../../lib/api';
// ─── Run a review ─────────────────────────────────────────────────────────────
export async function runReviewApi(payload) {
    const res = await apiClient.post('/reviews/run', payload);
    return res.data;
}
// ─── Fetch a single review ────────────────────────────────────────────────────
export async function getReviewApi(id) {
    const res = await apiClient.get(`/reviews/${id}`);
    return res.data;
}
// ─── Review history ───────────────────────────────────────────────────────────
export async function getReviewHistoryApi(page = 1, limit = 20) {
    const res = await apiClient.get('/reviews/history', {
        params: { page, limit },
    });
    return res.data;
}
// ─── Submit override ──────────────────────────────────────────────────────────
export async function submitOverrideApi(reviewId, checkId, newStatus, comment) {
    await apiClient.post(`/reviews/${reviewId}/override`, { checkId, newStatus, comment });
}
// ─── Upload file ──────────────────────────────────────────────────────────────
export async function uploadFileApi(file, onProgress) {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post('/reviews/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
            if (e.total)
                onProgress?.(Math.round((e.loaded / e.total) * 100));
        },
    });
    return res.data;
}
// ─── Review stats ─────────────────────────────────────────────────────────────
export async function getReviewStats() {
    const res = await apiClient.get('/reviews/stats');
    return res.data;
}
