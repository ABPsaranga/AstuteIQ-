import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
const MOCK_NOTIFICATIONS = [
    {
        id: 'n1', type: 'success', title: 'Review complete',
        message: 'SOA_Johnson_2024.pdf scored 91%.',
        createdAt: new Date(Date.now() - 600000), read: false,
    },
    {
        id: 'n2', type: 'error', title: 'Review failed',
        message: 'SOA_Williams.pdf could not be processed.',
        createdAt: new Date(Date.now() - 3600000), read: false,
    },
    {
        id: 'n3', type: 'info', title: 'New feature',
        message: 'Enterprise batch upload is now available.',
        createdAt: new Date(Date.now() - 86400000), read: true,
    },
];
const ICONS = {
    success: _jsx(CheckCircle, { size: 15, className: "text-green-400 shrink-0 mt-0.5" }),
    error: _jsx(AlertCircle, { size: 15, className: "text-red-400 shrink-0 mt-0.5" }),
    info: _jsx(Info, { size: 15, className: "text-brand-400 shrink-0 mt-0.5" }),
};
export default function Notifications() {
    const [items, setItems] = useState(MOCK_NOTIFICATIONS);
    const dismiss = (id) => setItems((prev) => prev.filter((n) => n.id !== id));
    if (items.length === 0) {
        return (_jsx("div", { className: "text-center py-8 text-slate-500 text-sm", children: "No notifications" }));
    }
    return (_jsx("ul", { className: "space-y-2", children: items.map((n) => (_jsxs("li", { className: `flex gap-3 p-3 rounded-lg border transition-colors ${n.read
                ? 'bg-surface border-surface-border'
                : 'bg-surface-hover border-surface-border'}`, children: [ICONS[n.type], _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: `text-sm font-medium ${n.read ? 'text-slate-400' : 'text-white'}`, children: n.title }), _jsx("p", { className: "text-xs text-slate-500 mt-0.5", children: n.message }), _jsx("p", { className: "text-xs text-slate-600 mt-1", children: format(n.createdAt, 'dd MMM, h:mm a') })] }), _jsx("button", { onClick: () => dismiss(n.id), className: "text-slate-600 hover:text-slate-400 shrink-0", children: _jsx(X, { size: 13 }) })] }, n.id))) }));
}
