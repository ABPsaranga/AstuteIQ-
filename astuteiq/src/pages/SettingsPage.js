import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useAuthStore } from '../features/auth/store';
import supabase from '../lib/supabase';
import { User, Bell, Shield, Key, ShieldCheck, } from 'lucide-react';
import toast from 'react-hot-toast';
function Toggle({ value, onChange, disabled = false, }) {
    return (_jsx("button", { type: "button", disabled: disabled, onClick: () => onChange(!value), className: `relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0 disabled:opacity-50 ${value ? 'bg-[#6B2FD9]' : 'bg-slate-700'}`, children: _jsx("span", { className: `absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0.5'}` }) }));
}
export default function SettingsPage() {
    const user = useAuthStore((s) => s.user);
    const setAuth = useAuthStore((s) => s.setAuth);
    const token = useAuthStore((s) => s.token);
    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPrefs, setSavingPrefs] = useState(false);
    // Preferences
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [autoExport, setAutoExport] = useState(false);
    const [weeklyDigest, setWeeklyDigest] = useState(true);
    const isAdmin = user?.role === 'admin';
    const roleLabel = isAdmin ? 'Admin' : 'Paraplanner';
    const roleColor = isAdmin ? '#2DD4A0' : '#A78BFA';
    const roleBg = isAdmin
        ? 'rgba(45,212,160,0.1)'
        : 'rgba(107,47,217,0.1)';
    const roleBorder = isAdmin
        ? 'rgba(45,212,160,0.25)'
        : 'rgba(107,47,217,0.25)';
    // Load preferences from Supabase metadata
    useEffect(() => {
        async function loadPreferences() {
            const { data: { user: currentUser }, } = await supabase.auth.getUser();
            const prefs = currentUser?.user_metadata?.preferences;
            if (prefs) {
                setEmailAlerts(prefs.emailAlerts ?? true);
                setAutoExport(prefs.autoExport ?? false);
                setWeeklyDigest(prefs.weeklyDigest ?? true);
            }
        }
        loadPreferences();
    }, []);
    async function handleSaveProfile(e) {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Name is required.');
            return;
        }
        setSavingProfile(true);
        try {
            // Update user metadata
            const { data, error } = await supabase.auth.updateUser({
                email,
                data: {
                    name,
                },
            });
            if (error)
                throw error;
            // Update Zustand auth store
            if (data.user) {
                setAuth({
                    id: data.user.id,
                    email: data.user.email ?? '',
                    name: data.user.user_metadata?.name ?? name,
                    role: data.user.user_metadata?.role ?? 'user',
                }, token);
            }
            toast.success('Profile updated.');
        }
        catch (err) {
            toast.error(err.message ?? 'Failed to update profile.');
        }
        finally {
            setSavingProfile(false);
        }
    }
    async function handleChangePassword(e) {
        e.preventDefault();
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error)
                throw error;
            toast.success('Password reset link sent.');
        }
        catch (err) {
            toast.error(err.message ?? 'Failed to send reset link.');
        }
    }
    async function savePreferences(updatedPrefs) {
        try {
            setSavingPrefs(true);
            const currentPrefs = {
                emailAlerts,
                autoExport,
                weeklyDigest,
            };
            const merged = {
                ...currentPrefs,
                ...updatedPrefs,
            };
            const { data, error } = await supabase.auth.updateUser({
                data: {
                    preferences: merged,
                },
            });
            if (error)
                throw error;
            // Sync local state
            setEmailAlerts(merged.emailAlerts);
            setAutoExport(merged.autoExport);
            setWeeklyDigest(merged.weeklyDigest);
            // Sync auth store
            if (data.user) {
                setAuth({
                    id: data.user.id,
                    email: data.user.email ?? '',
                    name: data.user.user_metadata?.name ??
                        user?.name ??
                        '',
                    role: data.user.user_metadata?.role ??
                        user?.role ??
                        'user',
                }, token);
            }
            toast.success('Preference saved.');
        }
        catch (err) {
            toast.error(err.message ?? 'Failed to save preference.');
        }
        finally {
            setSavingPrefs(false);
        }
    }
    return (_jsxs("div", { className: "space-y-6 animate-fade-in max-w-2xl", children: [_jsxs("div", { children: [_jsx("h1", { className: "page-header", children: "Settings" }), _jsx("p", { className: "page-sub", children: "Manage your account and preferences." })] }), _jsxs("div", { className: "card space-y-5", children: [_jsxs("div", { className: "flex items-center gap-2 pb-3 border-b border-slate-800", children: [_jsx(User, { size: 14, className: "text-[#A78BFA]" }), _jsx("h2", { className: "text-sm font-semibold text-white", children: "Profile" })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0", style: {
                                    background: isAdmin
                                        ? 'linear-gradient(135deg, #1a4a3a, #2DD4A0)'
                                        : 'linear-gradient(135deg, #4a1f99, #6B2FD9)',
                                }, children: (name || email || 'U')
                                    .charAt(0)
                                    .toUpperCase() }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-white", children: name || email || 'User' }), _jsxs("div", { className: "mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border", style: {
                                            color: roleColor,
                                            background: roleBg,
                                            borderColor: roleBorder,
                                        }, children: [isAdmin ? (_jsx(ShieldCheck, { size: 11 })) : (_jsx(User, { size: 11 })), roleLabel] })] })] }), _jsxs("form", { onSubmit: handleSaveProfile, className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Full name" }), _jsx("input", { className: "input", placeholder: "Sarah Johnson", value: name, onChange: (e) => setName(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Email" }), _jsx("input", { type: "email", className: "input", value: email, onChange: (e) => setEmail(e.target.value) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Role" }), _jsxs("div", { className: "w-full px-3 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 cursor-not-allowed", style: {
                                            background: roleBg,
                                            borderColor: roleBorder,
                                            color: roleColor,
                                        }, children: [isAdmin ? (_jsx(ShieldCheck, { size: 14 })) : (_jsx(User, { size: 14 })), roleLabel, _jsx("span", { className: "ml-auto text-xs opacity-50 font-normal", children: "read-only" })] })] }), _jsx("div", { className: "flex justify-end", children: _jsx("button", { type: "submit", disabled: savingProfile, className: "btn-primary", children: savingProfile ? (_jsx("span", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" })) : ('Save profile') }) })] })] }), _jsxs("div", { className: "card space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 pb-3 border-b border-slate-800", children: [_jsx(Bell, { size: 14, className: "text-[#A78BFA]" }), _jsx("h2", { className: "text-sm font-semibold text-white", children: "Notifications" })] }), [
                        {
                            label: 'Email alerts on review completion',
                            desc: 'Receive an email each time a review finishes processing.',
                            value: emailAlerts,
                            action: (v) => savePreferences({
                                emailAlerts: v,
                            }),
                        },
                        {
                            label: 'Weekly digest',
                            desc: 'Summary of all reviews run in the past 7 days.',
                            value: weeklyDigest,
                            action: (v) => savePreferences({
                                weeklyDigest: v,
                            }),
                        },
                        {
                            label: 'Auto-export Word report on completion',
                            desc: 'Automatically download the Word report when a review finishes.',
                            value: autoExport,
                            action: (v) => savePreferences({
                                autoExport: v,
                            }),
                        },
                    ].map(({ label, desc, value, action }) => (_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-200", children: label }), _jsx("p", { className: "text-xs text-slate-500 mt-0.5", children: desc })] }), _jsx(Toggle, { value: value, disabled: savingPrefs, onChange: action })] }, label)))] }), _jsxs("div", { className: "card space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 pb-3 border-b border-slate-800", children: [_jsx(Shield, { size: 14, className: "text-[#A78BFA]" }), _jsx("h2", { className: "text-sm font-semibold text-white", children: "Security" })] }), _jsxs("form", { onSubmit: handleChangePassword, className: "flex items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-200", children: "Password" }), _jsxs("p", { className: "text-xs text-slate-500 mt-0.5", children: ["Send a password reset link to", ' ', _jsx("span", { className: "text-slate-400", children: email })] })] }), _jsxs("button", { type: "submit", className: "btn-secondary shrink-0", children: [_jsx(Key, { size: 13 }), "Reset password"] })] }), _jsxs("div", { className: "flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40", children: [_jsx(ShieldCheck, { size: 14, className: "text-[#2DD4A0] shrink-0 mt-0.5" }), _jsx("p", { className: "text-xs text-slate-400 leading-relaxed", children: "Astute Business Partners is ISO 27001 certified. All data is encrypted in transit and at rest. Authentication is managed by Supabase with row-level security enabled." })] })] })] }));
}
