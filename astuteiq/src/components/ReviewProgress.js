import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { useReviewStore } from '../store/reviewStore';
const STEPS = [
    'Uploading documents',
    'Extracting text',
    'Running AI analysis',
    'Generating findings',
    'Finalising report',
];
function stepFromProgress(progress) {
    if (progress < 20)
        return 0;
    if (progress < 40)
        return 1;
    if (progress < 60)
        return 2;
    if (progress < 80)
        return 3;
    if (progress < 100)
        return 4;
    return 5;
}
export default function ReviewProgress() {
    const { progress, loading } = useReviewStore();
    const currentStep = stepFromProgress(progress);
    return (_jsxs("div", { className: "card animate-fade-in space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-base font-semibold text-white", children: "Processing your document\u2026" }), _jsx("p", { className: "text-sm text-slate-400 mt-0.5", children: "This takes 20\u201360 seconds depending on document length." })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-xs text-slate-500 mb-1.5", children: [_jsx("span", { children: "Progress" }), _jsxs("span", { children: [progress, "%"] })] }), _jsx("div", { className: "h-2 bg-surface-border rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-brand-500 rounded-full transition-all duration-500", style: { width: `${progress}%` } }) })] }), _jsx("ul", { className: "space-y-3", children: STEPS.map((step, i) => {
                    const done = i < currentStep;
                    const active = i === currentStep && loading;
                    const pending = i > currentStep;
                    return (_jsxs("li", { className: "flex items-center gap-3", children: [done ? (_jsx(CheckCircle, { size: 16, className: "text-green-500 shrink-0" })) : active ? (_jsx(Loader2, { size: 16, className: "text-brand-400 animate-spin shrink-0" })) : (_jsx(Circle, { size: 16, className: "text-slate-600 shrink-0" })), _jsx("span", { className: `text-sm ${done ? 'text-slate-400 line-through' :
                                    active ? 'text-white font-medium' :
                                        pending ? 'text-slate-600' : ''}`, children: step })] }, step));
                }) })] }));
}
