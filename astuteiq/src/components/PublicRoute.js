import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store';
/**
 * Redirects already-authenticated users away from login/register pages.
 */
export default function PublicRoute() {
    const user = useAuthStore((s) => s.user);
    const isReady = useAuthStore((s) => s.isReady);
    if (!isReady) {
        return (_jsx("div", { className: "min-h-screen bg-surface flex items-center justify-center", children: _jsx("div", { className: "w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" }) }));
    }
    if (user) {
        return _jsx(Navigate, { to: "/dashboard", replace: true });
    }
    return _jsx(Outlet, {});
}
