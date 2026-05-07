import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForgotPassword } from '../features/auth/hooks';
import { ArrowLeft, CheckCircle } from 'lucide-react';
export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const { sendReset, loading, sent } = useForgotPassword();
    function handleSubmit(e) {
        e.preventDefault();
        sendReset(email);
    }
    return (_jsx("div", { className: "min-h-screen bg-surface flex items-center justify-center px-4", children: _jsxs("div", { className: "w-full max-w-sm", children: [_jsx("div", { className: "text-center mb-8", children: _jsxs("h1", { className: "text-3xl font-bold text-white", children: ["Astute", _jsx("span", { className: "text-brand-400", children: "IQ" })] }) }), _jsxs("div", { className: "card", children: [_jsxs(Link, { to: "/login", className: "inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 mb-4", children: [_jsx(ArrowLeft, { size: 13 }), " Back to login"] }), sent ? (_jsxs("div", { className: "text-center py-4 space-y-3", children: [_jsx(CheckCircle, { size: 36, className: "text-green-400 mx-auto" }), _jsx("p", { className: "text-white font-medium", children: "Reset link sent" }), _jsx("p", { className: "text-sm text-slate-400", children: "Check your email for a link to reset your password." })] })) : (_jsxs(_Fragment, { children: [_jsx("h2", { className: "text-lg font-semibold text-white mb-1", children: "Forgot password?" }), _jsx("p", { className: "text-sm text-slate-400 mb-5", children: "Enter your email and we'll send you a reset link." }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Email" }), _jsx("input", { type: "email", className: "input", placeholder: "you@practice.com.au", value: email, onChange: (e) => setEmail(e.target.value), required: true, autoFocus: true })] }), _jsx("button", { type: "submit", disabled: loading, className: "btn-primary w-full justify-center py-2.5", children: loading ? 'Sending…' : 'Send reset link' })] })] }))] })] }) }));
}
