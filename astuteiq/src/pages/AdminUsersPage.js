import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { UserPlus, Search, ShieldCheck, User, Trash2 } from 'lucide-react';
import InviteUserModal from '../components/InviteUserModal';
import RoleGuard from '../components/RoleGuard';
import toast from 'react-hot-toast';
const INITIAL_USERS = [
    { id: 'u1', name: 'Admin User', email: 'admin@astuteiq.com.au', role: 'admin', reviews: 0, joinedAt: '2024-01-10', active: true },
    { id: 'u2', name: 'Jane Planner', email: 'user@astuteiq.com.au', role: 'user', reviews: 42, joinedAt: '2024-02-14', active: true },
    { id: 'u3', name: 'Mark Advisor', email: 'mark@demo.com.au', role: 'user', reviews: 31, joinedAt: '2024-03-01', active: true },
    { id: 'u4', name: 'Sarah Broker', email: 'sarah@demo.com.au', role: 'user', reviews: 27, joinedAt: '2024-04-22', active: false },
    { id: 'u5', name: 'Chris Finance', email: 'chris@demo.com.au', role: 'user', reviews: 19, joinedAt: '2024-05-05', active: true },
];
export default function AdminUsersPage() {
    const [users, setUsers] = useState(INITIAL_USERS);
    const [search, setSearch] = useState('');
    const [showInvite, setShowInvite] = useState(false);
    const filtered = users.filter((u) => search.trim() === '' ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()));
    function toggleRole(id) {
        setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: u.role === 'admin' ? 'user' : 'admin' } : u));
        toast.success('Role updated.');
    }
    function toggleActive(id) {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u)));
        toast.success('User status updated.');
    }
    function removeUser(id) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        toast.success('User removed.');
    }
    return (_jsx(RoleGuard, { roles: "admin", children: _jsxs("div", { className: "space-y-5 animate-fade-in", children: [_jsxs("div", { className: "flex items-start justify-between flex-wrap gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "page-header", children: "Users" }), _jsx("p", { className: "page-sub", children: "Manage accounts and permissions." })] }), _jsxs("button", { onClick: () => setShowInvite(true), className: "btn-primary", children: [_jsx(UserPlus, { size: 14 }), "Invite user"] })] }), _jsxs("div", { className: "relative max-w-xs", children: [_jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" }), _jsx("input", { className: "input pl-9 h-9 text-sm", placeholder: "Search users\u2026", value: search, onChange: (e) => setSearch(e.target.value) })] }), _jsx("div", { className: "card p-0 overflow-hidden", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-surface-border bg-surface-hover text-xs text-slate-500 uppercase tracking-wide", children: [_jsx("th", { className: "text-left px-5 py-3", children: "User" }), _jsx("th", { className: "text-left px-5 py-3", children: "Role" }), _jsx("th", { className: "text-left px-5 py-3", children: "Reviews" }), _jsx("th", { className: "text-left px-5 py-3", children: "Joined" }), _jsx("th", { className: "text-left px-5 py-3", children: "Status" }), _jsx("th", { className: "px-5 py-3" })] }) }), _jsx("tbody", { children: filtered.map((u) => (_jsxs("tr", { className: "border-b border-surface-border hover:bg-surface-hover transition-colors", children: [_jsx("td", { className: "px-5 py-3", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold uppercase shrink-0", children: u.name.charAt(0) }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-200", children: u.name }), _jsx("p", { className: "text-xs text-slate-500", children: u.email })] })] }) }), _jsx("td", { className: "px-5 py-3", children: _jsxs("button", { onClick: () => toggleRole(u.id), className: `inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border font-medium transition-colors ${u.role === 'admin'
                                                    ? 'border-brand-500/40 bg-brand-500/10 text-brand-300'
                                                    : 'border-surface-border text-slate-400 hover:border-slate-500'}`, children: [u.role === 'admin' ? _jsx(ShieldCheck, { size: 11 }) : _jsx(User, { size: 11 }), u.role] }) }), _jsx("td", { className: "px-5 py-3 text-slate-400", children: u.reviews }), _jsx("td", { className: "px-5 py-3 text-slate-400", children: u.joinedAt }), _jsx("td", { className: "px-5 py-3", children: _jsx("button", { onClick: () => toggleActive(u.id), className: `text-xs px-2 py-1 rounded-full border font-medium transition-colors ${u.active
                                                    ? 'border-green-500/30 bg-green-500/10 text-green-400'
                                                    : 'border-slate-600/30 bg-slate-500/10 text-slate-500'}`, children: u.active ? 'Active' : 'Inactive' }) }), _jsx("td", { className: "px-5 py-3 text-right", children: _jsx("button", { onClick: () => removeUser(u.id), className: "text-slate-600 hover:text-red-400 transition-colors", title: "Remove user", children: _jsx(Trash2, { size: 14 }) }) })] }, u.id))) })] }) }), showInvite && _jsx(InviteUserModal, { onClose: () => setShowInvite(false) })] }) }));
}
