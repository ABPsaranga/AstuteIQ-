import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { Mail, ShieldCheck, FileSearch, ArrowUpRight, LinkIcon, TimerIcon, } from 'lucide-react';
const FOOTER_LINKS = {
    Product: [
        { label: 'Run Review', to: '/soa-analysis' },
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Review History', to: '/history' },
    ],
    Company: [
        { label: 'Home', to: '/' },
        { label: 'Settings', to: '/settings' },
        { label: 'Support', to: '/support' },
    ],
    Compliance: [
        { label: 'ASIC RG175', to: '#' },
        { label: 'Privacy Policy', to: '#' },
        { label: 'Terms of Use', to: '#' },
    ],
};
export default function Footer() {
    return (_jsxs("footer", { className: "relative mt-auto border-t border-slate-800/70 overflow-hidden", children: [_jsx("div", { className: "absolute inset-0", style: {
                    background: 'linear-gradient(180deg, rgba(15,15,26,0.98) 0%, rgba(11,11,20,1) 100%)',
                } }), _jsx("div", { className: "absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] opacity-20 blur-3xl pointer-events-none", style: {
                    background: 'radial-gradient(circle, rgba(107,47,217,0.5) 0%, transparent 70%)',
                } }), _jsxs("div", { className: "relative z-10 max-w-7xl mx-auto px-6 py-14", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-12 border-b border-slate-800/70", children: [_jsxs("div", { className: "lg:col-span-2 space-y-5", children: [_jsxs("div", { children: [_jsxs(Link, { to: "/", className: "inline-flex items-center text-3xl font-bold text-white", style: { fontFamily: "'DM Serif Display', Georgia, serif" }, children: ["Astute", _jsx("span", { style: { color: '#A78BFA' }, children: "IQ" })] }), _jsx("p", { className: "mt-4 text-sm leading-relaxed text-slate-400 max-w-md", children: "AI-powered SOA compliance review platform built for Australian and New Zealand financial planning practices." })] }), _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#2DD4A0]/20 bg-[#2DD4A0]/10 text-xs font-medium text-[#2DD4A0]", children: [_jsx(ShieldCheck, { size: 14 }), "ASIC RG175 aligned"] }), _jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#6B2FD9]/20 bg-[#6B2FD9]/10 text-xs font-medium text-[#A78BFA]", children: [_jsx(FileSearch, { size: 14 }), "39+ compliance checks"] })] }), _jsx("div", { className: "space-y-2", children: _jsxs("a", { href: "mailto:support@astuteiq.com", className: "inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors", children: [_jsx(Mail, { size: 14 }), "support@astuteiq.com"] }) })] }), Object.entries(FOOTER_LINKS).map(([section, links]) => (_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-white mb-4 tracking-wide", children: section }), _jsx("div", { className: "space-y-3", children: links.map((link) => (_jsxs(Link, { to: link.to, className: "group flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors", children: [_jsx("span", { children: link.label }), _jsx(ArrowUpRight, { size: 13, className: "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" })] }, link.label))) })] }, section)))] }), _jsxs("div", { className: "flex flex-col md:flex-row items-center justify-between gap-5 pt-6", children: [_jsxs("div", { className: "text-xs text-slate-500 text-center md:text-left", children: ["\u00A9 ", new Date().getFullYear(), " AstuteIQ. All rights reserved.", _jsxs("span", { className: "hidden sm:inline", children: [' ', "\u00B7 Built for internal financial planning compliance workflows."] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("a", { href: "#", className: "w-9 h-9 rounded-xl border border-slate-800 bg-[#0f0f1a] flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-700 hover:bg-slate-800/60 transition-all", children: _jsx(LinkIcon, { size: 15 }) }), _jsx("a", { href: "#", className: "w-9 h-9 rounded-xl border border-slate-800 bg-[#0f0f1a] flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-700 hover:bg-slate-800/60 transition-all", children: _jsx(TimerIcon, { size: 15 }) })] })] })] })] }));
}
