import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuthStore } from '../features/auth/store';
import { User, Bell, Shield, Key, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
function Toggle({ value, onChange }) {
    return (_jsx("button", { type: "button", onClick: () => onChange(!value), className: `relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0 ${value ? 'bg-[#6B2FD9]' : 'bg-slate-700'}`, children: _jsx("span", { className: `absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0.5'}` }) }));
}
export default function SettingsPage() {
    const user = useAuthStore((s) => s.user);
    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [saving, setSaving] = useState(false);
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [autoExport, setAutoExport] = useState(false);
    const [weeklyDigest, setWeeklyDigest] = useState(true);
    const isAdmin = user?.role === 'admin';
    const roleLabel = isAdmin ? 'Admin' : 'Paraplanner';
    const roleColor = isAdmin ? '#2DD4A0' : '#A78BFA';
    const roleBg = isAdmin ? 'rgba(45,212,160,0.1)' : 'rgba(107,47,217,0.1)';
    const roleBorder = isAdmin ? 'rgba(45,212,160,0.25)' : 'rgba(107,47,217,0.25)';
    async function handleSaveProfile(e) {
        e.preventDefault();
        setSaving(true);
        // Replace with real Supabase user update:
        // await supabase.auth.updateUser({ data: { name } })
        await new Promise((r) => setTimeout(r, 600));
        setSaving(false);
        toast.success('Profile updated.');
    }
    async function handleChangePassword(e) {
        e.preventDefault();
        // Replace with real Supabase password reset:
        // await supabase.auth.resetPasswordForEmail(email)
        await new Promise((r) => setTimeout(r, 600));
        toast.success('Password reset link sent — check your inbox.');
    }
    function handleToggle(_label, setter, value) {
        setter(!value);
        toast.success('Preference saved.');
    }
    return (_jsxs("div", { className: "space-y-6 animate-fade-in max-w-2xl", children: [_jsxs("div", { children: [_jsx("h1", { className: "page-header", children: "Settings" }), _jsx("p", { className: "page-sub", children: "Manage your account and preferences." })] }), _jsxs("div", { className: "card space-y-5", children: [_jsxs("div", { className: "flex items-center gap-2 pb-3 border-b border-slate-800", children: [_jsx(User, { size: 14, className: "text-[#A78BFA]" }), _jsx("h2", { className: "text-sm font-semibold text-white", children: "Profile" })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0", style: {
                                    background: isAdmin
                                        ? 'linear-gradient(135deg, #1a4a3a, #2DD4A0)'
                                        : 'linear-gradient(135deg, #4a1f99, #6B2FD9)',
                                }, children: (name || email || 'U').charAt(0).toUpperCase() }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-white", children: name || email || 'User' }), _jsxs("div", { className: "mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border", style: { color: roleColor, background: roleBg, borderColor: roleBorder }, children: [isAdmin ? _jsx(ShieldCheck, { size: 11 }) : _jsx(User, { size: 11 }), roleLabel] })] })] }), _jsxs("form", { onSubmit: handleSaveProfile, className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Full name" }), _jsx("input", { className: "input", placeholder: "Sarah Johnson", value: name, onChange: (e) => setName(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Email" }), _jsx("input", { type: "email", className: "input", value: email, onChange: (e) => setEmail(e.target.value) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Role" }), _jsxs("div", { className: "w-full px-3 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 cursor-not-allowed", style: {
                                            background: roleBg,
                                            borderColor: roleBorder,
                                            color: roleColor,
                                        }, children: [isAdmin ? _jsx(ShieldCheck, { size: 14 }) : _jsx(User, { size: 14 }), roleLabel, _jsx("span", { className: "ml-auto text-xs opacity-50 font-normal", children: "read-only" })] })] }), _jsx("div", { className: "flex justify-end", children: _jsx("button", { type: "submit", disabled: saving, className: "btn-primary", children: saving ? (_jsx("span", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" })) : 'Save profile' }) })] })] }), _jsxs("div", { className: "card space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 pb-3 border-b border-slate-800", children: [_jsx(Bell, { size: 14, className: "text-[#A78BFA]" }), _jsx("h2", { className: "text-sm font-semibold text-white", children: "Notifications" })] }), [
                        {
                            label: 'Email alerts on review completion',
                            desc: 'Receive an email each time a review finishes processing.',
                            value: emailAlerts,
                            setter: setEmailAlerts,
                        },
                        {
                            label: 'Weekly digest',
                            desc: 'Summary of all reviews run in the past 7 days.',
                            value: weeklyDigest,
                            setter: setWeeklyDigest,
                        },
                        {
                            label: 'Auto-export Word report on completion',
                            desc: 'Automatically download the Word report when a review finishes.',
                            value: autoExport,
                            setter: setAutoExport,
                        },
                    ].map(({ label, desc, value, setter }) => (_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-200", children: label }), _jsx("p", { className: "text-xs text-slate-500 mt-0.5", children: desc })] }), _jsx(Toggle, { value: value, onChange: (v) => handleToggle(label, setter, v) })] }, label)))] }), _jsxs("div", { className: "card space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 pb-3 border-b border-slate-800", children: [_jsx(Shield, { size: 14, className: "text-[#A78BFA]" }), _jsx("h2", { className: "text-sm font-semibold text-white", children: "Security" })] }), _jsxs("form", { onSubmit: handleChangePassword, className: "flex items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-200", children: "Password" }), _jsxs("p", { className: "text-xs text-slate-500 mt-0.5", children: ["Send a password reset link to ", _jsx("span", { className: "text-slate-400", children: email })] })] }), _jsxs("button", { type: "submit", className: "btn-secondary shrink-0", children: [_jsx(Key, { size: 13 }), "Reset password"] })] }), _jsxs("div", { className: "flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40", children: [_jsx(ShieldCheck, { size: 14, className: "text-[#2DD4A0] shrink-0 mt-0.5" }), _jsx("p", { className: "text-xs text-slate-400 leading-relaxed", children: "Astute Business Partners is ISO 27001 certified. All data is encrypted in transit and at rest. Authentication is managed by Supabase with row-level security enabled." })] })] })] }));
}
