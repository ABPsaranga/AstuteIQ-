import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { X, Mail, UserPlus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';
export default function InviteUserModal({ onClose }) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('user');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    async function handleInvite() {
        if (!email.trim())
            return;
        setLoading(true);
        setError(null);
        try {
            // Real backend call — service-role key stays server-side in auth.py
            await apiClient.post('/auth/invite', { email: email.trim(), role });
            toast.success(`Invite sent to ${email.trim()}`);
            onClose();
        }
        catch (err) {
            // FastAPI surfaces errors in err.response.data.detail
            const message = err?.response?.data?.detail ??
                err?.message ??
                'Failed to send invite — try again.';
            setError(message);
        }
        finally {
            setLoading(false);
        }
    }
    function handleKeyDown(e) {
        if (e.key === 'Enter' && email.trim() && !loading)
            handleInvite();
        if (e.key === 'Escape')
            onClose();
    }
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in", 
        // Click outside to close
        onClick: (e) => { if (e.target === e.currentTarget)
            onClose(); }, children: _jsxs("div", { className: "card w-full max-w-md mx-4 animate-slide-up", onKeyDown: handleKeyDown, children: [_jsxs("div", { className: "flex items-center justify-between mb-5", children: [_jsxs("h2", { className: "text-base font-semibold text-white flex items-center gap-2", children: [_jsx(UserPlus, { size: 17, className: "text-brand-400" }), "Invite User"] }), _jsx("button", { onClick: onClose, className: "text-slate-500 hover:text-slate-300 transition-colors", children: _jsx(X, { size: 18 }) })] }), error && (_jsxs("div", { className: "flex gap-2 items-start p-3 mb-4 rounded-lg bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 text-sm text-[#FF6B6B]", children: [_jsx(AlertCircle, { size: 14, className: "shrink-0 mt-0.5" }), _jsx("span", { children: error })] })), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Email address" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { size: 15, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" }), _jsx("input", { type: "email", autoFocus: true, className: "input pl-9", placeholder: "adviser@practice.com.au", value: email, onChange: (e) => { setEmail(e.target.value); setError(null); } })] })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Role" }), _jsxs("select", { className: "input", value: role, onChange: (e) => setRole(e.target.value), children: [_jsx("option", { value: "user", children: "User \u2014 can run reviews" }), _jsx("option", { value: "admin", children: "Admin \u2014 full access" })] }), role === 'admin' && (_jsx("p", { className: "text-xs text-[#FFB347] mt-1.5", children: "Admin users can manage all reviews, users, and platform settings." }))] })] }), _jsxs("div", { className: "flex justify-end gap-3 mt-6", children: [_jsx("button", { onClick: onClose, className: "btn-secondary", children: "Cancel" }), _jsx("button", { onClick: handleInvite, disabled: !email.trim() || loading, className: "btn-primary inline-flex items-center gap-2", children: loading ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" }), "Sending\u2026"] })) : ('Send invite') })] })] }) }));
}
