import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store';
/**
 * Renders children only if the current user has one of the allowed roles.
 * Otherwise redirects to fallback path.
 */
export default function RoleGuard({ roles, children, fallback = '/dashboard' }) {
    const user = useAuthStore((s) => s.user);
    const allowed = Array.isArray(roles) ? roles : [roles];
    if (!user || !allowed.includes(user.role)) {
        return _jsx(Navigate, { to: fallback, replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
