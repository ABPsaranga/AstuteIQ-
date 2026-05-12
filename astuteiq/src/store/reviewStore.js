import { create } from 'zustand';
export const useReviewStore = create()((set) => ({
    files: [],
    mode: 'full',
    loading: false,
    progress: 0,
    currentReview: null,
    addFiles: (newFiles) => set((s) => ({
        // Deduplicate by file name
        files: [
            ...s.files,
            ...newFiles.filter((f) => !s.files.some((e) => e.name === f.name)),
        ],
    })),
    removeFile: (id) => set((s) => ({ files: s.files.filter((f) => f.id !== id) })),
    clearFiles: () => set({ files: [] }),
    setMode: (mode) => set({ mode }),
    setLoading: (loading) => set({ loading }),
    setProgress: (progress) => set({ progress }),
    setCurrentReview: (currentReview) => set({ currentReview }),
    updateFileStatus: (id, status, progress) => set((s) => ({
        files: s.files.map((f) => f.id === id ? { ...f, status, ...(progress !== undefined ? { progress } : {}) } : f),
    })),
}));
