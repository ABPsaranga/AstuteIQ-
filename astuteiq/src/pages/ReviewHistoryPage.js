import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Search, ExternalLink } from 'lucide-react';
import { useReviewHistory } from '../features/reviews/hooks';
import { format } from 'date-fns';
function formatBytes(bytes) {
    if (bytes < 1048576)
        return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}
export default function ReviewHistoryPage() {
    const { data, loading, fetch } = useReviewHistory();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    useEffect(() => {
        fetch(page, 20);
    }, [fetch, page]);
    const reviews = (data?.reviews ?? []).filter((r) => search.trim() === '' ||
        r.fileName.toLowerCase().includes(search.toLowerCase()));
    return (_jsxs("div", { className: "space-y-5 animate-fade-in", children: [_jsxs("div", { children: [_jsx("h1", { className: "page-header", children: "Review History" }), _jsx("p", { className: "page-sub", children: "All past compliance reviews for your account." })] }), _jsxs("div", { className: "relative max-w-xs", children: [_jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" }), _jsx("input", { className: "input pl-9 h-9 text-sm", placeholder: "Filter by filename\u2026", value: search, onChange: (e) => setSearch(e.target.value) })] }), _jsxs("div", { className: "card p-0 overflow-hidden", children: [_jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-surface-border bg-surface-hover text-xs text-slate-500 uppercase tracking-wide", children: [_jsx("th", { className: "text-left px-5 py-3", children: "File" }), _jsx("th", { className: "text-left px-5 py-3", children: "Mode" }), _jsx("th", { className: "text-left px-5 py-3", children: "Score" }), _jsx("th", { className: "text-left px-5 py-3", children: "Date" }), _jsx("th", { className: "text-left px-5 py-3", children: "Size" }), _jsx("th", { className: "px-5 py-3" })] }) }), _jsxs("tbody", { children: [loading &&
                                        [...Array(6)].map((_, i) => (_jsx("tr", { className: "border-b border-surface-border", children: [...Array(6)].map((__, j) => (_jsx("td", { className: "px-5 py-3", children: _jsx("div", { className: "skeleton h-4 rounded w-full" }) }, j))) }, i))), !loading && reviews.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-5 py-10 text-center text-slate-500 text-sm", children: search ? 'No reviews match your search.' : 'No reviews yet.' }) })), !loading &&
                                        reviews.map((r) => (_jsxs("tr", { className: "border-b border-surface-border hover:bg-surface-hover transition-colors", children: [_jsx("td", { className: "px-5 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { size: 13, className: "text-slate-600 shrink-0" }), _jsx("span", { className: "text-slate-200 truncate max-w-xs", children: r.fileName })] }) }), _jsx("td", { className: "px-5 py-3 text-slate-500 capitalize", children: r.mode }), _jsx("td", { className: "px-5 py-3", children: _jsxs("span", { className: `font-semibold ${r.score >= 80
                                                            ? 'text-green-400'
                                                            : r.score >= 60
                                                                ? 'text-orange-400'
                                                                : 'text-red-400'}`, children: [r.score, "%"] }) }), _jsx("td", { className: "px-5 py-3 text-slate-400 whitespace-nowrap", children: format(new Date(r.createdAt), 'dd MMM yyyy') }), _jsx("td", { className: "px-5 py-3 text-slate-500 whitespace-nowrap", children: formatBytes(r.fileSize) }), _jsx("td", { className: "px-5 py-3 text-right", children: _jsxs(Link, { to: `/review/${r.id}`, className: "inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300", children: ["View ", _jsx(ExternalLink, { size: 11 })] }) })] }, r.id)))] })] }), data && data.total > 20 && (_jsxs("div", { className: "flex items-center justify-between px-5 py-3 border-t border-surface-border", children: [_jsxs("span", { className: "text-xs text-slate-500", children: ["Showing ", (page - 1) * 20 + 1, "\u2013", Math.min(page * 20, data.total), " of ", data.total] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1, className: "btn-secondary text-xs py-1 px-3 disabled:opacity-30", children: "Previous" }), _jsx("button", { onClick: () => setPage((p) => p + 1), disabled: page * 20 >= data.total, className: "btn-secondary text-xs py-1 px-3 disabled:opacity-30", children: "Next" })] })] }))] })] }));
}
