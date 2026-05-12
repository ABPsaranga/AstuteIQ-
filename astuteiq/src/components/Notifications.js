import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { useReviewHistory } from '../features/reviews/hooks';
// ─────────────────────────────────────────────────────────────
// Derive notifications from real review records
// ─────────────────────────────────────────────────────────────
function deriveNotifications(reviews) {
    return reviews
        .slice(0, 20) // cap at 20 most recent
        .flatMap((r) => {
        const name = r.fileName ?? 'Document';
        const date = new Date(r.createdAt ?? Date.now());
        if (r.status === 'complete') {
            return [{
                    id: `notif-${r.id}-done`,
                    type: 'success',
                    title: 'Review complete',
                    message: `${name} scored ${r.score ?? 0}%.`,
                    createdAt: date,
                    read: false,
                }];
        }
        if (r.status === 'failed') {
            return [{
                    id: `notif-${r.id}-fail`,
                    type: 'error',
                    title: 'Review failed',
                    message: `${name} could not be processed. Try re-uploading.`,
                    createdAt: date,
                    read: false,
                }];
        }
        return [];
    })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────
const ICONS = {
    success: _jsx(CheckCircle, { size: 15, className: "text-[#2DD4A0] shrink-0 mt-0.5" }),
    error: _jsx(AlertCircle, { size: 15, className: "text-[#FF6B6B] shrink-0 mt-0.5" }),
    info: _jsx(Info, { size: 15, className: "text-[#A78BFA] shrink-0 mt-0.5" }),
};
// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function Notifications() {
    const { data, loading, fetch } = useReviewHistory();
    // Fetch on mount — only needs the most recent reviews
    useEffect(() => {
        fetch(1, 20);
    }, [fetch]);
    // Derive from real data
    const derived = deriveNotifications(data?.reviews ?? []);
    // Dismissed ids stored in local state (session only — no backend needed)
    const [dismissed, setDismissed] = useState(new Set());
    const dismiss = (id) => setDismissed((prev) => new Set([...prev, id]));
    const visible = derived.filter((n) => !dismissed.has(n.id));
    // ── Loading skeleton ────────────────────────────────────────
    if (loading) {
        return (_jsx("ul", { className: "space-y-2", children: [...Array(3)].map((_, i) => (_jsxs("li", { className: "flex gap-3 p-3 rounded-lg border border-slate-800 bg-[#0f0f1a] animate-pulse", children: [_jsx("div", { className: "w-4 h-4 rounded-full bg-slate-800 mt-0.5 shrink-0" }), _jsxs("div", { className: "flex-1 space-y-2", children: [_jsx("div", { className: "h-3 bg-slate-800 rounded w-1/3" }), _jsx("div", { className: "h-3 bg-slate-800/60 rounded w-2/3" })] })] }, i))) }));
    }
    // ── Empty state ─────────────────────────────────────────────
    if (visible.length === 0) {
        return (_jsx("div", { className: "text-center py-8 text-slate-500 text-sm", children: data?.reviews?.length === 0
                ? 'Run your first review to see notifications here.'
                : 'No new notifications.' }));
    }
    // ── Notification list ───────────────────────────────────────
    return (_jsx("ul", { className: "space-y-2", children: visible.map((n) => (_jsxs("li", { className: `flex gap-3 p-3 rounded-lg border transition-colors ${n.read
                ? 'bg-[#0f0f1a] border-slate-800/60'
                : 'bg-[#0f0f1a] border-slate-700/60'}`, children: [ICONS[n.type], _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: `text-sm font-medium ${n.read ? 'text-slate-400' : 'text-white'}`, children: n.title }), _jsx("p", { className: "text-xs text-slate-500 mt-0.5 truncate", children: n.message }), _jsx("p", { className: "text-xs text-slate-600 mt-1", children: format(n.createdAt, 'dd MMM, h:mm a') })] }), _jsx("button", { onClick: () => dismiss(n.id), className: "text-slate-600 hover:text-slate-400 shrink-0 transition-colors", "aria-label": "Dismiss", children: _jsx(X, { size: 13 }) })] }, n.id))) }));
}
