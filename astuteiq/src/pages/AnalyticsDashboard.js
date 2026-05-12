import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, } from 'recharts';
import { TrendingUp, FileSearch, CheckCircle, XCircle, AlertTriangle, } from 'lucide-react';
import ActivityChart from '../components/ActivityChart';
import StatCard from '../components/ui/StatCard';
import api from '../lib/api';
const TOOLTIP_STYLE = {
    background: '#181c27',
    border: '1px solid #252a38',
    borderRadius: '0.5rem',
    fontSize: '12px',
    color: '#f1f5f9',
};
export default function AnalyticsDashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    useEffect(() => {
        fetchAnalytics();
    }, []);
    async function fetchAnalytics() {
        try {
            setLoading(true);
            const res = await api.get('/reviews/analytics');
            setData(res.data);
        }
        catch (err) {
            console.error('Failed to load analytics', err);
        }
        finally {
            setLoading(false);
        }
    }
    const pieData = useMemo(() => {
        if (!data)
            return [];
        return [
            {
                name: 'PASS',
                value: data.finding_distribution.pass,
                color: '#22c55e',
            },
            {
                name: 'FAIL',
                value: data.finding_distribution.fail,
                color: '#ef4444',
            },
            {
                name: 'WARNING',
                value: data.finding_distribution.warning,
                color: '#f97316',
            },
            {
                name: 'NA',
                value: data.finding_distribution.na,
                color: '#6b7280',
            },
        ];
    }, [data]);
    if (loading) {
        return (_jsxs("div", { className: "space-y-6 animate-fade-in", children: [_jsxs("div", { children: [_jsx("div", { className: "skeleton h-8 w-52 rounded mb-2" }), _jsx("div", { className: "skeleton h-4 w-72 rounded" })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [...Array(4)].map((_, i) => (_jsx("div", { className: "card h-28", children: _jsx("div", { className: "skeleton h-full rounded-xl" }) }, i))) }), _jsx("div", { className: "card h-[280px]", children: _jsx("div", { className: "skeleton h-full rounded-xl" }) })] }));
    }
    return (_jsxs("div", { className: "space-y-6 animate-fade-in", children: [_jsxs("div", { children: [_jsx("h1", { className: "page-header", children: "Analytics" }), _jsx("p", { className: "page-sub", children: "Real-time compliance trends and review performance metrics." })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsx(StatCard, { label: "Reviews this month", value: data?.total_reviews ?? 0, icon: FileSearch }), _jsx(StatCard, { label: "Platform pass rate", value: `${data?.pass_rate ?? 0}%`, icon: CheckCircle, variant: "success" }), _jsx(StatCard, { label: "Avg confidence", value: `${data?.avg_confidence ?? 0}%`, icon: TrendingUp }), _jsx(StatCard, { label: "Critical failures", value: data?.critical_failures ?? 0, icon: XCircle, variant: "danger" })] }), _jsxs("div", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-semibold text-white", children: "Monthly review volume" }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Real compliance review activity over time" })] }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-500", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-green-500" }), "Pass"] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-red-500" }), "Fail"] })] })] }), _jsx(ResponsiveContainer, { width: "100%", height: 240, children: _jsxs(BarChart, { data: data?.monthly_reviews ?? [], margin: { top: 4, right: 8, left: -20, bottom: 0 }, children: [_jsx(CartesianGrid, { stroke: "#252a38", strokeDasharray: "3 3", vertical: false }), _jsx(XAxis, { dataKey: "month", tick: { fill: '#64748b', fontSize: 11 }, axisLine: false, tickLine: false }), _jsx(YAxis, { tick: { fill: '#64748b', fontSize: 11 }, axisLine: false, tickLine: false }), _jsx(Tooltip, { contentStyle: TOOLTIP_STYLE }), _jsx(Bar, { dataKey: "pass", name: "Pass", fill: "#22c55e", radius: [4, 4, 0, 0], stackId: "a" }), _jsx(Bar, { dataKey: "fail", name: "Fail", fill: "#ef4444", radius: [4, 4, 0, 0], stackId: "a" })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-5", children: [_jsxs("div", { className: "card", children: [_jsxs("div", { className: "mb-4", children: [_jsx("h2", { className: "text-sm font-semibold text-white", children: "Pass rate by category" }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "AI compliance performance across review categories" })] }), _jsx(ResponsiveContainer, { width: "100%", height: 260, children: _jsxs(BarChart, { data: data?.category_pass_rates ?? [], layout: "vertical", margin: { top: 0, right: 8, left: 80, bottom: 0 }, children: [_jsx(CartesianGrid, { stroke: "#252a38", strokeDasharray: "3 3", horizontal: false }), _jsx(XAxis, { type: "number", domain: [0, 100], tick: { fill: '#64748b', fontSize: 11 }, axisLine: false, tickLine: false }), _jsx(YAxis, { type: "category", dataKey: "name", tick: { fill: '#94a3b8', fontSize: 11 }, axisLine: false, tickLine: false, width: 90 }), _jsx(Tooltip, { contentStyle: TOOLTIP_STYLE, formatter: (v) => [`${v}%`, 'Pass rate'] }), _jsx(Bar, { dataKey: "value", fill: "#6B2FD9", radius: [0, 4, 4, 0] })] }) })] }), _jsxs("div", { className: "card", children: [_jsxs("div", { className: "mb-4", children: [_jsx("h2", { className: "text-sm font-semibold text-white", children: "Finding distribution" }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Breakdown of AI review outcomes" })] }), _jsx(ResponsiveContainer, { width: "100%", height: 260, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: pieData, cx: "50%", cy: "50%", innerRadius: 65, outerRadius: 95, paddingAngle: 3, dataKey: "value", children: pieData.map((entry, i) => (_jsx(Cell, { fill: entry.color }, i))) }), _jsx(Legend, { iconType: "circle", iconSize: 8, formatter: (value) => (_jsx("span", { style: {
                                                    color: '#94a3b8',
                                                    fontSize: 12,
                                                }, children: value })) }), _jsx(Tooltip, { contentStyle: TOOLTIP_STYLE, formatter: (v) => [`${v}%`, 'Share'] })] }) }), _jsxs("div", { className: "grid grid-cols-2 gap-3 mt-2", children: [_jsxs("div", { className: "rounded-xl border border-slate-800 bg-slate-900/50 p-3", children: [_jsxs("div", { className: "flex items-center gap-2 text-green-400 text-xs font-medium", children: [_jsx(CheckCircle, { size: 12 }), "Passing findings"] }), _jsxs("p", { className: "text-xl font-bold text-white mt-2", children: [data?.finding_distribution.pass ?? 0, "%"] })] }), _jsxs("div", { className: "rounded-xl border border-slate-800 bg-slate-900/50 p-3", children: [_jsxs("div", { className: "flex items-center gap-2 text-orange-400 text-xs font-medium", children: [_jsx(AlertTriangle, { size: 12 }), "Warning findings"] }), _jsxs("p", { className: "text-xl font-bold text-white mt-2", children: [data?.finding_distribution.warning ?? 0, "%"] })] })] })] })] }), _jsxs("div", { className: "card", children: [_jsxs("div", { className: "mb-4", children: [_jsx("h2", { className: "text-sm font-semibold text-white", children: "Daily activity \u2014 last 14 days" }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Live review activity across the platform" })] }), _jsx(ActivityChart, { height: 180 })] })] }));
}
