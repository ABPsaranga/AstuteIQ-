import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { mapFindingsToHighlights, groupHighlightsByPage } from '../utils/pdfTextMatcher';
import StatusBadge from '../../../components/ui/StatusBadge';
// Total simulated pages
const TOTAL_PAGES = 12;
export default function PDFHighlighterViewer({ findings, selectedFinding }) {
    const [page, setPage] = useState(1);
    const highlights = mapFindingsToHighlights(findings);
    const byPage = groupHighlightsByPage(highlights);
    const pageHighlights = byPage.get(page) ?? [];
    function prev() { setPage((p) => Math.max(1, p - 1)); }
    function next() { setPage((p) => Math.min(TOTAL_PAGES, p + 1)); }
    // Jump to page of selected finding
    const jumpToFinding = (f) => {
        if (f.pages.length > 0)
            setPage(f.pages[0]);
    };
    // Expose jump to parent via effect
    if (selectedFinding && selectedFinding.pages[0] !== page && selectedFinding.pages.length > 0) {
        // Auto-navigate to the finding page when selection changes
        // Using a direct state update in render is not ideal; using inline jump
        jumpToFinding(selectedFinding);
    }
    return (_jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("div", { className: "relative bg-white rounded-xl overflow-hidden shadow-lg", style: { aspectRatio: '8.5/11' }, children: [_jsxs("div", { className: "absolute inset-0 flex flex-col p-8 text-slate-900", children: [_jsxs("div", { className: "border-b border-slate-200 pb-4 mb-4", children: [_jsx("div", { className: "h-4 w-48 bg-slate-200 rounded mb-2" }), _jsx("div", { className: "h-3 w-32 bg-slate-100 rounded" })] }), Array.from({ length: 18 }, (_, i) => (_jsx("div", { className: "h-2.5 bg-slate-100 rounded mb-2", style: { width: `${60 + Math.sin(i * 1.5) * 30}%` } }, i)))] }), pageHighlights.map((h, i) => {
                        const isSelected = selectedFinding?.checkId === h.finding.checkId;
                        const colorMap = {
                            PASS: 'rgba(34,197,94,0.25)',
                            FAIL: 'rgba(239,68,68,0.25)',
                            WARNING: 'rgba(249,115,22,0.25)',
                            NA: 'rgba(107,114,128,0.15)',
                        };
                        return (_jsx("div", { className: "absolute rounded transition-all duration-200", style: {
                                top: `${h.top}%`,
                                left: `${h.left}%`,
                                width: `${h.width}%`,
                                height: `${h.height}%`,
                                background: colorMap[h.finding.status],
                                border: isSelected ? '2px solid rgba(74,95,247,0.8)' : '1px solid transparent',
                            }, title: h.finding.title }, i));
                    }), _jsxs("div", { className: "absolute bottom-3 right-3 text-xs text-slate-400", children: ["Page ", page] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("button", { onClick: prev, disabled: page === 1, className: "btn-secondary px-3 py-1.5 disabled:opacity-30", children: _jsx(ChevronLeft, { size: 15 }) }), _jsxs("span", { className: "text-xs text-slate-500", children: ["Page ", page, " of ", TOTAL_PAGES] }), _jsx("button", { onClick: next, disabled: page === TOTAL_PAGES, className: "btn-secondary px-3 py-1.5 disabled:opacity-30", children: _jsx(ChevronRight, { size: 15 }) })] }), pageHighlights.length > 0 && (_jsxs("div", { className: "space-y-1.5", children: [_jsx("p", { className: "text-xs text-slate-500 font-medium uppercase tracking-wide", children: "Findings on this page" }), pageHighlights.map((h, i) => (_jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-400 p-2 rounded-lg bg-surface-hover", children: [_jsx(FileText, { size: 12, className: "shrink-0" }), _jsx("span", { className: "flex-1 truncate", children: h.finding.title }), _jsx(StatusBadge, { status: h.finding.status, size: "sm" })] }, i)))] }))] }));
}
