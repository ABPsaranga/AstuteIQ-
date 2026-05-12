import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { UserPlus, Search, ShieldCheck, User, Trash2 } from 'lucide-react';
import InviteUserModal from '../components/InviteUserModal';
import RoleGuard from '../components/RoleGuard';
import toast from 'react-hot-toast';
import api from '../lib/api';
export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [showInvite, setShowInvite] = useState(false);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        loadUsers();
    }, []);
    async function loadUsers() {
        try {
            setLoading(true);
            const res = await api.get('/users');
            setUsers(res.data);
        }
        catch (err) {
            console.error(err);
            toast.error('Failed to load users');
        }
        finally {
            setLoading(false);
        }
    }
    const filtered = useMemo(() => {
        return users.filter((u) => search.trim() === '' ||
            u.full_name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase()));
    }, [users, search]);
    async function toggleRole(user) {
        try {
            const updatedRole = user.role === 'admin' ? 'user' : 'admin';
            await api.patch(`/users/${user.id}/role`, {
                role: updatedRole,
            });
            setUsers((prev) => prev.map((u) => u.id === user.id
                ? { ...u, role: updatedRole }
                : u));
            toast.success('Role updated');
        }
        catch (err) {
            console.error(err);
            toast.error('Failed to update role');
        }
    }
    async function toggleActive(user) {
        try {
            await api.patch(`/users/${user.id}/status`, {
                active: !user.active,
            });
            setUsers((prev) => prev.map((u) => u.id === user.id
                ? { ...u, active: !u.active }
                : u));
            toast.success('Status updated');
        }
        catch (err) {
            console.error(err);
            toast.error('Failed to update status');
        }
    }
    async function removeUser(user) {
        const confirmed = window.confirm(`Remove ${user.full_name}?`);
        if (!confirmed)
            return;
        try {
            await api.delete(`/users/${user.id}`);
            setUsers((prev) => prev.filter((u) => u.id !== user.id));
            toast.success('User removed');
        }
        catch (err) {
            console.error(err);
            toast.error('Failed to remove user');
        }
    }
    return (_jsx(RoleGuard, { roles: "admin", children: _jsxs("div", { className: "space-y-5 animate-fade-in", children: [_jsxs("div", { className: "flex items-start justify-between flex-wrap gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "page-header", children: "Users" }), _jsx("p", { className: "page-sub", children: "Manage accounts and permissions." })] }), _jsxs("button", { onClick: () => setShowInvite(true), className: "btn-primary", children: [_jsx(UserPlus, { size: 14 }), "Invite user"] })] }), _jsxs("div", { className: "relative max-w-xs", children: [_jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" }), _jsx("input", { className: "input pl-9 h-9 text-sm", placeholder: "Search users...", value: search, onChange: (e) => setSearch(e.target.value) })] }), _jsx("div", { className: "card p-0 overflow-hidden", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-surface-border bg-surface-hover text-xs text-slate-500 uppercase tracking-wide", children: [_jsx("th", { className: "text-left px-5 py-3", children: "User" }), _jsx("th", { className: "text-left px-5 py-3", children: "Role" }), _jsx("th", { className: "text-left px-5 py-3", children: "Reviews" }), _jsx("th", { className: "text-left px-5 py-3", children: "Joined" }), _jsx("th", { className: "text-left px-5 py-3", children: "Status" }), _jsx("th", { className: "px-5 py-3" })] }) }), _jsx("tbody", { children: loading ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "text-center py-10 text-slate-500", children: "Loading users..." }) })) : filtered.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "text-center py-10 text-slate-500", children: "No users found." }) })) : (filtered.map((u) => (_jsxs("tr", { className: "border-b border-surface-border hover:bg-surface-hover transition-colors", children: [_jsx("td", { className: "px-5 py-3", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold uppercase shrink-0", children: u.full_name.charAt(0) }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-200", children: u.full_name }), _jsx("p", { className: "text-xs text-slate-500", children: u.email })] })] }) }), _jsx("td", { className: "px-5 py-3", children: _jsxs("button", { onClick: () => toggleRole(u), className: `inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border font-medium transition-colors ${u.role === 'admin'
                                                    ? 'border-brand-500/40 bg-brand-500/10 text-brand-300'
                                                    : 'border-surface-border text-slate-400 hover:border-slate-500'}`, children: [u.role === 'admin' ? (_jsx(ShieldCheck, { size: 11 })) : (_jsx(User, { size: 11 })), u.role] }) }), _jsx("td", { className: "px-5 py-3 text-slate-400", children: u.reviews_count }), _jsx("td", { className: "px-5 py-3 text-slate-400", children: new Date(u.created_at).toLocaleDateString() }), _jsx("td", { className: "px-5 py-3", children: _jsx("button", { onClick: () => toggleActive(u), className: `text-xs px-2 py-1 rounded-full border font-medium transition-colors ${u.active
                                                    ? 'border-green-500/30 bg-green-500/10 text-green-400'
                                                    : 'border-slate-600/30 bg-slate-500/10 text-slate-500'}`, children: u.active ? 'Active' : 'Inactive' }) }), _jsx("td", { className: "px-5 py-3 text-right", children: _jsx("button", { onClick: () => removeUser(u), className: "text-slate-600 hover:text-red-400 transition-colors", children: _jsx(Trash2, { size: 14 }) }) })] }, u.id)))) })] }) }), showInvite && (_jsx(InviteUserModal, { onClose: () => {
                        setShowInvite(false);
                        loadUsers();
                    } }))] }) }));
}
