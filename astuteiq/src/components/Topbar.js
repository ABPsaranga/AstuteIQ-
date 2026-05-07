import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Bell, LogOut, Search } from 'lucide-react';
import { useLogout } from '../features/auth/hooks';
import { useAuthStore } from '../features/auth/store';
export default function Topbar() {
    const { logout } = useLogout();
    const user = useAuthStore((s) => s.user);
    return (_jsxs("header", { className: "h-16 bg-surface-card border-b border-surface-border flex items-center px-6 gap-4 sticky top-0 z-10", children: [_jsx("div", { className: "flex-1 max-w-sm", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { size: 15, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" }), _jsx("input", { className: "input pl-9 py-1.5 text-sm h-9", placeholder: "Search reviews\u2026", readOnly: true })] }) }), _jsxs("div", { className: "flex items-center gap-2 ml-auto", children: [_jsxs("button", { className: "relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-hover transition-colors", children: [_jsx(Bell, { size: 18 }), _jsx("span", { className: "absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-400 rounded-full" })] }), user && (_jsx("span", { className: "text-sm text-slate-400 hidden sm:block", children: user.name })), _jsx("button", { onClick: logout, className: "p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-surface-hover transition-colors", title: "Sign out", children: _jsx(LogOut, { size: 18 }) })] })] }));
}
