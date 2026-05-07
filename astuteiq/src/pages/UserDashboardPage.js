import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FileSearch, PlayCircle, Clock, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../features/auth/store';
import { useReviewHistory } from '../features/reviews/hooks';
import StatCard from '../components/ui/StatCard';
import ActivityChart from '../components/ActivityChart';
import { format, isThisWeek } from 'date-fns';
export default function UserDashboardPage() {
    const user = useAuthStore((s) => s.user);
    const { data, loading, fetch } = useReviewHistory();
    useEffect(() => {
        fetch(1, 100);
    }, [fetch]);
    const reviews = data?.reviews ?? [];
    const recent = reviews.slice(0, 5);
    const firstName = (user?.name ?? user?.email ?? 'there').split(' ')[0];
    const stats = useMemo(() => {
        if (!reviews.length)
            return { avgScore: null, thisWeek: 0, overrides: 0 };
        const completed = reviews.filter((r) => r.status === 'complete');
        const avgScore = completed.length
            ? Math.round(completed.reduce((sum, r) => sum + (r.score ?? 0), 0) / completed.length)
            : null;
        const thisWeek = reviews.filter((r) => {
            try {
                return isThisWeek(new Date(r.createdAt));
            }
            catch {
                return false;
            }
        }).length;
        const overrides = reviews.reduce((sum, r) => sum + (r.overrides?.length ?? 0), 0);
        return { avgScore, thisWeek, overrides };
    }, [reviews]);
    return (_jsx("div", { className: "min-h-screen flex flex-col", children: _jsxs("div", { className: "flex-1 space-y-6 animate-fade-in p-6", children: [_jsxs("div", { children: [_jsxs("h1", { className: "page-header", children: ["Welcome back, ", firstName] }), _jsx("p", { className: "page-sub", children: "Here's an overview of your recent review activity." })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsx(StatCard, { label: "Total reviews", value: loading ? '…' : (data?.total ?? 0), icon: FileSearch }), _jsx(StatCard, { label: "Avg score", value: loading ? '…' : stats.avgScore !== null ? `${stats.avgScore}%` : '—', icon: TrendingUp, variant: "success" }), _jsx(StatCard, { label: "This week", value: loading ? '…' : stats.thisWeek, icon: PlayCircle }), _jsx(StatCard, { label: "Overrides submitted", value: loading ? '…' : stats.overrides, icon: Clock, variant: "warning" })] }), _jsxs("div", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-sm font-semibold text-white", children: "Activity \u2014 last 14 days" }), _jsxs("div", { className: "flex items-center gap-4 text-xs text-slate-500", children: [_jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-brand-500" }), "Reviews"] }), _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-green-500" }), "Avg score"] })] })] }), _jsx(ActivityChart, { height: 180 })] }), _jsxs("div", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-sm font-semibold text-white", children: "Recent reviews" }), _jsx(Link, { to: "/history", className: "text-xs text-brand-400 hover:text-brand-300", children: "View all \u2192" })] }), loading ? (_jsx("div", { className: "space-y-3", children: [...Array(4)].map((_, i) => (_jsx("div", { className: "skeleton h-12 rounded-lg" }, i))) })) : recent.length === 0 ? (_jsxs("div", { className: "text-center py-8 text-slate-500 text-sm", children: ["No reviews yet.", ' ', _jsx(Link, { to: "/soa-analysis", className: "text-brand-400 hover:text-brand-300", children: "Run your first review \u2192" })] })) : (_jsx("ul", { className: "divide-y divide-surface-border", children: recent.map((r) => (_jsxs("li", { className: "py-3 flex items-center gap-4", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm text-slate-200 truncate", children: r.fileName }), _jsxs("p", { className: "text-xs text-slate-500 mt-0.5", children: [format(new Date(r.createdAt), 'dd MMM yyyy, h:mm a'), " \u00B7 ", r.mode, " mode"] })] }), _jsxs("div", { className: "flex items-center gap-3 shrink-0", children: [_jsxs("span", { className: `text-sm font-semibold ${r.score >= 80 ? 'text-green-400' : r.score >= 60 ? 'text-orange-400' : 'text-red-400'}`, children: [r.score, "%"] }), _jsx(Link, { to: `/review/${r.id}`, className: "text-xs text-brand-400 hover:text-brand-300", children: "View \u2192" })] })] }, r.id))) }))] })] }) }));
}
