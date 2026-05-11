import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Search, ExternalLink, FileSearch, ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertTriangle, Minus, Filter, } from 'lucide-react';
import { useReviewHistory } from '../features/reviews/hooks';
import { useReviewStore } from '../store/liveReviewStore';
import { format, isThisWeek, isToday } from 'date-fns';
function formatBytes(bytes) {
    if (!bytes)
        return '—';
    if (bytes < 1048576)
        return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}
function ScoreBadge({ score }) {
    if (score >= 80)
        return (_jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#2DD4A0]/10 text-[#2DD4A0] border border-[#2DD4A0]/20", children: [_jsx(CheckCircle, { size: 10 }), score, "%"] }));
    if (score >= 60)
        return (_jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#FFB347]/10 text-[#FFB347] border border-[#FFB347]/20", children: [_jsx(AlertTriangle, { size: 10 }), score, "%"] }));
    return (_jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#FF6B6B]/10 text-[#FF6B6B] border border-[#FF6B6B]/20", children: [_jsx(XCircle, { size: 10 }), score, "%"] }));
}
function StatusPill({ status }) {
    if (status === 'processing')
        return (_jsxs("span", { className: "inline-flex items-center gap-1 text-xs text-[#FFB347]", children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-[#FFB347] animate-pulse" }), "Processing"] }));
    if (status === 'failed')
        return (_jsxs("span", { className: "inline-flex items-center gap-1 text-xs text-[#FF6B6B]", children: [_jsx(XCircle, { size: 11 }), "Failed"] }));
    return (_jsxs("span", { className: "inline-flex items-center gap-1 text-xs text-[#2DD4A0]", children: [_jsx(CheckCircle, { size: 11 }), "Complete"] }));
}
function DateLabel({ date }) {
    const d = new Date(date);
    if (isToday(d))
        return _jsx("span", { className: "text-[#A78BFA] font-medium", children: "Today" });
    if (isThisWeek(d))
        return _jsx("span", { className: "text-slate-300", children: format(d, 'EEE, d MMM') });
    return _jsx("span", { children: format(d, 'dd MMM yyyy') });
}
export default function ReviewHistoryPage() {
    const { data, loading, fetch } = useReviewHistory();
    const { reviews: liveReviews, lastUpdated } = useReviewStore();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [modeFilter, setModeFilter] = useState('all');
    const [scoreFilter, setScoreFilter] = useState('all');
    const PAGE_SIZE = 20;
    useEffect(() => {
        fetch(page, PAGE_SIZE);
    }, [fetch, page, lastUpdated]);
    // Merge live reviews with backend, deduplicate
    const allReviews = useMemo(() => {
        const backend = data?.reviews ?? [];
        const merged = new Map();
        backend.forEach((r) => merged.set(r.id, r));
        liveReviews.forEach((r) => merged.set(r.id, r));
        return Array.from(merged.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [data?.reviews, liveReviews, lastUpdated]);
    // Filter
    const filtered = useMemo(() => {
        return allReviews.filter((r) => {
            if (search.trim() && !r.fileName?.toLowerCase().includes(search.toLowerCase()))
                return false;
            if (modeFilter !== 'all' && r.mode !== modeFilter)
                return false;
            if (scoreFilter === 'pass' && r.score < 80)
                return false;
            if (scoreFilter === 'warn' && (r.score < 60 || r.score >= 80))
                return false;
            if (scoreFilter === 'fail' && r.score >= 60)
                return false;
            return true;
        });
    }, [allReviews, search, modeFilter, scoreFilter]);
    const total = filtered.length;
    const start = (page - 1) * PAGE_SIZE;
    const paginated = filtered.slice(start, start + PAGE_SIZE);
    const totalPages = Math.ceil(total / PAGE_SIZE);
    // Stats from all reviews
    const stats = useMemo(() => {
        const complete = allReviews.filter(r => r.status === 'complete');
        const avgScore = complete.length ? Math.round(complete.reduce((s, r) => s + r.score, 0) / complete.length) : 0;
        const thisWeek = allReviews.filter(r => { try {
            return isThisWeek(new Date(r.createdAt));
        }
        catch {
            return false;
        } }).length;
        const passing = complete.filter(r => r.score >= 80).length;
        return { avgScore, thisWeek, passing, total: allReviews.length };
    }, [allReviews]);
    return (_jsxs("div", { className: "space-y-6 animate-fade-in", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "page-header", children: "Review History" }), _jsx("p", { className: "page-sub", children: "All compliance reviews for your account." })] }), _jsxs(Link, { to: "/soa-analysis", className: "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white", style: { background: '#6B2FD9' }, children: [_jsx(FileSearch, { size: 14 }), "New review"] })] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
                    { label: 'Total reviews', value: stats.total, color: 'text-[#A78BFA]' },
                    { label: 'This week', value: stats.thisWeek, color: 'text-white' },
                    { label: 'Avg score', value: stats.avgScore ? `${stats.avgScore}%` : '—', color: stats.avgScore >= 80 ? 'text-[#2DD4A0]' : 'text-[#FFB347]' },
                    { label: 'Passing (≥80%)', value: stats.passing, color: 'text-[#2DD4A0]' },
                ].map(({ label, value, color }) => (_jsxs("div", { className: "rounded-2xl border border-slate-800 bg-[#0f0f1a] p-4", children: [_jsx("p", { className: `text-xl font-bold font-mono ${color}`, children: value }), _jsx("p", { className: "text-xs text-slate-500 mt-0.5", children: label })] }, label))) }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { size: 13, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" }), _jsx("input", { className: "input pl-8 h-9 text-sm w-52", placeholder: "Filter by filename\u2026", value: search, onChange: (e) => { setSearch(e.target.value); setPage(1); } })] }), _jsx("div", { className: "flex items-center gap-1 p-1 rounded-lg bg-slate-800/60 border border-slate-700", children: ['all', 'quick', 'full'].map((m) => (_jsx("button", { onClick: () => { setModeFilter(m); setPage(1); }, className: `px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${modeFilter === m ? 'bg-[#6B2FD9] text-white' : 'text-slate-400 hover:text-white'}`, children: m === 'all' ? 'All modes' : m }, m))) }), _jsx("div", { className: "flex items-center gap-1 p-1 rounded-lg bg-slate-800/60 border border-slate-700", children: [
                            { key: 'all', label: 'All scores' },
                            { key: 'pass', label: '≥80%' },
                            { key: 'warn', label: '60–79%' },
                            { key: 'fail', label: '<60%' },
                        ].map(({ key, label }) => (_jsx("button", { onClick: () => { setScoreFilter(key); setPage(1); }, className: `px-3 py-1 rounded-md text-xs font-medium transition-colors ${scoreFilter === key ? 'bg-[#6B2FD9] text-white' : 'text-slate-400 hover:text-white'}`, children: label }, key))) }), (search || modeFilter !== 'all' || scoreFilter !== 'all') && (_jsxs("button", { onClick: () => { setSearch(''); setModeFilter('all'); setScoreFilter('all'); setPage(1); }, className: "text-xs text-[#A78BFA] hover:text-white flex items-center gap-1 transition-colors", children: [_jsx(Filter, { size: 11 }), "Clear filters"] })), _jsxs("span", { className: "ml-auto text-xs text-slate-500", children: [total, " review", total !== 1 ? 's' : ''] })] }), _jsxs("div", { className: "rounded-2xl border border-slate-800 bg-[#0f0f1a] overflow-hidden", children: [_jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-800 text-xs text-slate-500 uppercase tracking-widest", children: [_jsx("th", { className: "text-left px-5 py-3 font-medium", children: "File" }), _jsx("th", { className: "text-left px-5 py-3 font-medium", children: "Mode" }), _jsx("th", { className: "text-left px-5 py-3 font-medium", children: "Score" }), _jsx("th", { className: "text-left px-5 py-3 font-medium", children: "Status" }), _jsx("th", { className: "text-left px-5 py-3 font-medium", children: "Date" }), _jsx("th", { className: "text-left px-5 py-3 font-medium", children: "Size" }), _jsx("th", { className: "px-5 py-3" })] }) }), _jsxs("tbody", { children: [loading && !allReviews.length && [...Array(6)].map((_, i) => (_jsx("tr", { className: "border-b border-slate-800/60", children: [...Array(7)].map((__, j) => (_jsx("td", { className: "px-5 py-4", children: _jsx("div", { className: "skeleton h-4 rounded w-full" }) }, j))) }, i))), !loading && paginated.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: "px-5 py-16 text-center", children: _jsxs("div", { className: "flex flex-col items-center gap-3", children: [_jsx("div", { className: "w-12 h-12 rounded-2xl bg-[#6B2FD9]/10 flex items-center justify-center", children: _jsx(FileSearch, { size: 20, className: "text-[#A78BFA]" }) }), _jsx("p", { className: "text-sm text-slate-400", children: search || modeFilter !== 'all' || scoreFilter !== 'all'
                                                            ? 'No reviews match your filters.'
                                                            : 'No reviews yet.' }), !search && modeFilter === 'all' && scoreFilter === 'all' && (_jsx(Link, { to: "/soa-analysis", className: "text-xs text-[#A78BFA] hover:text-white transition-colors", children: "Run your first review \u2192" }))] }) }) })), paginated.map((r) => (_jsxs("tr", { className: "border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors", children: [_jsx("td", { className: "px-5 py-3.5", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { size: 12, className: "text-slate-600 shrink-0" }), _jsx("span", { className: "text-slate-200 truncate max-w-[200px] font-medium", children: r.fileName || 'SOA Document' })] }) }), _jsx("td", { className: "px-5 py-3.5", children: _jsx("span", { className: `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${r.mode === 'quick'
                                                        ? 'bg-[#6B2FD9]/10 text-[#A78BFA] border-[#6B2FD9]/20'
                                                        : 'bg-slate-800/60 text-slate-400 border-slate-700'}`, children: r.mode === 'quick' ? 'Quick' : 'Full' }) }), _jsx("td", { className: "px-5 py-3.5", children: r.status === 'complete'
                                                    ? _jsx(ScoreBadge, { score: r.score })
                                                    : _jsx(Minus, { size: 14, className: "text-slate-600" }) }), _jsx("td", { className: "px-5 py-3.5", children: _jsx(StatusPill, { status: r.status }) }), _jsx("td", { className: "px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap", children: _jsx(DateLabel, { date: r.createdAt }) }), _jsx("td", { className: "px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap", children: formatBytes(r.fileSize ?? 0) }), _jsx("td", { className: "px-5 py-3.5 text-right", children: _jsxs(Link, { to: `/review/${r.id}`, className: "inline-flex items-center gap-1 text-xs text-[#A78BFA] hover:text-white transition-colors", children: ["View ", _jsx(ExternalLink, { size: 10 })] }) })] }, r.id)))] })] }), total > PAGE_SIZE && (_jsxs("div", { className: "flex items-center justify-between px-5 py-3 border-t border-slate-800", children: [_jsxs("span", { className: "text-xs text-slate-500", children: [start + 1, "\u2013", Math.min(start + PAGE_SIZE, total), " of ", total, " reviews"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1, className: "btn-secondary text-xs py-1.5 px-3 disabled:opacity-30 flex items-center gap-1", children: [_jsx(ChevronLeft, { size: 13 }), "Prev"] }), _jsxs("span", { className: "text-xs text-slate-500 font-mono", children: [page, " / ", totalPages] }), _jsxs("button", { onClick: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page >= totalPages, className: "btn-secondary text-xs py-1.5 px-3 disabled:opacity-30 flex items-center gap-1", children: ["Next", _jsx(ChevronRight, { size: 13 })] })] })] }))] })] }));
}
