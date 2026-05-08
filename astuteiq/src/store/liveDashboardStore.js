import { create } from 'zustand';
export const useLiveDashboardStore = create((set) => ({
    reviews: [],
    addReview: (review) => set((state) => ({
        reviews: [review, ...state.reviews],
    })),
    updateReview: (id, updates) => set((state) => ({
        reviews: state.reviews.map((r) => r.id === id
            ? { ...r, ...updates }
            : r),
    })),
    removeReview: (id) => set((state) => ({
        reviews: state.reviews.filter((r) => r.id !== id),
    })),
    clear: () => set({ reviews: [] }),
}));
