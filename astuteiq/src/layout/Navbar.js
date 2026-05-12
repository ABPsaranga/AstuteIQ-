import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store';
import { useLogout } from '../features/auth/hooks';
import { LayoutDashboard, Clock, FileSearch, Home, LogOut, Settings, ChevronDown, Shield, Menu, X, } from 'lucide-react';
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
    const [mobileOpen, setMobileOpen] = useState(false);
    const dropRef = useRef(null);
    useEffect(() => {
        function handler(e) {
            if (dropRef.current && !dropRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
        };
    }, []);
    function handleLogout() {
        setOpen(false);
        setMobileOpen(false);
        logout();
        navigate('/login');
    }
    const isAdmin = user?.role === 'admin';
    const initials = (user?.name ?? user?.email ?? 'U')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    const isActive = (path) => location.pathname === path;
    return (_jsx("header", { className: "sticky top-0 z-50 border-b border-white/5", style: {
            background: 'rgba(11,11,20,0.78)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
        }, children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6", children: [_jsxs("div", { className: "h-16 flex items-center justify-between", children: [_jsxs(Link, { to: "/", className: "group flex items-center gap-2 shrink-0", children: [_jsx("div", { className: "w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg transition-transform duration-200 group-hover:scale-105", style: {
                                        background: 'linear-gradient(135deg, #6B2FD9 0%, #A78BFA 100%)',
                                    }, children: "AI" }), _jsxs("div", { className: "leading-tight", children: [_jsxs("p", { className: "text-lg font-bold text-white tracking-tight", style: {
                                                fontFamily: "'DM Serif Display', Georgia, serif",
                                            }, children: ["Astute", _jsx("span", { style: { color: '#A78BFA' }, children: "IQ" })] }), _jsx("p", { className: "text-[10px] uppercase tracking-[0.18em] text-slate-500 -mt-0.5", children: "SOA Compliance" })] })] }), _jsx("nav", { className: "hidden md:flex items-center gap-1", children: NAV_LINKS.map(({ to, label, icon: Icon }) => {
                                const active = isActive(to);
                                return (_jsxs(Link, { to: to, className: `
                    relative flex items-center gap-2 px-4 py-2 rounded-xl
                    text-sm font-medium transition-all duration-200
                    ${active
                                        ? 'text-white'
                                        : 'text-slate-400 hover:text-white'}
                  `, style: {
                                        background: active
                                            ? 'rgba(107,47,217,0.18)'
                                            : 'transparent',
                                        border: active
                                            ? '1px solid rgba(167,139,250,0.18)'
                                            : '1px solid transparent',
                                        boxShadow: active
                                            ? '0 0 24px rgba(107,47,217,0.18)'
                                            : 'none',
                                    }, children: [_jsx(Icon, { size: 15, className: active ? 'text-[#A78BFA]' : '' }), label, active && (_jsx("div", { className: "absolute inset-x-3 -bottom-px h-px rounded-full", style: {
                                                background: 'linear-gradient(90deg, transparent, #A78BFA, transparent)',
                                            } }))] }, to));
                            }) }), _jsxs("div", { className: "flex items-center gap-3", children: [isAdmin && (_jsxs("div", { className: "hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border", style: {
                                        background: 'rgba(45,212,160,0.08)',
                                        color: '#2DD4A0',
                                        borderColor: 'rgba(45,212,160,0.16)',
                                    }, children: [_jsx(Shield, { size: 11 }), "Admin"] })), _jsx("button", { onClick: () => setMobileOpen((v) => !v), className: "md:hidden w-10 h-10 rounded-xl border border-slate-800 bg-[#11111b] flex items-center justify-center text-slate-300", children: mobileOpen ? _jsx(X, { size: 18 }) : _jsx(Menu, { size: 18 }) }), user ? (_jsxs("div", { className: "relative hidden md:block", ref: dropRef, children: [_jsxs("button", { onClick: () => setOpen((v) => !v), className: "\r\n                    flex items-center gap-2\r\n                    pl-2 pr-3 py-1.5 rounded-2xl\r\n                    border border-slate-800\r\n                    bg-[#11111b]\r\n                    hover:border-slate-700\r\n                    hover:bg-slate-800/50\r\n                    transition-all duration-200\r\n                  ", children: [_jsx("div", { className: "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-lg", style: {
                                                        background: isAdmin
                                                            ? 'linear-gradient(135deg, #1f6b54, #2DD4A0)'
                                                            : 'linear-gradient(135deg, #4a1f99, #6B2FD9)',
                                                    }, children: initials }), _jsxs("div", { className: "text-left hidden lg:block", children: [_jsx("p", { className: "text-xs font-semibold text-white leading-tight", children: user.name ?? 'User' }), _jsx("p", { className: "text-[11px] text-slate-500 leading-tight", children: isAdmin ? 'Administrator' : 'Paraplanner' })] }), _jsx(ChevronDown, { size: 14, className: `text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}` })] }), open && (_jsxs("div", { className: "\r\n                      absolute right-0 mt-3 w-64\r\n                      rounded-3xl overflow-hidden\r\n                      border border-slate-800\r\n                      shadow-2xl\r\n                      animate-in fade-in zoom-in-95 duration-150\r\n                    ", style: {
                                                background: '#11111b',
                                            }, children: [_jsx("div", { className: "p-5 border-b border-slate-800", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white", style: {
                                                                    background: isAdmin
                                                                        ? 'linear-gradient(135deg, #1f6b54, #2DD4A0)'
                                                                        : 'linear-gradient(135deg, #4a1f99, #6B2FD9)',
                                                                }, children: initials }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-sm font-semibold text-white truncate", children: user.name ?? 'User' }), _jsx("p", { className: "text-xs text-slate-500 truncate mt-0.5", children: user.email })] })] }) }), _jsxs("div", { className: "p-2", children: [_jsxs(Link, { to: "/dashboard", onClick: () => setOpen(false), className: "\r\n                          flex items-center gap-3\r\n                          px-3 py-2.5 rounded-xl\r\n                          text-sm text-slate-300\r\n                          hover:text-white\r\n                          hover:bg-slate-800/60\r\n                          transition-colors\r\n                        ", children: [_jsx(LayoutDashboard, { size: 15 }), "Dashboard"] }), _jsxs(Link, { to: "/settings", onClick: () => setOpen(false), className: "\r\n                          flex items-center gap-3\r\n                          px-3 py-2.5 rounded-xl\r\n                          text-sm text-slate-300\r\n                          hover:text-white\r\n                          hover:bg-slate-800/60\r\n                          transition-colors\r\n                        ", children: [_jsx(Settings, { size: 15 }), "Settings"] })] }), _jsx("div", { className: "p-2 border-t border-slate-800", children: _jsxs("button", { onClick: handleLogout, className: "\r\n                          flex items-center gap-3\r\n                          w-full px-3 py-2.5 rounded-xl\r\n                          text-sm text-[#FF6B6B]\r\n                          hover:bg-[#FF6B6B]/10\r\n                          transition-colors\r\n                        ", children: [_jsx(LogOut, { size: 15 }), "Sign out"] }) })] }))] })) : (_jsx(Link, { to: "/login", className: "\r\n                  hidden md:inline-flex\r\n                  items-center justify-center\r\n                  px-5 py-2.5 rounded-xl\r\n                  text-sm font-semibold text-white\r\n                  transition-all duration-200\r\n                  hover:scale-[1.02]\r\n                ", style: {
                                        background: 'linear-gradient(135deg, #6B2FD9 0%, #8B5CF6 100%)',
                                        boxShadow: '0 0 28px rgba(107,47,217,0.28)',
                                    }, children: "Sign in" }))] })] }), mobileOpen && (_jsx("div", { className: "md:hidden pb-4 animate-in fade-in slide-in-from-top-2 duration-200", children: _jsxs("div", { className: "rounded-3xl border border-slate-800 bg-[#11111b] overflow-hidden", children: [_jsx("div", { className: "p-2", children: NAV_LINKS.map(({ to, label, icon: Icon }) => {
                                    const active = isActive(to);
                                    return (_jsxs(Link, { to: to, onClick: () => setMobileOpen(false), className: `
                        flex items-center gap-3
                        px-4 py-3 rounded-2xl
                        text-sm transition-colors
                        ${active
                                            ? 'text-white bg-[#6B2FD9]/20'
                                            : 'text-slate-400'}
                      `, children: [_jsx(Icon, { size: 16, className: active ? 'text-[#A78BFA]' : '' }), label] }, to));
                                }) }), user && (_jsx(_Fragment, { children: _jsxs("div", { className: "border-t border-slate-800 p-2", children: [_jsxs(Link, { to: "/settings", onClick: () => setMobileOpen(false), className: "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-slate-300", children: [_jsx(Settings, { size: 16 }), "Settings"] }), _jsxs("button", { onClick: handleLogout, className: "flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm text-[#FF6B6B]", children: [_jsx(LogOut, { size: 16 }), "Sign out"] })] }) })), !user && (_jsx("div", { className: "p-4 border-t border-slate-800", children: _jsx(Link, { to: "/login", onClick: () => setMobileOpen(false), className: "\r\n                      flex items-center justify-center\r\n                      w-full py-3 rounded-2xl\r\n                      text-sm font-semibold text-white\r\n                    ", style: {
                                        background: 'linear-gradient(135deg, #6B2FD9 0%, #8B5CF6 100%)',
                                    }, children: "Sign in" }) }))] }) }))] }) }));
}
