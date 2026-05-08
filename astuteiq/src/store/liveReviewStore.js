import { create } from 'zustand';
export const useReviewStore = create((set) => ({
    reviews: [],
    processing: false,
    lastUpdated: Date.now(),
    setProcessing: (v) => set({ processing: v }),
    addReview: (r) => set((state) => ({
        reviews: [r, ...state.reviews.filter((x) => x.id !== r.id)],
        lastUpdated: Date.now(),
        processing: r.status === 'processing',
    })),
    updateReview: (id, patch) => set((state) => ({
        reviews: state.reviews.map((r) => r.id === id ? { ...r, ...patch } : r),
        lastUpdated: Date.now(),
        processing: patch.status === 'processing'
            ? true
            : patch.status === 'complete' || patch.status === 'failed'
                ? false
                : state.processing,
    })),
    clearReviews: () => set({ reviews: [], lastUpdated: Date.now() }),
}));
