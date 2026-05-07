import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Users, FileSearch, TrendingUp, AlertTriangle, UserPlus } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import ActivityChart from '../components/ActivityChart';
import InviteUserModal from '../components/InviteUserModal';
import RoleGuard from '../components/RoleGuard';
const TOP_USERS = [
    { name: 'Jane Planner', email: 'jane@example.com.au', reviews: 42, avgScore: 88 },
    { name: 'Mark Accountant', email: 'mark@example.com.au', reviews: 31, avgScore: 76 },
    { name: 'Sarah Broker', email: 'sarah@example.com.au', reviews: 27, avgScore: 91 },
    { name: 'Chris Adviser', email: 'chris@example.com.au', reviews: 19, avgScore: 83 },
    { name: 'Emma Finance', email: 'emma@example.com.au', reviews: 14, avgScore: 72 },
];
export default function AdminDashboardPage() {
    const [showInvite, setShowInvite] = useState(false);
    return (_jsx(RoleGuard, { roles: "admin", children: _jsxs("div", { className: "space-y-6 animate-fade-in", children: [_jsxs("div", { className: "flex items-start justify-between flex-wrap gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "page-header", children: "Admin Dashboard" }), _jsx("p", { className: "page-sub", children: "System-wide usage and user activity." })] }), _jsxs("button", { onClick: () => setShowInvite(true), className: "btn-primary", children: [_jsx(UserPlus, { size: 14 }), "Invite user"] })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsx(StatCard, { label: "Total users", value: 133, icon: Users }), _jsx(StatCard, { label: "Reviews this month", value: 487, icon: FileSearch, variant: "success" }), _jsx(StatCard, { label: "Platform avg score", value: "83%", icon: TrendingUp, variant: "success" }), _jsx(StatCard, { label: "Failed reviews", value: 29, icon: AlertTriangle, variant: "danger" })] }), _jsxs("div", { className: "card", children: [_jsx("h2", { className: "text-sm font-semibold text-white mb-4", children: "Platform activity \u2014 last 14 days" }), _jsx(ActivityChart, { height: 200 })] }), _jsxs("div", { className: "card p-0 overflow-hidden", children: [_jsx("div", { className: "px-5 py-4 border-b border-surface-border", children: _jsx("h2", { className: "text-sm font-semibold text-white", children: "Top users by volume" }) }), _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-surface-border bg-surface-hover text-xs text-slate-500 uppercase tracking-wide", children: [_jsx("th", { className: "text-left px-5 py-3", children: "User" }), _jsx("th", { className: "text-left px-5 py-3", children: "Reviews" }), _jsx("th", { className: "text-left px-5 py-3", children: "Avg score" })] }) }), _jsx("tbody", { children: TOP_USERS.map((u) => (_jsxs("tr", { className: "border-b border-surface-border hover:bg-surface-hover transition-colors", children: [_jsxs("td", { className: "px-5 py-3", children: [_jsx("p", { className: "text-slate-200", children: u.name }), _jsx("p", { className: "text-xs text-slate-500", children: u.email })] }), _jsx("td", { className: "px-5 py-3 text-slate-300", children: u.reviews }), _jsx("td", { className: "px-5 py-3", children: _jsxs("span", { className: `font-semibold ${u.avgScore >= 80 ? 'text-green-400' : 'text-orange-400'}`, children: [u.avgScore, "%"] }) })] }, u.email))) })] })] }), showInvite && _jsx(InviteUserModal, { onClose: () => setShowInvite(false) })] }) }));
}
