import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function SummaryCard({ summary, score }) {
    const segments = [
        { label: 'Pass', value: summary.pass, color: '#22c55e', bg: 'bg-green-500/20  text-green-400' },
        { label: 'Fail', value: summary.fail, color: '#ef4444', bg: 'bg-red-500/20    text-red-400' },
        { label: 'Warning', value: summary.warning, color: '#f97316', bg: 'bg-orange-500/20 text-orange-400' },
        { label: 'NA', value: summary.na, color: '#6b7280', bg: 'bg-slate-500/10  text-slate-400' },
    ];
    // Gauge bar proportions
    const total = summary.total || 1;
    return (_jsxs("div", { className: "card space-y-4", children: [_jsxs("div", { className: "flex items-center gap-5", children: [_jsxs("div", { className: "relative w-16 h-16 shrink-0", children: [_jsxs("svg", { viewBox: "0 0 64 64", className: "w-full h-full -rotate-90", children: [_jsx("circle", { cx: "32", cy: "32", r: "26", fill: "none", stroke: "#252a38", strokeWidth: "8" }), _jsx("circle", { cx: "32", cy: "32", r: "26", fill: "none", stroke: score >= 80 ? '#22c55e' : score >= 60 ? '#f97316' : '#ef4444', strokeWidth: "8", strokeLinecap: "round", strokeDasharray: `${(score / 100) * 163.4} 163.4`, className: "transition-all duration-700" })] }), _jsxs("span", { className: "absolute inset-0 flex items-center justify-center text-sm font-bold text-white", children: [score, "%"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 uppercase tracking-wide font-medium", children: "Overall Score" }), _jsxs("p", { className: "text-lg font-semibold text-white", children: [summary.total, " checks"] })] })] }), _jsx("div", { className: "flex h-2 rounded-full overflow-hidden gap-px", children: segments.map((s) => (_jsx("div", { style: { width: `${(s.value / total) * 100}%`, background: s.color }, className: "transition-all duration-500" }, s.label))) }), _jsx("div", { className: "grid grid-cols-4 gap-2", children: segments.map((s) => (_jsxs("div", { className: `rounded-lg p-2 text-center ${s.bg}`, children: [_jsx("p", { className: "text-base font-bold", children: s.value }), _jsx("p", { className: "text-xs opacity-80", children: s.label })] }, s.label))) })] }));
}
