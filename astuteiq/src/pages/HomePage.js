import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileSearch, ShieldCheck, Zap, ArrowRight, CheckCircle, TrendingUp, Sparkles, Activity, Globe, ChevronRight, } from 'lucide-react';
const STATS = [
    { value: 'Live', label: 'AI-powered SOA analysis' },
    { value: 'RG175', label: 'Compliance review coverage' },
    { value: 'P1–P10', label: 'Personalisation checks' },
    { value: 'C1–C29', label: 'Compliance controls' },
];
const CHECKS = [
    'ASIC RG175 compliance review',
    'Best interests duty (s961B)',
    'Fee disclosure validation',
    'Risk profile alignment',
    'Client goals linkage',
    'Better position analysis',
    'Replacement product comparison',
    'Template language detection',
];
const FEATURES = [
    {
        icon: Zap,
        title: 'Quick Check',
        time: 'Fast',
        desc: 'Focused review highlighting FAIL and WARNING items for rapid paraplanner triage.',
        color: '#A78BFA',
        bg: 'bg-[#6B2FD9]/10 border-[#6B2FD9]/30',
    },
    {
        icon: FileSearch,
        title: 'Full Review',
        time: 'Comprehensive',
        desc: 'Complete SOA analysis covering consistency, structure, personalisation and compliance.',
        color: '#2DD4A0',
        bg: 'bg-[#2DD4A0]/10 border-[#2DD4A0]/30',
    },
    {
        icon: ShieldCheck,
        title: 'Override & Export',
        time: 'Workflow Ready',
        desc: 'Review findings, apply overrides, add comments and export final reports.',
        color: '#E8B84B',
        bg: 'bg-[#E8B84B]/10 border-[#E8B84B]/30',
    },
];
function NewsletterForm() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle');
    const [loading, setLoading] = useState(false);
    async function handleSubmit(e) {
        e.preventDefault();
        if (!email.trim())
            return;
        setLoading(true);
        try {
            await new Promise((res) => setTimeout(res, 900));
            setStatus('sent');
            setEmail('');
        }
        catch {
            setStatus('error');
        }
        finally {
            setLoading(false);
        }
    }
    if (status === 'sent') {
        return (_jsxs("div", { className: "inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#2DD4A0]/10 border border-[#2DD4A0]/30 text-[#2DD4A0] text-sm font-medium shadow-lg shadow-[#2DD4A0]/10", children: [_jsx(CheckCircle, { size: 16 }), "You're on the list \u2014 we'll be in touch."] }));
    }
    return (_jsxs("form", { onSubmit: handleSubmit, className: "flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mt-2", children: [_jsx("input", { type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), placeholder: "your@email.com.au", className: "flex-1 px-5 py-3 rounded-2xl bg-[#0B0B14] border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#6B2FD9] focus:ring-2 focus:ring-[#6B2FD9]/30 transition-all" }), _jsx("button", { type: "submit", disabled: loading, className: "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-60 hover:scale-[1.02]", style: {
                    background: 'linear-gradient(135deg, #6B2FD9 0%, #8B5CF6 100%)',
                    boxShadow: '0 0 30px rgba(107,47,217,0.35)',
                }, children: loading ? (_jsx("span", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" })) : (_jsxs(_Fragment, { children: ["Keep me updated", _jsx(ArrowRight, { size: 14 })] })) }), status === 'error' && (_jsx("p", { className: "text-xs text-[#FF6B6B] text-center w-full mt-1", children: "Something went wrong \u2014 try again." }))] }));
}
export default function HomePage() {
    return (_jsxs("div", { className: "min-h-screen overflow-hidden relative", style: { background: '#0B0B14' }, children: [_jsx("div", { className: "pointer-events-none fixed inset-0 opacity-[0.025]", style: {
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    backgroundSize: '128px',
                } }), _jsxs("div", { className: "pointer-events-none fixed inset-0 overflow-hidden", children: [_jsx("div", { className: "absolute -top-52 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-20 blur-3xl", style: {
                            background: 'radial-gradient(circle, rgba(107,47,217,0.6) 0%, transparent 70%)',
                        } }), _jsx("div", { className: "absolute top-1/3 -left-44 w-[420px] h-[420px] rounded-full opacity-10 blur-3xl", style: {
                            background: 'radial-gradient(circle, rgba(45,212,160,0.5) 0%, transparent 70%)',
                        } }), _jsx("div", { className: "absolute bottom-0 right-0 w-[520px] h-[320px] rounded-full opacity-10 blur-3xl", style: {
                            background: 'radial-gradient(circle, rgba(139,92,246,0.45) 0%, transparent 70%)',
                        } })] }), _jsxs("div", { className: "relative z-10 max-w-7xl mx-auto px-6 py-16 space-y-32", children: [_jsxs("section", { className: "relative flex flex-col items-center text-center gap-10 pt-12", children: [_jsxs("div", { className: "inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#6B2FD9]/40 bg-[#6B2FD9]/10 text-xs font-semibold text-[#C4B5FD] uppercase tracking-[0.2em]", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-[#2DD4A0] animate-pulse" }), "AI-powered compliance workflow"] }), _jsxs("div", { className: "space-y-6 max-w-5xl", children: [_jsxs("h1", { className: "text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight text-white", style: { fontFamily: "'DM Serif Display', Georgia, serif" }, children: ["Review SOAs with", _jsx("br", {}), _jsx("span", { className: "bg-gradient-to-r from-[#A78BFA] to-[#E9D5FF] bg-clip-text text-transparent", children: "confidence & speed." })] }), _jsx("p", { className: "text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed", children: "AstuteIQ helps financial planning teams analyse Statements of Advice against RG175, s961B obligations and structured compliance controls \u2014 with real-time AI review workflows." })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 items-center", children: [_jsxs(Link, { to: "/soa-analysis", className: "group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-sm text-white transition-all duration-200 hover:scale-[1.02]", style: {
                                            background: 'linear-gradient(135deg, #6B2FD9 0%, #8B5CF6 100%)',
                                            boxShadow: '0 0 35px rgba(107,47,217,0.45)',
                                        }, children: ["Run your first review", _jsx(ArrowRight, { size: 15, className: "group-hover:translate-x-1 transition-transform" })] }), _jsx(Link, { to: "/dashboard", className: "inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-medium text-sm text-slate-300 border border-slate-700 hover:border-slate-500 hover:text-white hover:bg-slate-800/50 transition-all", children: "Open dashboard" })] }), _jsx("div", { className: "flex flex-wrap justify-center gap-3 pt-2", children: [
                                    'Live AI reviews',
                                    'Word exports',
                                    'Override workflows',
                                    'Streaming analysis',
                                ].map((item) => (_jsx("div", { className: "px-4 py-2 rounded-xl border border-slate-800 bg-[#0f0f1a]/80 text-xs text-slate-400", children: item }, item))) }), _jsx("div", { className: "w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-px rounded-3xl overflow-hidden border border-slate-800/60 mt-2 shadow-2xl", style: { background: 'rgba(255,255,255,0.03)' }, children: STATS.map(({ value, label }) => (_jsxs("div", { className: "flex flex-col items-center py-7 px-5 bg-[#0f0f1a]/80 backdrop-blur-sm", children: [_jsx("p", { className: "text-2xl md:text-3xl font-bold", style: {
                                                fontFamily: "'DM Mono', monospace",
                                                color: '#A78BFA',
                                            }, children: value }), _jsx("p", { className: "text-xs text-slate-500 mt-1 text-center", children: label })] }, label))) })] }), _jsxs("section", { className: "space-y-10", children: [_jsxs("div", { className: "text-center space-y-3", children: [_jsxs("div", { className: "inline-flex items-center gap-2 text-[#A78BFA] text-sm font-semibold", children: [_jsx(Sparkles, { size: 15 }), "Review Modes"] }), _jsx("h2", { className: "text-4xl font-bold text-white", style: { fontFamily: "'DM Serif Display', Georgia, serif" }, children: "Two modes. One seamless workflow." }), _jsx("p", { className: "text-slate-400 text-sm max-w-2xl mx-auto", children: "Choose rapid triage or deep compliance analysis depending on your review stage." })] }), _jsx("div", { className: "grid md:grid-cols-3 gap-5", children: FEATURES.map(({ icon: Icon, title, time, desc, color, bg }) => (_jsxs("div", { className: `group relative overflow-hidden flex flex-col gap-5 p-7 rounded-3xl border ${bg} hover:-translate-y-1 transition-all duration-300`, children: [_jsx("div", { className: "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity", style: {
                                                background: 'linear-gradient(180deg, rgba(255,255,255,0.02), transparent)',
                                            } }), _jsxs("div", { className: "flex items-start justify-between relative z-10", children: [_jsx("div", { className: "p-3 rounded-2xl", style: { background: `${color}20` }, children: _jsx(Icon, { size: 22, style: { color } }) }), _jsx("span", { className: "text-xs font-mono px-3 py-1 rounded-full border", style: {
                                                        color,
                                                        borderColor: `${color}40`,
                                                        background: `${color}10`,
                                                    }, children: time })] }), _jsxs("div", { className: "relative z-10", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-3", children: title }), _jsx("p", { className: "text-sm text-slate-400 leading-relaxed", children: desc })] }), _jsxs("div", { className: "relative z-10 flex items-center gap-2 text-sm font-medium text-white/80 pt-2", children: ["Learn more", _jsx(ChevronRight, { size: 15 })] })] }, title))) })] }), _jsxs("section", { className: "grid lg:grid-cols-2 gap-16 items-center", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "inline-flex items-center gap-2 text-[#2DD4A0] text-sm font-semibold", children: [_jsx(ShieldCheck, { size: 15 }), "Compliance Coverage"] }), _jsxs("h2", { className: "text-4xl font-bold text-white leading-tight", style: { fontFamily: "'DM Serif Display', Georgia, serif" }, children: ["39+ structured", _jsx("br", {}), "compliance checks."] }), _jsx("p", { className: "text-slate-400 leading-relaxed text-base", children: "AstuteIQ maps every SOA against structured review frameworks used by modern paraplanning teams across Australia and New Zealand." }), _jsx("div", { className: "grid gap-3", children: CHECKS.map((c) => (_jsxs("div", { className: "flex items-center gap-3 text-sm text-slate-300 rounded-xl border border-slate-800 bg-[#10101a] px-4 py-3", children: [_jsx(CheckCircle, { size: 16, style: { color: '#2DD4A0', flexShrink: 0 } }), c] }, c))) }), _jsx("p", { className: "text-xs text-slate-600 pt-2 border-t border-slate-800", children: "Cannot verify WealthSolver modelling, APIR codes, Xtools+ projections, or external platform calculations." })] }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-0 rounded-[32px] opacity-30 blur-3xl", style: {
                                            background: 'radial-gradient(circle, rgba(107,47,217,0.45) 0%, transparent 70%)',
                                        } }), _jsxs("div", { className: "relative rounded-[32px] border border-slate-800 bg-[#0f0f1a]/90 backdrop-blur-xl p-7 space-y-6 shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-base font-semibold text-white", children: "Live Compliance Engine" }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Real-time AI workflow processing" })] }), _jsxs("span", { className: "inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border bg-[#2DD4A0]/10 text-[#2DD4A0] border-[#2DD4A0]/25", children: [_jsx(Activity, { size: 12 }), "ACTIVE"] })] }), _jsx("div", { className: "space-y-3", children: [
                                                    'Consistency validation across uploaded documents',
                                                    'Structure and section completeness analysis',
                                                    'P1–P10 personalisation review',
                                                    'C1–C29 compliance assessment',
                                                    'ATO threshold verification via live web search',
                                                ].map((item) => (_jsxs("div", { className: "flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#12121d] px-4 py-3 hover:border-slate-700 transition-colors", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-[#2DD4A0] animate-pulse" }), _jsx("span", { className: "text-sm text-slate-300", children: item })] }, item))) }), _jsx("div", { className: "grid grid-cols-3 gap-3 pt-2", children: [
                                                    ['Quick', 'Triage review', '#A78BFA'],
                                                    ['Full', 'Deep analysis', '#2DD4A0'],
                                                    ['Export', 'Word reports', '#E8B84B'],
                                                ].map(([title, desc, color]) => (_jsxs("div", { className: "rounded-2xl border border-slate-800 bg-[#12121d] p-4 text-center", children: [_jsx("p", { className: "text-lg font-bold", style: { color }, children: title }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: desc })] }, title))) })] })] })] }), _jsx("section", { className: "grid md:grid-cols-3 gap-5", children: [
                            {
                                icon: TrendingUp,
                                color: '#A78BFA',
                                title: 'Structured compliance workflows',
                                desc: 'Built for Australian financial planning teams reviewing Statements of Advice.',
                            },
                            {
                                icon: ShieldCheck,
                                color: '#2DD4A0',
                                title: 'Multi-area review engine',
                                desc: 'Consistency, structure, personalisation and compliance in one workflow.',
                            },
                            {
                                icon: Globe,
                                color: '#E8B84B',
                                title: 'Live streaming reviews',
                                desc: 'Real-time progress updates while compliance analysis runs.',
                            },
                        ].map(({ icon: Icon, color, title, desc }) => (_jsxs("div", { className: "group relative overflow-hidden flex gap-4 p-7 rounded-3xl border border-slate-800/60 bg-[#0f0f1a]/60 hover:border-slate-700 transition-all", children: [_jsx("div", { className: "p-3 rounded-2xl h-fit shrink-0", style: { background: `${color}15` }, children: _jsx(Icon, { size: 18, style: { color } }) }), _jsxs("div", { children: [_jsx("p", { className: "text-base font-semibold text-white mb-2", children: title }), _jsx("p", { className: "text-sm text-slate-400 leading-relaxed", children: desc })] })] }, title))) }), _jsxs("section", { className: "relative rounded-[36px] overflow-hidden border border-[#6B2FD9]/30 p-10 md:p-14 text-center", style: {
                            background: 'linear-gradient(135deg, rgba(107,47,217,0.18) 0%, rgba(11,11,20,0.9) 65%)',
                        }, children: [_jsx("div", { className: "absolute inset-0 pointer-events-none", style: {
                                    background: 'radial-gradient(circle at top, rgba(139,92,246,0.25) 0%, transparent 60%)',
                                } }), _jsxs("div", { className: "relative space-y-5", children: [_jsxs("div", { className: "inline-flex items-center gap-2 text-[#C4B5FD] text-sm font-semibold", children: [_jsx(Sparkles, { size: 15 }), "Compliance Updates"] }), _jsxs("h2", { className: "text-4xl md:text-5xl font-bold text-white leading-tight", style: { fontFamily: "'DM Serif Display', Georgia, serif" }, children: ["Stay ahead of", _jsx("br", {}), "compliance changes."] }), _jsx("p", { className: "text-slate-400 max-w-2xl mx-auto text-base leading-relaxed", children: "Get feature releases, regulatory insights and SOA quality updates delivered directly to your inbox." }), _jsx(NewsletterForm, {}), _jsx("p", { className: "text-xs text-slate-600 pt-2", children: "Astute Business Partners \u00B7 ISO 27001 certified \u00B7 Internal use only" })] })] })] })] }));
}
