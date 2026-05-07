import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Edit3 } from 'lucide-react';
import { useFetchReview } from '../features/reviews/hooks';
import { summariseFindings } from '../features/reviews/utils/normalize';
import SummaryCard from '../components/ui/SummaryCard';
import ResultsTable from '../features/reviews/components/ResultsTable';
import OverridePanel from '../features/reviews/components/OverridePanel';
import PDFHighlighterViewer from '../features/reviews/components/PDFHighlighterViewer';
import RiskHeatmap from '../components/RiskHeatmap';
import { exportDocx } from '../features/reviews/exportPdf';
import { format } from 'date-fns';
export default function ReviewResultsPage() {
    const { id } = useParams();
    const { review, loading, fetch } = useFetchReview(id ?? '');
    const [selectedFinding, setSelectedFinding] = useState(null);
    const [showOverride, setShowOverride] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        fetch().catch(() => setError('Failed to load review'));
    }, [fetch]);
    // ================= LOADING =================
    if (loading) {
        return (_jsxs("div", { className: "space-y-4 animate-pulse", children: [_jsx("div", { className: "skeleton h-8 w-48 rounded" }), _jsx("div", { className: "skeleton h-40 rounded-xl" }), _jsx("div", { className: "skeleton h-64 rounded-xl" })] }));
    }
    // ================= ERROR =================
    if (error || !review) {
        return (_jsxs("div", { className: "text-center py-16 text-slate-500", children: [_jsx("p", { children: error ?? 'Review not found.' }), _jsx(Link, { to: "/history", className: "btn-secondary mt-4 inline-flex", children: "\u2190 Back to history" })] }));
    }
    // ================= NORMALIZERS =================
    const normalizeMode = (mode) => mode === 'full' ? 'full' : 'quick';
    const normalizeStatus = (status) => {
        if (status === 'pending')
            return 'pending';
        if (status === 'processing')
            return 'processing';
        if (status === 'complete')
            return 'complete';
        if (status === 'error')
            return 'error';
        return 'pending';
    };
    const normalizeOverrides = (overrides) => {
        return overrides.map((o) => ({
            id: o.id ?? crypto.randomUUID(),
            // ✅ FIX: correct field name
            checkId: o.checkId ?? o.findingId ?? o.check_id ?? '',
            originalStatus: o.originalStatus ?? o.original_status ?? 'UNKNOWN',
            newStatus: o.newStatus ?? o.new_status ?? 'UNKNOWN',
            comment: o.comment ?? '',
            // ✅ REQUIRED FIELDS (missing before)
            overriddenBy: o.overriddenBy ?? o.user_id ?? 'system',
            overriddenAt: o.overriddenAt ?? o.createdAt ?? new Date().toISOString(),
        }));
    };
    // ================= SAFE REVIEW =================
    const safeReview = {
        ...review,
        mode: normalizeMode(review.mode),
        status: normalizeStatus(review.status),
        findings: (review.findings ?? []),
        // ✅ FIXED HERE
        overrides: normalizeOverrides(review.overrides ?? []),
    };
    const findings = safeReview.findings;
    const summary = summariseFindings(findings);
    // ================= EXPORT =================
    function handleExport() {
        exportDocx({
            clientName: safeReview.fileName || 'Client',
            adviser: 'Adviser',
            reviewer: 'AstuteIQ Engine',
            date: safeReview.completedAt
                ? format(new Date(safeReview.completedAt), 'dd MMM yyyy')
                : 'N/A',
            findings: findings.map((f) => ({
                section: f.category || 'General',
                title: f.title,
                status: f.status === 'PASS'
                    ? 'PASS'
                    : f.status === 'FAIL'
                        ? 'FAIL'
                        : 'WARN',
                issue: f.message,
                recommendation: 'Review and update to meet ASIC compliance requirements',
            })),
        });
    }
    return (_jsxs("div", { className: "space-y-6 animate-fade-in", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsxs(Link, { to: "/history", className: "inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mb-2", children: [_jsx(ArrowLeft, { size: 12 }), " History"] }), _jsx("h1", { className: "page-header", children: safeReview.fileName }), _jsxs("p", { className: "page-sub", children: [safeReview.mode === 'quick' ? 'Quick check' : 'Full review', " \u00B7", ' ', safeReview.completedAt
                                        ? format(new Date(safeReview.completedAt), 'dd MMM yyyy, h:mm a')
                                        : 'Pending'] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [selectedFinding && (_jsxs("button", { onClick: () => setShowOverride(true), className: "btn-secondary", children: [_jsx(Edit3, { size: 14 }), "Override finding"] })), _jsxs("button", { onClick: handleExport, className: "btn-secondary", children: [_jsx(Download, { size: 14 }), "Export Report"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-5", children: [_jsx(SummaryCard, { summary: summary, score: safeReview.score }), _jsxs("div", { className: "card", children: [_jsx("h3", { className: "text-sm font-semibold text-white mb-3", children: "Risk by category" }), _jsx(RiskHeatmap, { findings: findings })] })] }), _jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-3 gap-5", children: [_jsxs("div", { className: "xl:col-span-2 space-y-4", children: [_jsx("h2", { className: "text-sm font-semibold text-white", children: "Detailed findings" }), _jsx(ResultsTable, { findings: findings, onSelectFinding: (f) => {
                                    setSelectedFinding(f);
                                    setShowOverride(false);
                                }, selectedId: selectedFinding?.checkId }), showOverride && selectedFinding && (_jsx(OverridePanel, { finding: selectedFinding, reviewId: safeReview.id, onClose: () => setShowOverride(false) })), selectedFinding && !showOverride && (_jsxs("div", { className: "card space-y-3 animate-slide-up", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 uppercase tracking-wide font-medium", children: selectedFinding.category }), _jsx("h3", { className: "text-sm font-semibold text-white mt-0.5", children: selectedFinding.title })] }), _jsxs("button", { onClick: () => setShowOverride(true), className: "btn-secondary text-xs py-1 px-3", children: [_jsx(Edit3, { size: 12 }), "Override"] })] }), _jsx("p", { className: "text-sm text-slate-400", children: selectedFinding.message }), selectedFinding.excerpt && (_jsx("blockquote", { className: "border-l-2 border-brand-500/40 pl-3 text-xs text-slate-500 italic", children: selectedFinding.excerpt })), _jsxs("p", { className: "text-xs text-slate-600", children: ["Referenced pages: ", selectedFinding.pages.join(', ')] })] }))] }), _jsxs("div", { children: [_jsx("h2", { className: "text-sm font-semibold text-white mb-3", children: "Document viewer" }), _jsx(PDFHighlighterViewer, { findings: findings, selectedFinding: selectedFinding })] })] })] }));
}
