import api from '../../lib/api';
import apiClient from '../../lib/api';
import { generateMockReview, generateMockHistory } from './utils/normalize';
// ─── Run a review ─────────────────────────────────────────────────────────────
export async function runReviewApi(payload) {
    try {
        const res = await apiClient.post('/reviews/run', payload);
        return res.data;
    }
    catch {
        // Simulate async processing with a mock result
        await new Promise((r) => setTimeout(r, 2500));
        return generateMockReview(payload.mode);
    }
}
// ─── Fetch a single review ────────────────────────────────────────────────────
export async function getReviewApi(id) {
    try {
        const res = await apiClient.get(`/reviews/${id}`);
        return res.data;
    }
    catch {
        // Return a consistent mock by seeding with the id
        return generateMockReview('full', id);
    }
}
// ─── Review history ───────────────────────────────────────────────────────────
export async function getReviewHistoryApi(page = 1, limit = 20) {
    try {
        const res = await apiClient.get('/reviews/history', {
            params: { page, limit },
        });
        return res.data;
    }
    catch {
        await new Promise((r) => setTimeout(r, 400));
        return generateMockHistory(page, limit);
    }
}
// ─── Submit override ──────────────────────────────────────────────────────────
export async function submitOverrideApi(reviewId, checkId, newStatus, comment) {
    try {
        await apiClient.post(`/reviews/${reviewId}/override`, { checkId, newStatus, comment });
    }
    catch {
        await new Promise((r) => setTimeout(r, 300));
    }
}
// ─── Upload file ──────────────────────────────────────────────────────────────
export async function uploadFileApi(file, onProgress) {
    try {
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
    catch {
        // Simulate upload
        for (let i = 0; i <= 100; i += 20) {
            await new Promise((r) => setTimeout(r, 150));
            onProgress?.(i);
        }
        return { fileId: `file_${Date.now()}` };
    }
}
export async function getReviewStats() {
    const res = await api.get("/reviews/stats");
    return res.data;
}
