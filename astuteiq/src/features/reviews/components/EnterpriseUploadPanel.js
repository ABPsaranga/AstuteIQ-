import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Layers, Play, Trash2 } from 'lucide-react';
import FileDropzone from './FileDropzone';
import { useReviewStore } from '../../../store/reviewStore';
import { useRunReview } from '../../../features/reviews/hooks';
import ReviewProgress from '../../../components/ReviewProgress';
import toast from 'react-hot-toast';
export default function EnterpriseUploadPanel() {
    const { files, clearFiles, loading } = useReviewStore();
    const { run } = useRunReview();
    const [batchName, setBatchName] = useState('');
    async function handleBatchRun() {
        if (files.length === 0) {
            toast.error('Add at least one file.');
            return;
        }
        await run([], 'full');
    }
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { children: [_jsxs("label", { className: "label flex items-center gap-1.5", children: [_jsx(Layers, { size: 13 }), "Batch name ", _jsx("span", { className: "text-slate-600 font-normal", children: "(optional)" })] }), _jsx("input", { className: "input", placeholder: "e.g. Q1 2025 Annual Reviews", value: batchName, onChange: (e) => setBatchName(e.target.value) })] }), _jsx(FileDropzone, {}), loading ? (_jsx(ReviewProgress, {})) : (_jsxs("div", { className: "flex items-center justify-between pt-2", children: [_jsxs("p", { className: "text-sm text-slate-500", children: [files.length, " file", files.length !== 1 ? 's' : '', " queued"] }), _jsxs("div", { className: "flex gap-2", children: [files.length > 0 && (_jsxs("button", { onClick: clearFiles, className: "btn-secondary", children: [_jsx(Trash2, { size: 14 }), "Clear"] })), _jsxs("button", { onClick: handleBatchRun, disabled: files.length === 0, className: "btn-primary", children: [_jsx(Play, { size: 14 }), "Run batch review"] })] })] }))] }));
}
