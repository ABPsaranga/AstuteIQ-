import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, AlertTriangle } from 'lucide-react';
import StatusBadge from '../../../components/ui/StatusBadge';
const ALL_STATUSES = ['PASS', 'FAIL', 'WARNING', 'NA'];
export default function ResultsTable({ findings, overrides, onSelectFinding, onFlagFinding, selectedId }) {
    const [sort, setSort] = useState({ field: 'status', dir: 'asc' });
    const [statusFilter, setStatusFilter] = useState([]);
    const [search, setSearch] = useState('');
    function isOverridden(finding) {
        return overrides.some(o => o.checkId === finding.checkId);
    }
    function getOverride(finding) {
        return overrides.find(o => o.checkId === finding.checkId);
    }
    function toggleSort(field) {
        setSort((prev) => prev.field === field
            ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
            : { field, dir: 'asc' });
    }
    function toggleStatus(s) {
        setStatusFilter((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
    }
    const STATUS_ORDER = { FAIL: 0, WARNING: 1, PASS: 2, NA: 3 };
    const filtered = findings
        .filter((f) => statusFilter.length === 0 || statusFilter.includes(f.status))
        .filter((f) => search.trim() === '' ||
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.category.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
        let cmp = 0;
        if (sort.field === 'status')
            cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        if (sort.field === 'confidence')
            cmp = a.confidence - b.confidence;
        if (sort.field === 'title')
            cmp = a.title.localeCompare(b.title);
        if (sort.field === 'category')
            cmp = a.category.localeCompare(b.category);
        return sort.dir === 'asc' ? cmp : -cmp;
    });
    const SortIcon = ({ field }) => {
        if (sort.field !== field)
            return _jsx(ChevronDown, { size: 13, className: "opacity-30" });
        return sort.dir === 'asc' ? _jsx(ChevronUp, { size: 13 }) : _jsx(ChevronDown, { size: 13 });
    };
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex flex-wrap gap-2 items-center", children: [_jsx("input", { className: "input h-8 text-xs w-48", placeholder: "Search checks\u2026", value: search, onChange: (e) => setSearch(e.target.value) }), _jsxs("div", { className: "flex items-center gap-1 ml-1", children: [_jsx(Filter, { size: 13, className: "text-slate-500" }), ALL_STATUSES.map((s) => (_jsx("button", { onClick: () => toggleStatus(s), className: `text-xs px-2 py-1 rounded border transition-colors ${statusFilter.includes(s)
                                    ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                                    : 'border-surface-border text-slate-500 hover:text-slate-300'}`, children: s }, s)))] }), _jsxs("span", { className: "text-xs text-slate-600 ml-auto", children: [filtered.length, " results"] })] }), _jsx("div", { className: "overflow-x-auto rounded-xl border border-surface-border", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-surface-border bg-surface-hover text-xs text-slate-500 uppercase tracking-wide", children: [[
                                        { field: 'title', label: 'Check' },
                                        { field: 'category', label: 'Category' },
                                        { field: 'status', label: 'Status' },
                                        { field: 'confidence', label: 'Confidence' },
                                    ].map(({ field, label }) => (_jsx("th", { className: "text-left px-4 py-3 cursor-pointer hover:text-slate-300 select-none whitespace-nowrap", onClick: () => toggleSort(field), children: _jsxs("span", { className: "inline-flex items-center gap-1", children: [label, _jsx(SortIcon, { field: field })] }) }, field))), _jsx("th", { className: "text-left px-4 py-3", children: "Finding" }), _jsx("th", { className: "px-4 py-3", children: "Pages" }), _jsx("th", { className: "px-4 py-3", children: "Actions" })] }) }), _jsxs("tbody", { children: [filtered.map((f) => {
                                    const overridden = isOverridden(f);
                                    const override = getOverride(f);
                                    return (_jsxs("tr", { onClick: () => onSelectFinding(f), className: `border-b border-surface-border cursor-pointer transition-colors ${selectedId === f.checkId
                                            ? 'bg-brand-500/10'
                                            : overridden
                                                ? 'bg-amber-500/10 hover:bg-amber-500/20'
                                                : 'hover:bg-surface-hover'}`, children: [_jsx("td", { className: "px-4 py-3 font-medium text-slate-200 whitespace-nowrap", children: f.title }), _jsx("td", { className: "px-4 py-3 text-slate-400 whitespace-nowrap", children: f.category }), _jsxs("td", { className: "px-4 py-3", children: [_jsx(StatusBadge, { status: f.status, size: "sm" }), overridden && override && (_jsxs("div", { className: "text-xs text-amber-400 mt-1", children: ["\u2192 ", override.newStatus] }))] }), _jsx("td", { className: "px-4 py-3 text-slate-400", children: _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("div", { className: "h-1.5 w-16 bg-surface-border rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-brand-500 rounded-full", style: { width: `${f.confidence}%` } }) }), _jsxs("span", { className: "text-xs", children: [f.confidence, "%"] })] }) }), _jsx("td", { className: "px-4 py-3 text-slate-400 max-w-xs", children: _jsx("p", { className: "truncate text-xs", children: f.message }) }), _jsx("td", { className: "px-4 py-3 text-center text-xs text-slate-500 whitespace-nowrap", children: f.pages.join(', ') }), _jsx("td", { className: "px-4 py-3 text-center", children: _jsxs("button", { onClick: (e) => {
                                                        e.stopPropagation();
                                                        onFlagFinding(f);
                                                    }, className: `inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${overridden
                                                        ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`, title: overridden ? 'Override this finding' : 'Flag as incorrect', children: [_jsx(AlertTriangle, { size: 12 }), overridden ? 'Override' : 'Flag'] }) })] }, f.checkId));
                                }), filtered.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: "px-4 py-8 text-center text-sm text-slate-500", children: "No results match your filters." }) }))] })] }) })] }));
}
