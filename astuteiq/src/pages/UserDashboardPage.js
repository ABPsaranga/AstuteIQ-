import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FileSearch, PlayCircle, Clock, TrendingUp, ArrowRight, CheckCircle, XCircle, AlertTriangle, } from 'lucide-react';
import { useAuthStore } from '../features/auth/store';
import { useReviewHistory } from '../features/reviews/hooks';
import { useReviewStore } from '../store/liveReviewStore';
import ActivityChart from '../components/ActivityChart';
import { format, isThisWeek } from 'date-fns';
function StatCard({ label, value, icon: Icon, variant = 'default', pulse }) {
    const colors = {
        default: { icon: 'text-[#A78BFA]', bg: 'bg-[#6B2FD9]/10', border: 'border-slate-800' },
        success: { icon: 'text-[#2DD4A0]', bg: 'bg-[#2DD4A0]/10', border: 'border-[#2DD4A0]/20' },
        warning: { icon: 'text-[#E8B84B]', bg: 'bg-[#E8B84B]/10', border: 'border-[#E8B84B]/20' },
        error: { icon: 'text-[#FF6B6B]', bg: 'bg-[#FF6B6B]/10', border: 'border-[#FF6B6B]/20' },
    }[variant];
    return (_jsxs("div", { className: `relative rounded-2xl border ${colors.border} bg-[#0f0f1a] p-5 overflow-hidden`, children: [pulse && (_jsxs("span", { className: "absolute top-3 right-3 flex h-2 w-2", children: [_jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2DD4A0] opacity-75" }), _jsx("span", { className: "relative inline-flex rounded-full h-2 w-2 bg-[#2DD4A0]" })] })), _jsx("div", { className: `inline-flex p-2 rounded-xl ${colors.bg} mb-3`, children: _jsx(Icon, { size: 16, className: colors.icon }) }), _jsx("p", { className: "text-2xl font-bold text-white font-mono", children: value }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: label })] }));
}
// ── Score badge ───────────────────────────────────────────────────────────────
function ScoreBadge({ score }) {
    const color = score >= 80 ? 'text-[#2DD4A0]' : score >= 60 ? 'text-[#FFB347]' : 'text-[#FF6B6B]';
    return _jsxs("span", { className: `text-sm font-bold font-mono ${color}`, children: [score, "%"] });
}
// ── Status icon ───────────────────────────────────────────────────────────────
function StatusIcon({ status }) {
    if (status === 'complete')
        return _jsx(CheckCircle, { size: 14, className: "text-[#2DD4A0] shrink-0" });
    if (status === 'failed')
        return _jsx(XCircle, { size: 14, className: "text-[#FF6B6B] shrink-0" });
    if (status === 'processing')
        return _jsx(AlertTriangle, { size: 14, className: "text-[#FFB347] shrink-0 animate-pulse" });
    return null;
}
// ── Processing banner ─────────────────────────────────────────────────────────
function ProcessingBanner() {
    return (_jsxs("div", { className: "flex items-center gap-3 p-4 rounded-xl border border-[#6B2FD9]/30 bg-[#6B2FD9]/10 animate-fade-in", children: [_jsx("div", { className: "w-4 h-4 border-2 border-[#6B2FD9] border-t-transparent rounded-full animate-spin shrink-0" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-white", children: "Review in progress" }), _jsx("p", { className: "text-xs text-slate-400", children: "Results will appear here automatically when complete." })] }), _jsx(Link, { to: "/soa-analysis", className: "ml-auto text-xs text-[#A78BFA] hover:text-white transition-colors shrink-0", children: "View \u2192" })] }));
}
// ── Main page ─────────────────────────────────────────────────────────────────
export default function UserDashboardPage() {
    const user = useAuthStore((s) => s.user);
    // Backend history (paginated)
    const { data, loading, fetch } = useReviewHistory();
    // Live store — reviews pushed here instantly when SOA analysis completes
    const { reviews: liveReviews, processing, lastUpdated } = useReviewStore();
    const firstName = (user?.name ?? user?.email ?? 'there').split(' ')[0];
    // Fetch backend history on mount and whenever live store updates
    useEffect(() => {
        fetch(1, 100);
    }, [fetch, lastUpdated]); // lastUpdated triggers re-fetch after each live review
    // Merge live reviews with backend history, deduplicate by id
    const allReviews = useMemo(() => {
        const backendReviews = (data?.reviews ?? []).map((r) => ({
            id: r.id,
            fileName: r.fileName,
            fileSize: r.fileSize,
            mode: r.mode,
            status: r.status,
            score: r.score,
            findings: r.findings ?? [],
            overrides: r.overrides ?? [],
            createdAt: r.createdAt,
            completedAt: r.completedAt ?? r.createdAt,
        }));
        // Live reviews override backend (more up to date)
        const merged = new Map();
        backendReviews.forEach((r) => merged.set(r.id, r));
        liveReviews.forEach((r) => merged.set(r.id, r));
        return Array.from(merged.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [data?.reviews, liveReviews, lastUpdated]);
    const recent = allReviews.slice(0, 5);
    // ── Derived stats ────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const completed = allReviews.filter((r) => r.status === 'complete');
        const avgScore = completed.length
            ? Math.round(completed.reduce((sum, r) => sum + (r.score ?? 0), 0) / completed.length)
            : null;
        const thisWeek = allReviews.filter((r) => {
            try {
                return isThisWeek(new Date(r.createdAt));
            }
            catch {
                return false;
            }
        }).length;
        const overrides = allReviews.reduce((sum, r) => sum + (r.overrides?.length ?? 0), 0);
        return { avgScore, thisWeek, overrides, total: allReviews.length };
    }, [allReviews]);
    return (_jsxs("div", { className: "space-y-6 animate-fade-in p-6 max-w-6xl", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-white", style: { fontFamily: "'DM Serif Display', Georgia, serif" }, children: ["Welcome back, ", firstName, " \uD83D\uDC4B"] }), _jsx("p", { className: "text-slate-400 text-sm mt-1", children: "Here's your review activity at a glance." })] }), _jsxs(Link, { to: "/soa-analysis", className: "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all", style: { background: '#6B2FD9' }, children: [_jsx(PlayCircle, { size: 14 }), "New review"] })] }), processing && _jsx(ProcessingBanner, {}), _jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsx(StatCard, { label: "Total reviews", value: loading && !allReviews.length ? '…' : stats.total, icon: FileSearch, pulse: processing }), _jsx(StatCard, { label: "Avg score", value: loading && !allReviews.length ? '…' : stats.avgScore !== null ? `${stats.avgScore}%` : '—', icon: TrendingUp, variant: "success" }), _jsx(StatCard, { label: "This week", value: loading && !allReviews.length ? '…' : stats.thisWeek, icon: PlayCircle }), _jsx(StatCard, { label: "Overrides submitted", value: loading && !allReviews.length ? '…' : stats.overrides, icon: Clock, variant: "warning" })] }), _jsxs("div", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-sm font-semibold text-white", children: "Activity \u2014 last 14 days" }), _jsxs("div", { className: "flex items-center gap-4 text-xs text-slate-500", children: [_jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-[#6B2FD9]" }), "Reviews"] }), _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-[#2DD4A0]" }), "Avg score"] })] })] }), _jsx(ActivityChart, { height: 180 })] }), _jsxs("div", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h2", { className: "text-sm font-semibold text-white", children: "Recent reviews" }), processing && (_jsx("span", { className: "text-xs px-2 py-0.5 rounded-full bg-[#6B2FD9]/20 text-[#A78BFA] border border-[#6B2FD9]/30", children: "Live" }))] }), _jsxs(Link, { to: "/history", className: "text-xs text-[#A78BFA] hover:text-white transition-colors flex items-center gap-1", children: ["View all ", _jsx(ArrowRight, { size: 12 })] })] }), loading && !allReviews.length ? (_jsx("div", { className: "space-y-3", children: [...Array(4)].map((_, i) => (_jsx("div", { className: "skeleton h-14 rounded-xl" }, i))) })) : recent.length === 0 ? (_jsxs("div", { className: "text-center py-12 space-y-3", children: [_jsx("div", { className: "w-12 h-12 rounded-2xl bg-[#6B2FD9]/10 flex items-center justify-center mx-auto", children: _jsx(FileSearch, { size: 20, className: "text-[#A78BFA]" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-slate-300", children: "No reviews yet" }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Upload a Statement of Advice to get started." })] }), _jsx(Link, { to: "/soa-analysis", className: "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white", style: { background: '#6B2FD9' }, children: "Run your first review" })] })) : (_jsx("ul", { className: "divide-y divide-slate-800/60", children: recent.map((r) => (_jsxs("li", { className: `py-3.5 flex items-center gap-4 ${r.status === 'processing' ? 'opacity-70' : ''}`, children: [_jsx(StatusIcon, { status: r.status }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm text-slate-200 truncate font-medium", children: r.fileName || 'SOA Document' }), _jsxs("p", { className: "text-xs text-slate-500 mt-0.5 flex items-center gap-2", children: [_jsx("span", { children: format(new Date(r.createdAt), 'dd MMM yyyy, h:mm a') }), _jsx("span", { className: "w-1 h-1 rounded-full bg-slate-700" }), _jsxs("span", { className: "capitalize", children: [r.mode, " review"] }), r.status === 'processing' && (_jsxs(_Fragment, { children: [_jsx("span", { className: "w-1 h-1 rounded-full bg-slate-700" }), _jsx("span", { className: "text-[#FFB347] animate-pulse", children: "Processing\u2026" })] }))] })] }), _jsxs("div", { className: "flex items-center gap-3 shrink-0", children: [r.status === 'complete' && _jsx(ScoreBadge, { score: r.score }), r.status === 'processing' && (_jsx("div", { className: "w-4 h-4 border-2 border-[#FFB347] border-t-transparent rounded-full animate-spin" })), _jsx(Link, { to: `/review/${r.id}`, className: "text-xs text-[#A78BFA] hover:text-white transition-colors", children: "View \u2192" })] })] }, r.id))) }))] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsxs(Link, { to: "/soa-analysis", className: "flex items-center gap-4 p-5 rounded-2xl border border-slate-800 bg-[#0f0f1a] hover:border-[#6B2FD9]/40 hover:bg-[#6B2FD9]/5 transition-all", children: [_jsx("div", { className: "p-3 rounded-xl bg-[#6B2FD9]/10", children: _jsx(PlayCircle, { size: 20, className: "text-[#A78BFA]" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-white", children: "Run a review" }), _jsx("p", { className: "text-xs text-slate-400 mt-0.5", children: "Upload a PDF or DOCX for AI compliance review" })] }), _jsx(ArrowRight, { size: 16, className: "text-slate-600 ml-auto" })] }), _jsxs(Link, { to: "/history", className: "flex items-center gap-4 p-5 rounded-2xl border border-slate-800 bg-[#0f0f1a] hover:border-slate-700 hover:bg-slate-800/20 transition-all", children: [_jsx("div", { className: "p-3 rounded-xl bg-slate-800/60", children: _jsx(Clock, { size: 20, className: "text-slate-400" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-white", children: "Review history" }), _jsx("p", { className: "text-xs text-slate-400 mt-0.5", children: "Browse all past reviews and findings" })] }), _jsx(ArrowRight, { size: 16, className: "text-slate-600 ml-auto" })] })] })] }));
}
