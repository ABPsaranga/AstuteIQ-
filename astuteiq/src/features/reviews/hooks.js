import { useState, useCallback } from 'react';
import apiClient from '../../lib/api';
import { useEffect } from "react";
import { getReviewStats } from './api';
export function useReviewHistory() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const fetch = useCallback(async (page = 1, limit = 20) => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/reviews/history?page=${page}&limit=${limit}`);
            setData(res.data);
        }
        catch {
            // silently fail — dashboard handles empty state
        }
        finally {
            setLoading(false);
        }
    }, []);
    return { data, loading, fetch };
}
export function useFetchReview(reviewId) {
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(false);
    const fetch = useCallback(async () => {
        if (!reviewId)
            return;
        setLoading(true);
        try {
            const res = await apiClient.get(`/reviews/${reviewId}`);
            setReview(res.data);
        }
        catch {
            // ignore
        }
        finally {
            setLoading(false);
        }
    }, [reviewId]);
    return { review, loading, fetch };
}
export function useRunReview() {
    const [loading, setLoading] = useState(false);
    async function run(fileIds, mode = 'full') {
        setLoading(true);
        try {
            const res = await apiClient.post('/reviews/run', { fileIds, mode });
            return res.data;
        }
        finally {
            setLoading(false);
        }
    }
    return { run, loading };
}
export function useSubmitOverride(reviewId) {
    const [loading, setLoading] = useState(false);
    async function submit(checkId, newStatus, comment) {
        setLoading(true);
        try {
            await apiClient.post(`/reviews/${reviewId}/override`, {
                checkId, newStatus, comment,
            });
            return true;
        }
        catch {
            return false;
        }
        finally {
            setLoading(false);
        }
    }
    return { submit, loading };
}
export function useReviewStats() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        getReviewStats()
            .then(setData)
            .finally(() => setLoading(false));
    }, []);
    return { data, loading };
}
