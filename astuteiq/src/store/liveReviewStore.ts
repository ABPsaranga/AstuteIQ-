import { create } from 'zustand'

export type ReviewStatus =
  | 'processing'
  | 'complete'
  | 'failed'

export interface LiveReview {
  id: string
  fileName: string
  fileSize?: number

  mode: 'quick' | 'full'

  status: ReviewStatus

  progress?: number

  score?: number

  findings?: any[]

  overrides?: any[]

  createdAt: string

  completedAt?: string
}

interface ReviewState {
  reviews: LiveReview[]

  processing: boolean

  lastUpdated: number

  addReview: (review: LiveReview) => void

  updateReview: (
    id: string,
    updates: Partial<LiveReview>
  ) => void

  removeReview: (id: string) => void

  clearReviews: () => void
}

export const useReviewStore = create<ReviewState>(
  (set) => ({
    reviews: [],

    processing: false,

    lastUpdated: Date.now(),

    addReview: (review) =>
      set((state) => ({
        reviews: [
          review,
          ...state.reviews.filter(
            (r) => r.id !== review.id
          ),
        ],

        processing: true,

        lastUpdated: Date.now(),
      })),

    updateReview: (id, updates) =>
      set((state) => {
        const reviews = state.reviews.map((r) =>
          r.id === id
            ? {
                ...r,
                ...updates,
              }
            : r
        )

        const processing = reviews.some(
          (r) => r.status === 'processing'
        )

        return {
          reviews,

          processing,

          lastUpdated: Date.now(),
        }
      }),

    removeReview: (id) =>
      set((state) => {
        const reviews = state.reviews.filter(
          (r) => r.id !== id
        )

        const processing = reviews.some(
          (r) => r.status === 'processing'
        )

        return {
          reviews,

          processing,

          lastUpdated: Date.now(),
        }
      }),

    clearReviews: () =>
      set({
        reviews: [],

        processing: false,

        lastUpdated: Date.now(),
      }),
  })
)