import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useAuthStore = create()(persist((set) => ({
    user: null,
    token: null,
    isReady: false,
    setAuth: (user, token) => set({
        user,
        token,
        isReady: true,
    }),
    // ✅ Proper logout (used by Navbar)
    logout: () => set({
        user: null,
        token: null,
        isReady: true,
    }),
    setReady: () => set({ isReady: true }),
}), {
    name: 'astuteiq-auth',
    // persist only necessary data
    partialize: (state) => ({
        user: state.user,
        token: state.token,
    }),
    onRehydrateStorage: () => (state) => {
        state?.setReady();
    },
}));
