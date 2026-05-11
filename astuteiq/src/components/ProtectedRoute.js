import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store';
/**
 * Protects routes:
 * - Redirects unauthenticated users to /login
 * - Redirects unauthorized roles to their correct dashboard
 * - Waits for persisted auth hydration
 */
export default function ProtectedRoute({ roles }) {
    const user = useAuthStore((s) => s.user);
    const isReady = useAuthStore((s) => s.isReady);
    const location = useLocation();
    // Wait for Zustand persist hydration
    if (!isReady) {
        return (_jsx("div", { className: "min-h-screen bg-surface flex items-center justify-center", children: _jsx("div", { className: "w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" }) }));
    }
    // Not logged in
    if (!user) {
        return _jsx(Navigate, { to: "/login", replace: true, state: { from: location } });
    }
    // Role-based protection
    if (roles && !roles.includes(user.role)) {
        // Admin trying to access user pages
        if (user.role === 'admin') {
            return _jsx(Navigate, { to: "/admin", replace: true });
        }
        // User/paraplanner trying to access admin pages
        return _jsx(Navigate, { to: "/dashboard", replace: true });
    }
    return _jsx(Outlet, {});
}
