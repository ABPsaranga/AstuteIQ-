import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { AlertTriangle, AlertCircle, Upload, X, Play, Zap, CheckCircle, XCircle, Minus, RotateCcw, FileText, Clock, Flag, Download, ChevronDown, ChevronUp, } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import apiClient from '../lib/api';
import supabase from '../lib/supabase';
function formatBytes(bytes) {
    if (bytes < 1048576)
        return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}
const STATUS_MAP = { pass: 'PASS', fail: 'FAIL', warning: 'WARNING', na: 'NA' };
const STEPS = {
    quick: [
        'Reading all documents',
        'Checking figure consistency',
        'Running 13 key compliance checks',
        'Running 2 personalisation checks',
        'Compiling quick check report',
    ],
    full: [
        'Reading all documents',
        'Checking consistency across all figures',
        'Checking structure & personalisation (P1–P10)',
        'Running full compliance checklist (C1–C29)',
        'Compiling full report',
    ],
};
// ── readFile OUTSIDE component — prevents closure recursion ──────────────────
async function readFile(file, labelPrefix) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const id = `${file.name}_${file.lastModified}`;
    if (ext === 'pdf') {
        const buf = await file.arrayBuffer();
        const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
        return { id, name: file.name, size: file.size, type: 'pdf', content: b64, docType: 'pdf_b64', label: labelPrefix };
    }
    if (ext === 'docx' || ext === 'doc') {
        try {
            const mammoth = await import('mammoth');
            const buf = await file.arrayBuffer();
            const res = await mammoth.extractRawText({ arrayBuffer: buf });
            return { id, name: file.name, size: file.size, type: 'docx', content: res.value, docType: 'text', label: labelPrefix };
        }
        catch {
            const text = await file.text().catch(() => `[Could not read: ${file.name}]`);
            return { id, name: file.name, size: file.size, type: 'docx', content: text, docType: 'text', label: labelPrefix };
        }
    }
    const text = await file.text().catch(() => `[Could not read: ${file.name}]`);
    return { id, name: file.name, size: file.size, type: ext === 'xlsx' || ext === 'xls' ? 'xlsx' : 'other', content: text, docType: 'text', label: labelPrefix };
}
function UploadZone({ label, num, desc, formats, file, multiple, files, onDrop, onRemove }) {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, multiple: multiple ?? false,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
        },
    });
    const hasFile = multiple ? (files?.length ?? 0) > 0 : !!file;
    return (_jsxs("div", { className: `relative flex flex-col gap-3 border-2 border-dashed rounded-xl p-4 min-h-[200px] transition-all duration-150 ${hasFile
            ? 'border-[#6B2FD9] bg-[#6B2FD9]/5'
            : isDragActive
                ? 'border-[#A78BFA] bg-[#6B2FD9]/5'
                : 'border-slate-800 bg-[#0f0f1a] hover:border-[#6B2FD9]/40'}`, children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "w-5 h-5 rounded-full bg-[#6B2FD9] flex items-center justify-center text-white text-xs font-bold shrink-0", children: num }), _jsx("span", { className: `text-sm font-semibold ${hasFile ? 'text-[#A78BFA]' : 'text-slate-200'}`, children: label })] }), _jsx("p", { className: "text-xs text-slate-500", children: desc }), _jsx("p", { className: "text-xs text-slate-600 italic", children: formats }), !multiple && file && (_jsxs("div", { className: "flex items-center gap-2 bg-[#141421] border border-slate-800 rounded-lg px-3 py-2 mt-auto", children: [_jsx(FileText, { size: 13, className: "text-[#A78BFA] shrink-0" }), _jsx("span", { className: "text-xs text-slate-200 flex-1 truncate", children: file.name }), _jsx("span", { className: "text-xs text-slate-500", children: formatBytes(file.size) }), _jsx("button", { onClick: () => onRemove(), className: "text-slate-600 hover:text-[#FF6B6B] ml-1", children: _jsx(X, { size: 13 }) })] })), multiple && files && files.length > 0 && (_jsx("div", { className: "space-y-1.5 mt-1", children: files.map((f) => (_jsxs("div", { className: "flex items-center gap-2 bg-[#141421] border border-slate-800 rounded-lg px-3 py-1.5", children: [_jsx("span", { className: `text-xs font-bold px-1.5 py-0.5 rounded ${f.type === 'pdf' ? 'bg-[#FF6B6B]/10 text-[#FF6B6B]' :
                                f.type === 'xlsx' ? 'bg-[#2DD4A0]/10 text-[#2DD4A0]' :
                                    'bg-[#6B2FD9]/10 text-[#A78BFA]'}`, children: f.type === 'pdf' ? 'PDF' : f.type === 'xlsx' ? 'XLSX' : 'DOCX' }), _jsx("span", { className: "text-xs text-slate-200 flex-1 truncate", children: f.name }), _jsx("button", { onClick: () => onRemove(f.id), className: "text-slate-600 hover:text-[#FF6B6B]", children: _jsx(X, { size: 12 }) })] }, f.id))) })), _jsxs("div", { ...getRootProps(), className: "flex-1 flex flex-col items-center justify-center gap-2 cursor-pointer rounded-lg p-3 min-h-[80px] hover:bg-[#6B2FD9]/5 transition-colors", children: [_jsx("input", { ...getInputProps() }), _jsx(Upload, { size: 20, className: isDragActive ? 'text-[#A78BFA]' : 'text-slate-600' }), _jsx("p", { className: "text-xs text-slate-500 text-center", children: isDragActive ? 'Drop here…' : hasFile && multiple ? 'Drop more or click to add' : hasFile ? 'Drop replacement file' : 'Click or drag to upload' })] }), multiple && _jsxs("p", { className: "text-xs text-slate-600 text-right", children: [files?.length ?? 0, " / 10 uploaded"] })] }));
}
function OverridePanel({ check, existing, onSave, onRemove, onClose }) {
    const [status, setStatus] = useState(existing?.new_status ?? check.status.toUpperCase());
    const [comment, setComment] = useState(existing?.comment ?? '');
    const STATUSES = ['PASS', 'WARNING', 'FAIL', 'NA'];
    return (_jsxs("div", { className: "mt-3 p-4 rounded-xl border border-[#E8B84B]/30 bg-[#E8B84B]/5 space-y-3 animate-slide-up", children: [_jsx("p", { className: "text-xs font-semibold text-[#E8B84B] uppercase tracking-wide", children: "Override finding" }), _jsx("div", { className: "flex flex-wrap gap-2", children: STATUSES.map((s) => (_jsx("button", { onClick: () => setStatus(s), className: `text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${status === s
                        ? 'border-[#6B2FD9] bg-[#6B2FD9]/20 text-[#A78BFA]'
                        : 'border-slate-700 text-slate-500 hover:border-slate-500'}`, children: s }, s))) }), _jsx("textarea", { className: "input resize-none text-xs", rows: 2, placeholder: "Reason for override (required)\u2026", value: comment, onChange: (e) => setComment(e.target.value) }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => { if (comment.trim())
                            onSave(status, comment); }, disabled: !comment.trim(), className: "btn-primary text-xs py-1.5 px-3", children: "Save override" }), existing && (_jsx("button", { onClick: onRemove, className: "btn-secondary text-xs py-1.5 px-3 text-[#FF6B6B]", children: "Remove flag" })), _jsx("button", { onClick: onClose, className: "btn-secondary text-xs py-1.5 px-3 ml-auto", children: "Cancel" })] })] }));
}
function CheckRow({ check, reviewId, feedback, onFeedbackSaved, onFeedbackRemoved }) {
    const [showOverride, setShowOverride] = useState(false);
    const [, setSaving] = useState(false);
    const isFlagged = !!feedback;
    async function handleSave(newStatus, comment) {
        setSaving(true);
        try {
            const res = await apiClient.post('/feedback', {
                review_id: reviewId, check_id: check.id, check_label: check.label,
                original_status: check.status.toUpperCase(), new_status: newStatus, comment,
            });
            onFeedbackSaved(res.data);
            setShowOverride(false);
        }
        catch {
            onFeedbackSaved({
                id: `local_${Date.now()}`, review_id: reviewId, check_id: check.id,
                check_label: check.label, original_status: check.status.toUpperCase(),
                new_status: newStatus, comment, user_id: 'local', created_at: new Date().toISOString(),
            });
            setShowOverride(false);
        }
        finally {
            setSaving(false);
        }
    }
    async function handleRemove() {
        try {
            await apiClient.delete(`/feedback/${reviewId}/${check.id}`);
        }
        catch { /* ignore */ }
        onFeedbackRemoved(check.id);
        setShowOverride(false);
    }
    const displayStatus = feedback ? feedback.new_status.toLowerCase() : check.status;
    return (_jsx("div", { className: `py-3 border-b border-slate-800/60 last:border-0 ${isFlagged ? 'border-l-2 border-l-[#E8B84B]/60 pl-3 -ml-3' :
            check.status === 'fail' ? 'border-l-2 border-l-[#FF6B6B]/40 pl-3 -ml-3' :
                check.status === 'warning' ? 'border-l-2 border-l-[#FFB347]/40 pl-3 -ml-3' : ''}`, children: _jsxs("div", { className: "flex gap-3 items-start", children: [_jsxs("div", { className: "shrink-0 mt-0.5", children: [displayStatus === 'pass' && _jsx(CheckCircle, { size: 15, className: "text-[#2DD4A0]" }), displayStatus === 'fail' && _jsx(XCircle, { size: 15, className: "text-[#FF6B6B]" }), displayStatus === 'warning' && _jsx(AlertTriangle, { size: 14, className: "text-[#FFB347]" }), displayStatus === 'na' && _jsx(Minus, { size: 15, className: "text-slate-600" })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap mb-1", children: [_jsx("span", { className: "text-xs font-mono text-slate-500", children: check.id }), _jsx(StatusBadge, { status: STATUS_MAP[displayStatus] ?? 'NA', size: "sm" }), isFlagged && (_jsx("span", { className: "text-xs px-2 py-0.5 rounded-full bg-[#E8B84B]/15 text-[#E8B84B] border border-[#E8B84B]/25 font-medium", children: "\u2691 Flagged" })), _jsx("span", { className: "text-sm font-medium text-slate-200", children: check.label })] }), _jsx("p", { className: "text-xs text-slate-400 leading-relaxed", children: check.note }), feedback && (_jsxs("div", { className: "mt-2 p-2.5 rounded-lg bg-[#E8B84B]/10 border border-[#E8B84B]/20 text-xs text-[#E8B84B]/90", children: [_jsx("span", { className: "font-semibold text-[#E8B84B]", children: "Reviewer override: " }), feedback.original_status, " \u2192 ", feedback.new_status, " \u00B7 ", feedback.comment] })), showOverride && (_jsx(OverridePanel, { check: check, existing: feedback, onSave: handleSave, onRemove: handleRemove, onClose: () => setShowOverride(false) })), !showOverride && (_jsxs("button", { onClick: () => setShowOverride(true), className: `mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors ${isFlagged
                                ? 'border-[#E8B84B]/40 bg-[#E8B84B]/10 text-[#E8B84B] hover:bg-[#E8B84B]/20'
                                : 'border-slate-700 text-slate-500 hover:text-[#E8B84B] hover:border-[#E8B84B]/40'}`, children: [_jsx(Flag, { size: 11 }), isFlagged ? 'Edit override' : 'Mark as incorrect'] }))] })] }) }));
}
// ── Word Export ───────────────────────────────────────────────────────────────
async function exportWordReport(result, feedbackMap) {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, HeadingLevel } = await import('docx');
    const STATUS_COLOR = {
        PASS: '2DD4A0', WARNING: 'FFB347', FAIL: 'FF6B6B', NA: '6b7280',
    };
    const getFinalStatus = (c) => feedbackMap[c.id] ? feedbackMap[c.id].new_status : c.status.toUpperCase();
    const grouped = {
        compliance: result.checks.filter(c => c.area === 'compliance'),
        structure: result.checks.filter(c => c.area === 'structure'),
        consistency: result.checks.filter(c => c.area === 'consistency'),
        personalisation: result.checks.filter(c => c.area === 'personalisation'),
    };
    function section(title, checks) {
        if (!checks.length)
            return [];
        return [
            new Paragraph({ text: title, heading: HeadingLevel.HEADING_2 }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({ children: ['Check', 'Status', 'Notes'].map(h => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] })) }),
                    ...checks.map(c => {
                        const fs = getFinalStatus(c);
                        const fb = feedbackMap[c.id];
                        const note = fb ? `${c.note}\n\n[OVERRIDDEN: ${fb.original_status} → ${fb.new_status}]\n${fb.comment}` : c.note;
                        return new TableRow({ children: [
                                new TableCell({ children: [new Paragraph(c.label)] }),
                                new TableCell({
                                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: fs, bold: true, color: 'FFFFFF' })] })],
                                    shading: { fill: STATUS_COLOR[fs] || '6b7280' },
                                }),
                                new TableCell({ children: [new Paragraph(note)] }),
                            ] });
                    }),
                ],
            }),
        ];
    }
    const doc = new Document({ sections: [{ children: [
                    new Paragraph({ text: 'AstuteIQ — SOA Compliance Report', heading: HeadingLevel.TITLE }),
                    new Paragraph({ text: 'ASIC RG175 · Corporations Act s961B · FASEA Code of Ethics' }),
                    new Paragraph({ text: '' }),
                    new Paragraph({ text: `Client: ${result.client_name}` }),
                    new Paragraph({ text: `Adviser: ${result.adviser_name}` }),
                    new Paragraph({ text: `Practice: ${result.practice_name}` }),
                    new Paragraph({ text: `Date: ${result.date}` }),
                    new Paragraph({ text: `Review mode: ${result.mode === 'quick' ? 'Quick Check' : 'Full Review'}` }),
                    new Paragraph({ text: '' }),
                    new Paragraph({ text: 'Executive Summary', heading: HeadingLevel.HEADING_1 }),
                    new Paragraph({ text: result.summary }),
                    new Paragraph({ text: '' }),
                    new Paragraph({ text: `Risk Rating: ${result.risk_level}` }),
                    new Paragraph({ text: '' }),
                    new Paragraph({ text: 'Detailed Findings', heading: HeadingLevel.HEADING_1 }),
                    ...section('Compliance (C1–C29)', grouped.compliance),
                    ...section('Structure', grouped.structure),
                    ...section('Consistency', grouped.consistency),
                    ...section('Personalisation (P1–P10)', grouped.personalisation),
                    new Paragraph({ text: '' }),
                    new Paragraph({ text: 'AI-assisted review. All findings must be independently verified by a qualified paraplanner before SOA submission.' }),
                ] }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AstuteIQ_${result.client_name.replace(/\s+/g, '_')}_${result.date}.docx`;
    a.click();
    URL.revokeObjectURL(url);
}
// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SOAAnalysisPage() {
    const [soaDoc, setSoaDoc] = useState(null);
    const [refDoc, setRefDoc] = useState(null);
    const [suppDocs, setSuppDocs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('full');
    const [step, setStep] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [feedbackMap, setFeedbackMap] = useState({});
    const [exporting, setExporting] = useState(false);
    const [collapsedAreas, setCollapsedAreas] = useState({});
    const [streamText, setStreamText] = useState('');
    const timerRef = useRef(null);
    const reviewIdRef = useRef(`soa_${Date.now()}`);
    useEffect(() => {
        if (!result)
            return;
        apiClient.get(`/feedback/${reviewIdRef.current}`)
            .then((res) => {
            const map = {};
            res.data.forEach((fb) => { map[fb.check_id] = fb; });
            setFeedbackMap(map);
        }).catch(() => { });
    }, [result]);
    const handleSoaDrop = useCallback(async (fs) => { if (fs[0])
        setSoaDoc(await readFile(fs[0], 'NEW SOA BEING REVIEWED')); }, []);
    const handleRefDrop = useCallback(async (fs) => { if (fs[0])
        setRefDoc(await readFile(fs[0], 'REFERENCE SOA')); }, []);
    const handleSuppDrop = useCallback(async (fs) => {
        const existing = suppDocs.length;
        const docs = await Promise.all(fs.slice(0, 10 - existing).map((f, i) => readFile(f, `SUPPORTING DOCUMENT ${existing + i + 1}: ${f.name}`)));
        setSuppDocs((p) => [...p, ...docs]);
    }, [suppDocs]);
    async function runReview(m) {
        if (!soaDoc) {
            setError('Please upload the SOA to review.');
            return;
        }
        setMode(m);
        reviewIdRef.current = `soa_${Date.now()}`;
        setLoading(true);
        setError(null);
        setResult(null);
        setFeedbackMap({});
        setStep(1);
        setElapsed(0);
        setStreamText('');
        timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
        try {
            const documents = [soaDoc, ...(refDoc ? [refDoc] : []), ...suppDocs]
                .map((d) => ({ type: d.docType, label: d.label, content: d.content }));
            setStep(2);
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token ?? '';
            const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'import.meta.env.VITE_API_URL';
            const response = await fetch(`${BASE_URL}/api/review/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ mode: m, documents }),
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.detail ?? `Server error ${response.status}`);
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            setStep(3);
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';
                for (const line of lines) {
                    if (!line.startsWith('data: '))
                        continue;
                    const payload = JSON.parse(line.slice(6));
                    if (payload.error)
                        throw new Error(payload.error);
                    if (payload.chunk)
                        setStreamText((prev) => prev + payload.chunk);
                    if (payload.done && payload.result) {
                        setStep(5);
                        setResult(payload.result);
                        setStreamText('');
                    }
                }
            }
        }
        catch (err) {
            setError(err?.message ?? 'Review failed.');
        }
        finally {
            if (timerRef.current)
                clearInterval(timerRef.current);
            setLoading(false);
            setStep(0);
        }
    }
    function reset() {
        setSoaDoc(null);
        setRefDoc(null);
        setSuppDocs([]);
        setResult(null);
        setError(null);
        setStep(0);
        setFeedbackMap({});
        setStreamText('');
        reviewIdRef.current = `soa_${Date.now()}`;
    }
    async function handleExport() {
        if (!result)
            return;
        setExporting(true);
        try {
            await exportWordReport(result, feedbackMap);
        }
        catch (e) {
            console.error('Export failed:', e);
        }
        finally {
            setExporting(false);
        }
    }
    const counts = result?.checks.reduce((acc, c) => { acc[c.status] = (acc[c.status] ?? 0) + 1; return acc; }, {});
    const flagCount = Object.keys(feedbackMap).length;
    const riskColor = result?.risk_level === 'HIGH'
        ? 'text-[#FF6B6B] bg-[#FF6B6B]/10 border-[#FF6B6B]/25'
        : result?.risk_level === 'MEDIUM'
            ? 'text-[#FFB347] bg-[#FFB347]/10 border-[#FFB347]/25'
            : 'text-[#2DD4A0] bg-[#2DD4A0]/10 border-[#2DD4A0]/25';
    const AREA_LABELS = {
        consistency: 'Consistency', structure: 'Structure',
        personalisation: 'Personalisation', compliance: 'Compliance',
    };
    const groupedChecks = result
        ? ['consistency', 'structure', 'personalisation', 'compliance']
            .map((area) => ({ area, items: result.checks.filter((c) => c.area === area) }))
            .filter((g) => g.items.length > 0)
        : [];
    const activeSteps = STEPS[loading ? mode : 'full'];
    return (_jsxs("div", { className: "space-y-6 animate-fade-in max-w-5xl", children: [_jsxs("div", { children: [_jsx("h1", { className: "page-header", children: "SOA Analysis" }), _jsx("p", { className: "page-sub", children: "AI-powered review against ASIC RG175 \u00B7 Corporations Act s961B \u00B7 FASEA Code of Ethics." })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex gap-3 items-start p-3 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 text-sm text-[#FF6B6B]/80", children: [_jsx(AlertCircle, { size: 16, className: "shrink-0 mt-0.5 text-[#FF6B6B]" }), _jsxs("div", { children: [_jsx("strong", { className: "block text-[#FF6B6B] mb-0.5", children: "What this tool does not check" }), "Cannot verify WealthSolver modelling, APIR codes, fee rate calculations, Xtools+ projections, or data in Xplan or Midwinter."] })] }), _jsxs("div", { className: "flex gap-3 items-start p-3 rounded-xl bg-[#FFB347]/10 border border-[#FFB347]/20 text-sm text-[#FFB347]/80", children: [_jsx(AlertTriangle, { size: 16, className: "shrink-0 mt-0.5 text-[#FFB347]" }), _jsxs("div", { children: [_jsx("strong", { className: "block text-[#FFB347] mb-0.5", children: "AI-assisted review \u2014 human sign-off required" }), "All outputs must be independently verified by a qualified paraplanner before the SOA is submitted."] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsx(UploadZone, { num: 1, label: "New SOA *", desc: "The Statement of Advice being reviewed", formats: "Word (.docx) or PDF (.pdf)", file: soaDoc, onDrop: handleSoaDrop, onRemove: () => setSoaDoc(null) }), _jsx(UploadZone, { num: 2, label: "Reference SOA", desc: "A sample or approved SOA to compare structure against", formats: "Word (.docx) or PDF (.pdf)", file: refDoc, onDrop: handleRefDrop, onRemove: () => setRefDoc(null) }), _jsx(UploadZone, { num: 3, label: "Supporting Documents", desc: "Request form, fact find, WealthSolver, insurance quotes, fee comparison, CGT workings, file notes", formats: "Word, Excel (.xlsx) or PDF \u2014 up to 10 files", multiple: true, files: suppDocs, file: null, onDrop: handleSuppDrop, onRemove: (id) => setSuppDocs((p) => p.filter((d) => d.id !== id)) })] }), !result && (_jsxs("div", { className: "card space-y-4", children: [error && (_jsxs("div", { className: "flex gap-2 items-start p-3 rounded-lg bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 text-sm text-[#FF6B6B]", children: [_jsx(AlertCircle, { size: 14, className: "shrink-0 mt-0.5" }), error] })), !loading ? (_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("button", { onClick: () => runReview('quick'), disabled: !soaDoc, className: "relative flex flex-col gap-2 p-5 rounded-xl border-2 border-[#6B2FD9]/40 bg-[#6B2FD9]/5 hover:bg-[#6B2FD9]/10 hover:border-[#6B2FD9] text-left transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Zap, { size: 16, className: "text-[#A78BFA]" }), _jsx("span", { className: "text-sm font-semibold text-white", children: "Quick Check" }), _jsx("span", { className: "ml-auto font-mono text-xs text-slate-500", children: "~40s" })] }), _jsxs("ul", { className: "space-y-0.5 text-xs text-slate-400", children: [_jsx("li", { children: "\u00B7 Consistency check across all figures" }), _jsx("li", { children: "\u00B7 13 key compliance items" }), _jsx("li", { children: "\u00B7 2 personalisation checks" }), _jsx("li", { children: "\u00B7 FAILs and WARNINGs only" }), _jsx("li", { children: "\u00B7 Max 4,000 output tokens" })] })] }), _jsxs("button", { onClick: () => runReview('full'), disabled: !soaDoc, className: "relative flex flex-col gap-2 p-5 rounded-xl border-2 border-[#6B2FD9] bg-[#6B2FD9]/10 hover:bg-[#6B2FD9]/15 text-left transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Play, { size: 16, className: "text-[#A78BFA]" }), _jsx("span", { className: "text-sm font-semibold text-white", children: "Full Review" }), _jsx("span", { className: "ml-auto font-mono text-xs text-slate-500", children: "~90s" })] }), _jsxs("ul", { className: "space-y-0.5 text-xs text-slate-400", children: [_jsx("li", { children: "\u00B7 All four areas (C, P, S, X)" }), _jsx("li", { children: "\u00B7 All 39+ checks" }), _jsx("li", { children: "\u00B7 Full PASS confirmations with page refs" }), _jsx("li", { children: "\u00B7 All findings returned" }), _jsx("li", { children: "\u00B7 Max 10,000 output tokens" })] }), _jsx("span", { className: "absolute top-4 right-4 text-xs px-2 py-0.5 rounded-full bg-[#6B2FD9]/30 text-[#A78BFA] border border-[#6B2FD9]/40 font-medium", children: "Recommended" })] })] })) : (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-400", children: [_jsx("div", { className: "w-4 h-4 border-2 border-[#6B2FD9] border-t-transparent rounded-full animate-spin shrink-0" }), _jsx("span", { children: activeSteps[(step - 1) || 0] }), elapsed > 0 && (_jsxs("span", { className: "ml-auto font-mono text-xs text-slate-600", children: [elapsed, "s / ", mode === 'quick' ? '~40s' : '~90s'] }))] }), _jsx("div", { className: "space-y-2", children: activeSteps.map((s, i) => {
                                    const done = i + 1 < step;
                                    const active = i + 1 === step;
                                    return (_jsxs("div", { className: `flex items-center gap-2 text-xs ${done ? 'text-[#2DD4A0]' : active ? 'text-[#A78BFA] font-medium' : 'text-slate-600'}`, children: [done ? _jsx(CheckCircle, { size: 13 }) : active ? _jsx(Clock, { size: 13, className: "animate-pulse" }) : _jsx(Minus, { size: 13 }), s] }, s));
                                }) }), streamText && (_jsxs("div", { className: "relative mt-2", children: [_jsxs("div", { className: "absolute top-2 right-2 flex items-center gap-1.5 text-xs text-[#A78BFA]", children: [_jsx("span", { className: "w-1.5 h-1.5 bg-[#6B2FD9] rounded-full animate-pulse" }), " Live"] }), _jsx("pre", { className: "bg-[#0B0B14] border border-slate-800 rounded-xl p-4 text-xs text-slate-400 font-mono overflow-auto max-h-48 whitespace-pre-wrap", children: streamText })] }))] }))] })), result && (_jsxs("div", { className: "space-y-5 animate-slide-up", children: [_jsxs("div", { className: "card space-y-4", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-bold text-white", style: { fontFamily: "'DM Serif Display', serif" }, children: result.client_name || 'Client' }), _jsxs("p", { className: "text-xs text-slate-500 mt-0.5", children: [result.advice_type && _jsxs("span", { children: [result.advice_type, " \u00B7 "] }), result.adviser_name && _jsxs("span", { children: [result.adviser_name, " \u00B7 "] }), result.practice_name && _jsxs("span", { children: [result.practice_name, " \u00B7 "] }), result.date] })] }), _jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsxs("span", { className: `text-xs font-bold px-3 py-1 rounded-full border ${riskColor}`, children: [result.risk_level, " RISK"] }), _jsx("span", { className: "text-xs text-slate-500 border border-slate-700 px-2 py-1 rounded-full", children: result.mode === 'quick' ? 'Quick Check' : 'Full Review' }), flagCount > 0 && (_jsxs("span", { className: "text-xs px-2 py-1 rounded-full bg-[#E8B84B]/15 text-[#E8B84B] border border-[#E8B84B]/25", children: ["\u2691 ", flagCount, " override", flagCount !== 1 ? 's' : ''] }))] })] }), counts && (_jsx("div", { className: "grid grid-cols-4 gap-2", children: [
                                    ['pass', 'PASS', 'bg-[#2DD4A0]/10 border-[#2DD4A0]/20 text-[#2DD4A0]'],
                                    ['warning', 'WARNING', 'bg-[#FFB347]/10 border-[#FFB347]/20 text-[#FFB347]'],
                                    ['fail', 'FAIL', 'bg-[#FF6B6B]/10 border-[#FF6B6B]/20 text-[#FF6B6B]'],
                                    ['na', 'N/A', 'bg-slate-800/40 border-slate-700 text-slate-400'],
                                ].map(([k, lbl, cls]) => (_jsxs("div", { className: `border rounded-xl p-3 text-center ${cls}`, children: [_jsx("p", { className: "text-2xl font-bold font-mono", children: counts[k] ?? 0 }), _jsx("p", { className: "text-xs font-semibold uppercase tracking-wide mt-0.5", children: lbl })] }, k))) })), _jsx("div", { className: "border-l-2 border-[#6B2FD9]/60 pl-4 text-sm text-slate-400 leading-relaxed whitespace-pre-line", children: result.summary }), result.docs_reviewed?.length > 0 && (_jsxs("p", { className: "text-xs text-slate-600", children: [_jsx("span", { className: "font-medium text-slate-500", children: "Documents reviewed: " }), result.docs_reviewed.join(' · ')] })), _jsxs("div", { className: "flex gap-2 flex-wrap", children: [_jsxs("button", { onClick: reset, className: "btn-secondary text-sm", children: [_jsx(RotateCcw, { size: 13 }), "New review"] }), _jsxs("button", { onClick: handleExport, disabled: exporting, className: "btn-primary text-sm", children: [_jsx(Download, { size: 13 }), exporting ? 'Generating…' : 'Export Word report'] })] })] }), groupedChecks.map(({ area, items }) => {
                        const areaFlagCount = items.filter((c) => feedbackMap[c.id]).length;
                        const failCount = items.filter(c => c.status === 'fail').length;
                        const warnCount = items.filter(c => c.status === 'warning').length;
                        const isCollapsed = collapsedAreas[area];
                        return (_jsxs("div", { className: "card space-y-0", children: [_jsxs("button", { onClick: () => setCollapsedAreas((p) => ({ ...p, [area]: !p[area] })), className: "w-full flex items-center justify-between pb-3 border-b border-slate-800", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-widest text-slate-400", children: AREA_LABELS[area] }), _jsxs("span", { className: "text-xs text-slate-600", children: ["(", items.length, " checks)"] }), failCount > 0 && (_jsxs("span", { className: "text-xs px-1.5 py-0.5 rounded bg-[#FF6B6B]/15 text-[#FF6B6B]", children: [failCount, " fail"] })), warnCount > 0 && (_jsxs("span", { className: "text-xs px-1.5 py-0.5 rounded bg-[#FFB347]/15 text-[#FFB347]", children: [warnCount, " warn"] })), areaFlagCount > 0 && (_jsxs("span", { className: "text-xs px-1.5 py-0.5 rounded bg-[#E8B84B]/15 text-[#E8B84B]", children: ["\u2691 ", areaFlagCount] }))] }), isCollapsed
                                            ? _jsx(ChevronDown, { size: 14, className: "text-slate-500" })
                                            : _jsx(ChevronUp, { size: 14, className: "text-slate-500" })] }), !isCollapsed && (_jsx("div", { className: "pt-2", children: items.map((c) => (_jsx(CheckRow, { check: c, reviewId: reviewIdRef.current, feedback: feedbackMap[c.id], onFeedbackSaved: (fb) => setFeedbackMap((prev) => ({ ...prev, [c.id]: fb })), onFeedbackRemoved: (id) => setFeedbackMap((prev) => { const n = { ...prev }; delete n[id]; return n; }) }, c.id))) }))] }, area));
                    }), _jsxs("p", { className: "text-xs text-slate-600 text-center pb-4", children: ["Generated by AstuteIQ \u00B7 Astute Business Partners \u00B7 For internal use only.", flagCount > 0 && ` · ${flagCount} finding${flagCount !== 1 ? 's' : ''} flagged by reviewer.`] })] }))] }));
}
