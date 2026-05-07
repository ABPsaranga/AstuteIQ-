import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlayCircle, Clock, BarChart2, FileSearch, Settings, ShieldCheck, Users, ChevronRight, } from 'lucide-react';
import { useAuthStore } from '../features/auth/store';
const NAV_ITEMS = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/run-review', label: 'Run Review', icon: PlayCircle },
    { to: '/history', label: 'History', icon: Clock },
    { to: '/analytics', label: 'Analytics', icon: BarChart2 },
    { to: '/soa-analysis', label: 'SOA Analysis', icon: FileSearch },
    { to: '/settings', label: 'Settings', icon: Settings },
    // Admin
    { to: '/admin', label: 'Admin Panel', icon: ShieldCheck, adminOnly: true },
    { to: '/admin/users', label: 'Users', icon: Users, adminOnly: true },
];
export default function Sidebar() {
    const user = useAuthStore((s) => s.user);
    const items = NAV_ITEMS.filter((i) => !i.adminOnly || user?.role === 'admin');
    return (_jsxs("aside", { className: "w-60 shrink-0 bg-surface-card border-r border-surface-border flex flex-col h-screen sticky top-0", children: [_jsx("div", { className: "h-16 flex items-center px-5 border-b border-surface-border", children: _jsxs("span", { className: "text-lg font-bold text-white tracking-tight", children: ["Astute", _jsx("span", { className: "text-brand-400", children: "IQ" })] }) }), _jsx("nav", { className: "flex-1 overflow-y-auto py-4 px-3 space-y-0.5", children: items.map((item) => (_jsx(NavLink, { to: item.to, className: ({ isActive }) => `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${isActive
                        ? 'bg-brand-500/15 text-brand-400'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-surface-hover'}`, children: ({ isActive }) => (_jsxs(_Fragment, { children: [_jsx(item.icon, { size: 17, className: isActive ? 'text-brand-400' : '' }), _jsx("span", { className: "flex-1", children: item.label }), isActive && (_jsx(ChevronRight, { size: 13, className: "text-brand-400 opacity-70" }))] })) }, item.to))) }), user && (_jsx("div", { className: "p-4 border-t border-surface-border", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold uppercase", children: (user.name ?? user.email ?? '?').charAt(0) }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-slate-200 truncate", children: user.name ?? user.email }), _jsx("p", { className: "text-xs text-slate-500 capitalize", children: user.role })] })] }) }))] }));
}
