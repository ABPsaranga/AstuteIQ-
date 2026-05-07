import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useResetPassword } from '../features/auth/hooks';
export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') ?? '';
    const { resetPassword, loading } = useResetPassword();
    function handleSubmit(e) {
        e.preventDefault();
        if (password !== confirm)
            return;
        resetPassword(token, password);
    }
    return (_jsx("div", { className: "min-h-screen bg-surface flex items-center justify-center px-4", children: _jsxs("div", { className: "w-full max-w-sm", children: [_jsx("div", { className: "text-center mb-8", children: _jsxs("h1", { className: "text-3xl font-bold text-white", children: ["Astute", _jsx("span", { className: "text-brand-400", children: "IQ" })] }) }), _jsxs("div", { className: "card", children: [_jsx("h2", { className: "text-lg font-semibold text-white mb-1", children: "Set new password" }), _jsx("p", { className: "text-sm text-slate-400 mb-5", children: "Must be at least 8 characters." }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "New password" }), _jsx("input", { type: "password", className: "input", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: password, onChange: (e) => setPassword(e.target.value), minLength: 8, required: true, autoFocus: true })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Confirm password" }), _jsx("input", { type: "password", className: "input", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: confirm, onChange: (e) => setConfirm(e.target.value), minLength: 8, required: true }), password && confirm && password !== confirm && (_jsx("p", { className: "text-xs text-red-400 mt-1", children: "Passwords don't match." }))] }), _jsx("button", { type: "submit", disabled: loading || password !== confirm || !password, className: "btn-primary w-full justify-center py-2.5", children: loading ? 'Updating…' : 'Update password' })] })] })] }) }));
}
