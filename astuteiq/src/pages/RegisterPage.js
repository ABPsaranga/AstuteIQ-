import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRegister } from '../features/auth/hooks';
import { Eye, EyeOff, ShieldCheck, User } from 'lucide-react';
const ROLES = [
    {
        value: 'user',
        label: 'Paraplanner',
        desc: 'Run reviews & export reports',
        dest: 'User dashboard',
        icon: User,
        color: 'text-[#A78BFA]',
        border: 'border-[#6B2FD9] bg-[#6B2FD9]/10',
    },
    {
        value: 'admin',
        label: 'Admin',
        desc: 'Manage practice & team access',
        dest: 'Admin dashboard',
        icon: ShieldCheck,
        color: 'text-[#2DD4A0]',
        border: 'border-[#2DD4A0] bg-[#2DD4A0]/10',
    },
];
export default function RegisterPage() {
    const [role, setRole] = useState('user');
    const [name, setName] = useState('');
    const [practice, setPractice] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [strength, setStrength] = useState(0);
    const { register, loading } = useRegister();
    function checkStrength(pw) {
        let score = 0;
        if (pw.length >= 8)
            score++;
        if (/[A-Z]/.test(pw))
            score++;
        if (/[0-9]/.test(pw))
            score++;
        if (/[^A-Za-z0-9]/.test(pw))
            score++;
        setStrength(score);
        setPassword(pw);
    }
    function handleSubmit(e) {
        e.preventDefault();
        register(name, email, password, practice, role);
    }
    const active = ROLES.find((r) => r.value === role);
    const strengthMeta = [
        { label: 'Weak', color: '#FF6B6B' },
        { label: 'Fair', color: '#FFB347' },
        { label: 'Good', color: '#FFB347' },
        { label: 'Strong', color: '#2DD4A0' },
        { label: 'Very strong', color: '#2DD4A0' },
    ][strength] ?? { label: '', color: '' };
    return (_jsxs("div", { className: "min-h-screen flex items-center justify-center px-4 py-12", style: { background: '#0B0B14' }, children: [_jsx("div", { className: "pointer-events-none fixed inset-0 overflow-hidden", children: _jsx("div", { className: "absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-15", style: { background: 'radial-gradient(ellipse, #6B2FD9 0%, transparent 70%)' } }) }), _jsxs("div", { className: "relative z-10 w-full max-w-sm space-y-6", children: [_jsxs("div", { className: "text-center space-y-1", children: [_jsxs("h1", { className: "text-4xl font-bold text-white", style: { fontFamily: "'DM Serif Display', Georgia, serif" }, children: ["Astute", _jsx("span", { style: { color: '#A78BFA' }, children: "IQ" })] }), _jsx("p", { className: "text-slate-500 text-sm", children: "Create your account" })] }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: ROLES.map(({ value, label, desc, dest, icon: Icon, color, border }) => (_jsxs("button", { type: "button", onClick: () => setRole(value), className: `flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-150 ${role === value
                                ? border
                                : 'border-slate-800 bg-[#0f0f1a] hover:border-slate-600'}`, children: [_jsx("div", { className: `p-2 rounded-xl ${role === value ? 'bg-white/10' : 'bg-slate-800'}`, children: _jsx(Icon, { size: 16, className: role === value ? color : 'text-slate-500' }) }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: `text-xs font-semibold ${role === value ? 'text-white' : 'text-slate-400'}`, children: label }), _jsx("p", { className: "text-xs text-slate-600 mt-0.5", children: desc }), role === value && (_jsxs("p", { className: "text-xs mt-1 font-medium", style: { color: role === 'admin' ? '#2DD4A0' : '#A78BFA' }, children: ["\u2192 ", dest] }))] })] }, value))) }), _jsxs("div", { className: "rounded-2xl border border-slate-800 bg-[#0f0f1a] p-6 space-y-4 shadow-2xl", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(active.icon, { size: 14, className: active.color }), _jsxs("h2", { className: "text-sm font-semibold text-white", children: ["Register as ", active.label] })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Full name" }), _jsx("input", { className: "input", placeholder: "Sarah Johnson", value: name, onChange: (e) => setName(e.target.value), required: true, autoFocus: true })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Practice name" }), _jsx("input", { className: "input", placeholder: "Astute Financial Planning", value: practice, onChange: (e) => setPractice(e.target.value), required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Email" }), _jsx("input", { type: "email", className: "input", placeholder: role === 'admin' ? 'admin@practice.com.au' : 'you@practice.com.au', value: email, onChange: (e) => setEmail(e.target.value), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "label", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showPw ? 'text' : 'password', className: "input pr-10", placeholder: "Min. 8 characters", value: password, onChange: (e) => checkStrength(e.target.value), minLength: 8, required: true }), _jsx("button", { type: "button", onClick: () => setShowPw((v) => !v), className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors", children: showPw ? _jsx(EyeOff, { size: 15 }) : _jsx(Eye, { size: 15 }) })] }), password.length > 0 && (_jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "flex gap-1", children: [1, 2, 3, 4].map((i) => (_jsx("div", { className: "flex-1 h-1 rounded-full transition-colors duration-300", style: { background: i <= strength ? strengthMeta.color : '#1e1e30' } }, i))) }), _jsx("p", { className: "text-xs", style: { color: strengthMeta.color }, children: strengthMeta.label })] }))] }), _jsxs("div", { className: "flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-xs leading-relaxed", style: {
                                            background: role === 'admin' ? 'rgba(45,212,160,0.05)' : 'rgba(107,47,217,0.05)',
                                            borderColor: role === 'admin' ? 'rgba(45,212,160,0.2)' : 'rgba(107,47,217,0.2)',
                                            color: role === 'admin' ? '#2DD4A0' : '#A78BFA',
                                        }, children: [_jsx(active.icon, { size: 12, className: "mt-0.5 shrink-0" }), _jsxs("span", { children: ["Registering as ", _jsx("strong", { children: active.label }), " \u2014", ' ', role === 'admin'
                                                        ? 'you will be taken to the Admin dashboard.'
                                                        : 'you will be taken to the User dashboard.'] })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 disabled:opacity-50", style: {
                                            background: role === 'admin' ? '#1a4a3a' : '#6B2FD9',
                                            border: role === 'admin' ? '1px solid rgba(45,212,160,0.3)' : 'none',
                                            color: role === 'admin' ? '#2DD4A0' : 'white',
                                        }, children: loading ? (_jsx("span", { className: "w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" })) : (`Create ${active.label} account`) })] }), _jsxs("p", { className: "text-center text-xs text-slate-500 pt-1", children: ["Already have an account?", ' ', _jsx(Link, { to: "/login", className: "text-[#A78BFA] hover:text-[#c4b5fd] transition-colors", children: "Sign in" })] })] }), _jsx("p", { className: "text-center text-xs text-slate-700", children: "Astute Business Partners \u00B7 ISO 27001 certified" })] })] }));
}
