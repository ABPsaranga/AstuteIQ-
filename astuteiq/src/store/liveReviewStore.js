import { create } from 'zustand';
export const useReviewStore = create((set) => ({
    reviews: [],
    processing: false,
    lastUpdated: Date.now(),
    addReview: (review) => set((state) => ({
        reviews: [
            review,
            ...state.reviews.filter((r) => r.id !== review.id),
        ],
        processing: true,
        lastUpdated: Date.now(),
    })),
    updateReview: (id, updates) => set((state) => {
        const reviews = state.reviews.map((r) => r.id === id
            ? {
                ...r,
                ...updates,
            }
            : r);
        const processing = reviews.some((r) => r.status === 'processing');
        return {
            reviews,
            processing,
            lastUpdated: Date.now(),
        };
    }),
    removeReview: (id) => set((state) => {
        const reviews = state.reviews.filter((r) => r.id !== id);
        const processing = reviews.some((r) => r.status === 'processing');
        return {
            reviews,
            processing,
            lastUpdated: Date.now(),
        };
    }),
    clearReviews: () => set({
        reviews: [],
        processing: false,
        lastUpdated: Date.now(),
    }),
}));
