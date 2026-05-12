import { useState, useCallback, useEffect } from 'react';
import apiClient from '../../lib/api';
import { getReviewStats } from './api';
// ─────────────────────────────────────────────────────────────
// Review history
// ─────────────────────────────────────────────────────────────
export function useReviewHistory() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetch = useCallback(async (page = 1, limit = 20) => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get(`/reviews/history?page=${page}&limit=${limit}`);
            setData(res.data);
        }
        catch (err) {
            const message = err?.response?.data?.detail ?? err?.message ?? 'Failed to load history.';
            setError(message);
            console.error('[useReviewHistory]', message);
            // Keep existing data on re-fetch failure so UI doesn't blank out
        }
        finally {
            setLoading(false);
        }
    }, []);
    return { data, loading, error, fetch };
}
// ─────────────────────────────────────────────────────────────
// Single review
// ─────────────────────────────────────────────────────────────
export function useFetchReview(reviewId) {
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetch = useCallback(async () => {
        if (!reviewId)
            return;
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get(`/reviews/${reviewId}`);
            setReview(res.data);
        }
        catch (err) {
            const message = err?.response?.data?.detail ?? err?.message ?? 'Failed to load review.';
            setError(message);
            console.error('[useFetchReview]', message);
        }
        finally {
            setLoading(false);
        }
    }, [reviewId]);
    return { review, loading, error, fetch };
}
// ─────────────────────────────────────────────────────────────
// Run review
// ─────────────────────────────────────────────────────────────
export function useRunReview() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    async function run(fileIds, mode = 'full') {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.post('/reviews/run', { fileIds, mode });
            return res.data;
        }
        catch (err) {
            const message = err?.response?.data?.detail ?? err?.message ?? 'Review failed.';
            setError(message);
            console.error('[useRunReview]', message);
            return null;
        }
        finally {
            setLoading(false);
        }
    }
    return { run, loading, error };
}
// ─────────────────────────────────────────────────────────────
// Submit override
// ─────────────────────────────────────────────────────────────
export function useSubmitOverride(reviewId) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    async function submit(checkId, newStatus, comment) {
        setLoading(true);
        setError(null);
        try {
            await apiClient.post(`/reviews/${reviewId}/override`, { checkId, newStatus, comment });
            return true;
        }
        catch (err) {
            const message = err?.response?.data?.detail ?? err?.message ?? 'Override failed.';
            setError(message);
            console.error('[useSubmitOverride]', message);
            return false;
        }
        finally {
            setLoading(false);
        }
    }
    return { submit, loading, error };
}
// ─────────────────────────────────────────────────────────────
// Review stats
// ─────────────────────────────────────────────────────────────
export function useReviewStats() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        getReviewStats()
            .then(setData)
            .catch((err) => {
            const message = err?.response?.data?.detail ?? err?.message ?? 'Failed to load stats.';
            setError(message);
            console.error('[useReviewStats]', message);
        })
            .finally(() => setLoading(false));
    }, []);
    return { data, loading, error };
}
