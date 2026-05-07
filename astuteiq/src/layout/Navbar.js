import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store';
import { useLogout } from '../features/auth/hooks';
import { LayoutDashboard, Clock, FileSearch, Home, LogOut, Settings, ChevronDown, Shield, } from 'lucide-react';
const NAV_LINKS = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/soa-analysis', label: 'Run Review', icon: FileSearch },
    { to: '/history', label: 'History', icon: Clock },
];
export default function Navbar() {
    const user = useAuthStore((s) => s.user);
    const { logout } = useLogout();
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const dropRef = useRef(null);
    // Close dropdown on outside click
    useEffect(() => {
        function handler(e) {
            if (dropRef.current && !dropRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);
    function handleLogout() {
        setOpen(false);
        logout();
        navigate('/login');
    }
    const isAdmin = user?.role === 'admin';
    const initials = (user?.name ?? user?.email ?? 'U')
        .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    const isActive = (path) => location.pathname === path;
    return (_jsx("header", { className: "sticky top-0 z-50 border-b border-slate-800/60 px-6", style: {
            background: 'rgba(11,11,20,0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
        }, children: _jsxs("div", { className: "max-w-7xl mx-auto flex items-center justify-between h-14", children: [_jsxs(Link, { to: "/", className: "text-xl font-bold text-white shrink-0 hover:opacity-90 transition-opacity", style: { fontFamily: "'DM Serif Display', Georgia, serif" }, children: ["Astute", _jsx("span", { style: { color: '#A78BFA' }, children: "IQ" })] }), _jsx("nav", { className: "hidden md:flex items-center gap-1", children: NAV_LINKS.map(({ to, label, icon: Icon }) => {
                        const active = isActive(to);
                        return (_jsxs(Link, { to: to, className: `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${active
                                ? 'text-white bg-[#6B2FD9]/20 border border-[#6B2FD9]/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`, children: [_jsx(Icon, { size: 13, className: active ? 'text-[#A78BFA]' : '' }), label] }, to));
                    }) }), _jsxs("div", { className: "flex items-center gap-3", children: [isAdmin && (_jsxs("div", { className: "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#2DD4A0]/25 bg-[#2DD4A0]/10 text-xs font-semibold text-[#2DD4A0]", children: [_jsx(Shield, { size: 11 }), "Admin"] })), user ? (_jsxs("div", { className: "relative", ref: dropRef, children: [_jsxs("button", { onClick: () => setOpen((v) => !v), className: "flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-[#0f0f1a] hover:bg-slate-800/60 transition-all duration-150", children: [_jsx("div", { className: "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0", style: {
                                                background: isAdmin
                                                    ? 'linear-gradient(135deg, #1a4a3a, #2DD4A0)'
                                                    : 'linear-gradient(135deg, #4a1f99, #6B2FD9)',
                                            }, children: initials }), _jsx("span", { className: "text-xs font-medium text-slate-300 max-w-[120px] truncate hidden sm:block", children: user.name ?? user.email }), _jsx(ChevronDown, { size: 12, className: `text-slate-500 transition-transform duration-150 ${open ? 'rotate-180' : ''}` })] }), open && (_jsxs("div", { className: "absolute right-0 mt-2 w-52 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden animate-fade-in", style: { background: '#0f0f1a' }, children: [_jsxs("div", { className: "px-4 py-3 border-b border-slate-800", children: [_jsx("p", { className: "text-xs font-semibold text-white truncate", children: user.name ?? 'User' }), _jsx("p", { className: "text-xs text-slate-500 truncate mt-0.5", children: user.email }), _jsxs("div", { className: "mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", style: {
                                                        background: isAdmin ? 'rgba(45,212,160,0.1)' : 'rgba(107,47,217,0.1)',
                                                        color: isAdmin ? '#2DD4A0' : '#A78BFA',
                                                        border: isAdmin ? '1px solid rgba(45,212,160,0.2)' : '1px solid rgba(107,47,217,0.2)',
                                                    }, children: [isAdmin ? _jsx(Shield, { size: 10 }) : _jsx(FileSearch, { size: 10 }), isAdmin ? 'Admin' : 'Paraplanner'] })] }), _jsxs("div", { className: "p-1.5 space-y-0.5", children: [_jsxs(Link, { to: "/dashboard", onClick: () => setOpen(false), className: "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors", children: [_jsx(LayoutDashboard, { size: 13, className: "text-slate-500" }), "Dashboard"] }), _jsxs(Link, { to: "/settings", onClick: () => setOpen(false), className: "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors", children: [_jsx(Settings, { size: 13, className: "text-slate-500" }), "Settings"] })] }), _jsx("div", { className: "p-1.5 border-t border-slate-800", children: _jsxs("button", { onClick: handleLogout, className: "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors", children: [_jsx(LogOut, { size: 13 }), "Sign out"] }) })] }))] })) : (_jsx(Link, { to: "/login", className: "text-xs font-semibold px-4 py-2 rounded-xl text-white transition-colors", style: { background: '#6B2FD9' }, children: "Sign in" }))] })] }) }));
}
