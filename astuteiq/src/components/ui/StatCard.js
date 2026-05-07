import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
const VARIANT_ICON_BG = {
    default: 'bg-brand-500/10 text-brand-400',
    success: 'bg-green-500/10 text-green-400',
    danger: 'bg-red-500/10 text-red-400',
    warning: 'bg-orange-500/10 text-orange-400',
};
// 🔢 format values
function formatValue(value) {
    if (value === null || value === undefined)
        return '—';
    if (typeof value === 'number')
        return value.toLocaleString();
    return value;
}
// 📈 Sparkline component
function Sparkline({ data }) {
    const width = 120;
    const height = 40;
    const padding = 4;
    const { points, strokeColor } = useMemo(() => {
        if (!data.length)
            return { points: '', strokeColor: '#64748b' };
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const pts = data
            .map((d, i) => {
            const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
            const y = height -
                ((d - min) / range) * (height - padding * 2) -
                padding;
            return `${x},${y}`;
        })
            .join(' ');
        const strokeColor = data[data.length - 1] >= data[0]
            ? '#22c55e' // green
            : '#ef4444'; // red
        return { points: pts, strokeColor };
    }, [data]);
    return (_jsx("svg", { width: width, height: height, className: "mt-2", viewBox: `0 0 ${width} ${height}`, children: _jsx("polyline", { fill: "none", stroke: strokeColor, strokeWidth: "2", points: points, className: "opacity-90" }) }));
}
export default function StatCard({ label, value, icon: Icon, trend, variant = 'default', loading = false, hint, sparkline, }) {
    return (_jsxs("div", { className: "card flex items-start gap-4 animate-fade-in", children: [Icon && (_jsx("div", { className: `p-2.5 rounded-lg shrink-0 ${VARIANT_ICON_BG[variant]}`, children: _jsx(Icon, { size: 18 }) })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-xs text-slate-500 font-medium uppercase tracking-wide", children: label }), loading ? (_jsx("div", { className: "h-7 w-20 mt-1 rounded bg-surface-border animate-pulse" })) : (_jsx("p", { className: "text-2xl font-semibold text-white mt-0.5", children: formatValue(value) })), !loading && trend && (_jsxs("p", { className: `text-xs mt-1 flex items-center gap-1 ${trend.value >= 0 ? 'text-green-400' : 'text-red-400'}`, children: [_jsx("span", { children: trend.value >= 0 ? '↑' : '↓' }), _jsxs("span", { children: [Math.abs(trend.value), "%"] }), _jsx("span", { className: "text-slate-500", children: trend.label })] })), !loading && sparkline && sparkline.length > 1 && (_jsx(Sparkline, { data: sparkline })), !loading && hint && (_jsx("p", { className: "text-xs text-slate-500 mt-1", children: hint }))] })] }));
}
