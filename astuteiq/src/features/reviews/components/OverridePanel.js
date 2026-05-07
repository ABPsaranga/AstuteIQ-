import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Edit3, X } from 'lucide-react';
import StatusBadge from '../../../components/ui/StatusBadge';
import { useSubmitOverride } from '../../../features/reviews/hooks';
const STATUSES = ['PASS', 'FAIL', 'WARNING', 'NA'];
export default function OverridePanel({ finding, reviewId, onClose }) {
    const [status, setStatus] = useState(finding.status);
    const [comment, setComment] = useState('');
    const { submit, loading } = useSubmitOverride(reviewId);
    async function handleSubmit() {
        if (!comment.trim())
            return;
        const ok = await submit(finding.checkId, status, comment);
        if (ok)
            onClose?.();
    }
    return (_jsxs("div", { className: "card border-brand-500/30 space-y-4 animate-slide-up", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-0.5", children: [_jsx(Edit3, { size: 14, className: "text-brand-400" }), _jsx("span", { className: "text-xs font-medium text-brand-400 uppercase tracking-wide", children: "Override Finding" })] }), _jsx("h3", { className: "text-sm font-semibold text-white", children: finding.title }), _jsx("p", { className: "text-xs text-slate-500 mt-0.5", children: finding.category })] }), onClose && (_jsx("button", { onClick: onClose, className: "text-slate-600 hover:text-slate-400", children: _jsx(X, { size: 16 }) }))] }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-500", children: [_jsx("span", { children: "Current:" }), _jsx(StatusBadge, { status: finding.status, size: "sm" }), _jsxs("span", { className: "text-slate-600", children: [finding.confidence, "% confidence"] })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Override status" }), _jsx("div", { className: "flex flex-wrap gap-2", children: STATUSES.map((s) => (_jsx("button", { onClick: () => setStatus(s), className: `px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${status === s
                                ? 'border-brand-500 bg-brand-500/20 text-brand-300'
                                : 'border-surface-border text-slate-500 hover:border-slate-500'}`, children: s }, s))) })] }), _jsxs("div", { children: [_jsxs("label", { className: "label", children: ["Reason for override ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("textarea", { className: "input resize-none", rows: 3, placeholder: "Explain why you are overriding this finding\u2026", value: comment, onChange: (e) => setComment(e.target.value) })] }), _jsxs("div", { className: "flex justify-end gap-3", children: [onClose && (_jsx("button", { onClick: onClose, className: "btn-secondary", children: "Cancel" })), _jsx("button", { onClick: handleSubmit, disabled: !comment.trim() || loading || status === finding.status, className: "btn-primary", children: loading ? 'Saving…' : 'Save override' })] })] }));
}
