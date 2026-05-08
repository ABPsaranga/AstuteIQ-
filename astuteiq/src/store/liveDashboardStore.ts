import { create } from 'zustand'

export interface LiveReview {
  id: string
  fileName: string
  status: 'processing' | 'complete' | 'failed'
  progress: number
  score?: number
  createdAt: string
  mode: 'quick' | 'full'
}

interface DashboardState {
  reviews: LiveReview[]

  addReview: (review: LiveReview) => void

  updateReview: (
    id: string,
    updates: Partial<LiveReview>
  ) => void

  removeReview: (id: string) => void

  clear: () => void
}

export const useLiveDashboardStore =
  create<DashboardState>((set) => ({
    reviews: [],

    addReview: (review) =>
      set((state) => ({
        reviews: [review, ...state.reviews],
      })),

    updateReview: (id, updates) =>
      set((state) => ({
        reviews: state.reviews.map((r) =>
          r.id === id
            ? { ...r, ...updates }
            : r
        ),
      })),

    removeReview: (id) =>
      set((state) => ({
        reviews: state.reviews.filter(
          (r) => r.id !== id
        ),
      })),

    clear: () => set({ reviews: [] }),
  }))