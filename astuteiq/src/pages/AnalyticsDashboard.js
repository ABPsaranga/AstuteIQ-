import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, } from 'recharts';
import ActivityChart from '../components/ActivityChart';
import StatCard from '../components/ui/StatCard';
import { TrendingUp, FileSearch, CheckCircle, XCircle } from 'lucide-react';
const MONTHLY_DATA = [
    { month: 'Jul', reviews: 24, pass: 18, fail: 6 },
    { month: 'Aug', reviews: 31, pass: 25, fail: 6 },
    { month: 'Sep', reviews: 28, pass: 21, fail: 7 },
    { month: 'Oct', reviews: 42, pass: 35, fail: 7 },
    { month: 'Nov', reviews: 38, pass: 30, fail: 8 },
    { month: 'Dec', reviews: 19, pass: 16, fail: 3 },
    { month: 'Jan', reviews: 47, pass: 40, fail: 7 },
];
const CATEGORY_DATA = [
    { name: 'Risk Profile', value: 94 },
    { name: 'Fees & Costs', value: 78 },
    { name: 'Best Interests', value: 86 },
    { name: 'Client Objectives', value: 82 },
    { name: 'Insurance', value: 71 },
    { name: 'Projections', value: 68 },
];
const PIE_DATA = [
    { name: 'PASS', value: 55, color: '#22c55e' },
    { name: 'FAIL', value: 20, color: '#ef4444' },
    { name: 'WARNING', value: 18, color: '#f97316' },
    { name: 'NA', value: 7, color: '#6b7280' },
];
const TOOLTIP_STYLE = {
    background: '#181c27', border: '1px solid #252a38',
    borderRadius: '0.5rem', fontSize: '12px', color: '#f1f5f9',
};
export default function AnalyticsDashboard() {
    return (_jsxs("div", { className: "space-y-6 animate-fade-in", children: [_jsxs("div", { children: [_jsx("h1", { className: "page-header", children: "Analytics" }), _jsx("p", { className: "page-sub", children: "Compliance trends and performance metrics." })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsx(StatCard, { label: "Reviews this month", value: 47, icon: FileSearch }), _jsx(StatCard, { label: "Platform pass rate", value: "83%", icon: CheckCircle, variant: "success" }), _jsx(StatCard, { label: "Avg confidence", value: "79%", icon: TrendingUp }), _jsx(StatCard, { label: "Critical failures", value: 8, icon: XCircle, variant: "danger" })] }), _jsxs("div", { className: "card", children: [_jsx("h2", { className: "text-sm font-semibold text-white mb-4", children: "Monthly review volume" }), _jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(BarChart, { data: MONTHLY_DATA, margin: { top: 4, right: 8, left: -20, bottom: 0 }, children: [_jsx(CartesianGrid, { stroke: "#252a38", strokeDasharray: "3 3", vertical: false }), _jsx(XAxis, { dataKey: "month", tick: { fill: '#64748b', fontSize: 11 }, axisLine: false, tickLine: false }), _jsx(YAxis, { tick: { fill: '#64748b', fontSize: 11 }, axisLine: false, tickLine: false }), _jsx(Tooltip, { contentStyle: TOOLTIP_STYLE }), _jsx(Bar, { dataKey: "pass", name: "Pass", fill: "#22c55e", radius: [3, 3, 0, 0], stackId: "a" }), _jsx(Bar, { dataKey: "fail", name: "Fail", fill: "#ef4444", radius: [3, 3, 0, 0], stackId: "a" })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-5", children: [_jsxs("div", { className: "card", children: [_jsx("h2", { className: "text-sm font-semibold text-white mb-4", children: "Pass rate by category" }), _jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(BarChart, { data: CATEGORY_DATA, layout: "vertical", margin: { top: 0, right: 8, left: 80, bottom: 0 }, children: [_jsx(CartesianGrid, { stroke: "#252a38", strokeDasharray: "3 3", horizontal: false }), _jsx(XAxis, { type: "number", domain: [0, 100], tick: { fill: '#64748b', fontSize: 11 }, axisLine: false, tickLine: false }), _jsx(YAxis, { type: "category", dataKey: "name", tick: { fill: '#94a3b8', fontSize: 11 }, axisLine: false, tickLine: false, width: 80 }), _jsx(Tooltip, { contentStyle: TOOLTIP_STYLE, formatter: (v) => [`${v}%`, 'Pass rate'] }), _jsx(Bar, { dataKey: "value", fill: "#4a5ff7", radius: [0, 3, 3, 0] })] }) })] }), _jsxs("div", { className: "card", children: [_jsx("h2", { className: "text-sm font-semibold text-white mb-4", children: "Finding distribution" }), _jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: PIE_DATA, cx: "50%", cy: "50%", innerRadius: 60, outerRadius: 90, paddingAngle: 3, dataKey: "value", children: PIE_DATA.map((entry, i) => (_jsx(Cell, { fill: entry.color }, i))) }), _jsx(Legend, { iconType: "circle", iconSize: 8, formatter: (value) => _jsx("span", { style: { color: '#94a3b8', fontSize: 12 }, children: value }) }), _jsx(Tooltip, { contentStyle: TOOLTIP_STYLE, formatter: (v) => [`${v}%`, 'Share'] })] }) })] })] }), _jsxs("div", { className: "card", children: [_jsx("h2", { className: "text-sm font-semibold text-white mb-4", children: "Daily activity \u2014 last 14 days" }), _jsx(ActivityChart, { height: 160 })] })] }));
}
