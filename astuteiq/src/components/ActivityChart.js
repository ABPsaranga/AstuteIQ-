import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, } from 'recharts';
import { format, subDays } from 'date-fns';
// Generate last 14 days of mock data
function generateActivityData() {
    return Array.from({ length: 14 }, (_, i) => {
        const date = subDays(new Date(), 13 - i);
        return {
            date: format(date, 'dd MMM'),
            reviews: Math.floor(Math.random() * 6) + 1,
            score: 60 + Math.floor(Math.random() * 35),
        };
    });
}
const DATA = generateActivityData();
export default function ActivityChart({ height = 200 }) {
    return (_jsx(ResponsiveContainer, { width: "100%", height: height, children: _jsxs(AreaChart, { data: DATA, margin: { top: 8, right: 8, left: -20, bottom: 0 }, children: [_jsxs("defs", { children: [_jsxs("linearGradient", { id: "colorReviews", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#4a5ff7", stopOpacity: 0.3 }), _jsx("stop", { offset: "95%", stopColor: "#4a5ff7", stopOpacity: 0 })] }), _jsxs("linearGradient", { id: "colorScore", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#22c55e", stopOpacity: 0.2 }), _jsx("stop", { offset: "95%", stopColor: "#22c55e", stopOpacity: 0 })] })] }), _jsx(CartesianGrid, { stroke: "#252a38", strokeDasharray: "3 3", vertical: false }), _jsx(XAxis, { dataKey: "date", tick: { fill: '#64748b', fontSize: 11 }, axisLine: false, tickLine: false, interval: 2 }), _jsx(YAxis, { tick: { fill: '#64748b', fontSize: 11 }, axisLine: false, tickLine: false }), _jsx(Tooltip, { contentStyle: {
                        background: '#181c27',
                        border: '1px solid #252a38',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                        color: '#f1f5f9',
                    }, cursor: { stroke: '#252a38' } }), _jsx(Area, { type: "monotone", dataKey: "reviews", name: "Reviews", stroke: "#4a5ff7", strokeWidth: 2, fill: "url(#colorReviews)", dot: false }), _jsx(Area, { type: "monotone", dataKey: "score", name: "Avg Score", stroke: "#22c55e", strokeWidth: 2, fill: "url(#colorScore)", dot: false })] }) }));
}
