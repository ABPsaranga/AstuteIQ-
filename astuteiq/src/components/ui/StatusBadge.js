import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const STYLES = {
    PASS: 'bg-green-500/15  text-green-400  border-green-500/25',
    FAIL: 'bg-red-500/15    text-red-400    border-red-500/25',
    WARNING: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
    NA: 'bg-slate-500/10  text-slate-400  border-slate-600/20',
};
const DOTS = {
    PASS: 'bg-green-400',
    FAIL: 'bg-red-400',
    WARNING: 'bg-orange-400',
    NA: 'bg-slate-500',
};
export default function StatusBadge({ status, size = 'md' }) {
    return (_jsxs("span", { className: `inline-flex items-center gap-1.5 border rounded-full font-medium ${STYLES[status]} ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`, children: [_jsx("span", { className: `w-1.5 h-1.5 rounded-full ${DOTS[status]}` }), status] }));
}
