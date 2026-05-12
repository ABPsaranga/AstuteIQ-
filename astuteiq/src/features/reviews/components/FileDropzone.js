import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText } from 'lucide-react';
import { useReviewStore } from '../../../store/reviewStore';
import toast from 'react-hot-toast';
const ACCEPTED_TYPES = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/msword': ['.doc'],
};
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB
function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1048576)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}
export default function FileDropzone() {
    const { files, addFiles, removeFile } = useReviewStore();
    const onDrop = useCallback((accepted, rejected) => {
        rejected.forEach(({ file, errors }) => {
            toast.error(`${file.name}: ${errors[0]?.message ?? 'Rejected'}`);
        });
        const mapped = accepted.map((f) => ({
            id: `${f.name}_${f.lastModified}`,
            file: f,
            name: f.name,
            size: f.size,
            mimeType: f.type,
            status: 'pending',
            progress: 0,
        }));
        addFiles(mapped);
    }, [addFiles]);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: ACCEPTED_TYPES,
        maxSize: MAX_SIZE,
    });
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { ...getRootProps(), className: `border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors duration-200 ${isDragActive
                    ? 'border-brand-500 bg-brand-500/5'
                    : 'border-surface-border hover:border-brand-500/50 hover:bg-surface-hover'}`, children: [_jsx("input", { ...getInputProps() }), _jsx(Upload, { size: 32, className: `mx-auto mb-3 ${isDragActive ? 'text-brand-400' : 'text-slate-600'}` }), isDragActive ? (_jsx("p", { className: "text-brand-400 font-medium", children: "Drop files here\u2026" })) : (_jsxs(_Fragment, { children: [_jsxs("p", { className: "text-slate-300 font-medium", children: ["Drag & drop files, or", ' ', _jsx("span", { className: "text-brand-400 underline underline-offset-2", children: "browse" })] }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "PDF or DOCX \u00B7 Max 20 MB per file" })] }))] }), files.length > 0 && (_jsx("ul", { className: "space-y-2", children: files.map((f) => (_jsxs("li", { className: "flex items-center gap-3 bg-surface-hover border border-surface-border rounded-lg px-4 py-3", children: [_jsx(FileText, { size: 16, className: "text-brand-400 shrink-0" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm text-slate-200 truncate", children: f.name }), _jsx("p", { className: "text-xs text-slate-500", children: formatBytes(f.size) }), f.status === 'uploading' && (_jsx("div", { className: "h-1 bg-surface-border rounded mt-1.5", children: _jsx("div", { className: "h-full bg-brand-500 rounded transition-all", style: { width: `${f.progress}%` } }) }))] }), _jsx("button", { onClick: () => removeFile(f.id), className: "text-slate-600 hover:text-red-400 transition-colors", children: _jsx(X, { size: 15 }) })] }, f.id))) }))] }));
}
