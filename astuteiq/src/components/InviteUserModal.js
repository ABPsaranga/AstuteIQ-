import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { X, Mail, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
export default function InviteUserModal({ onClose }) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('user');
    const [loading, setLoading] = useState(false);
    async function handleInvite() {
        if (!email.trim())
            return;
        setLoading(true);
        // Mock invite call
        await new Promise((r) => setTimeout(r, 800));
        toast.success(`Invite sent to ${email}`);
        setLoading(false);
        onClose();
    }
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in", children: _jsxs("div", { className: "card w-full max-w-md mx-4 animate-slide-up", children: [_jsxs("div", { className: "flex items-center justify-between mb-5", children: [_jsxs("h2", { className: "text-base font-semibold text-white flex items-center gap-2", children: [_jsx(UserPlus, { size: 17, className: "text-brand-400" }), "Invite User"] }), _jsx("button", { onClick: onClose, className: "text-slate-500 hover:text-slate-300 transition-colors", children: _jsx(X, { size: 18 }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Email address" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { size: 15, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" }), _jsx("input", { type: "email", className: "input pl-9", placeholder: "advisor@practice.com.au", value: email, onChange: (e) => setEmail(e.target.value) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Role" }), _jsxs("select", { className: "input", value: role, onChange: (e) => setRole(e.target.value), children: [_jsx("option", { value: "user", children: "User \u2014 can run reviews" }), _jsx("option", { value: "admin", children: "Admin \u2014 full access" })] })] })] }), _jsxs("div", { className: "flex justify-end gap-3 mt-6", children: [_jsx("button", { onClick: onClose, className: "btn-secondary", children: "Cancel" }), _jsx("button", { onClick: handleInvite, disabled: !email.trim() || loading, className: "btn-primary", children: loading ? 'Sending…' : 'Send invite' })] })] }) }));
}
