import { useRef, useState } from 'react';
import {bulkImportApi} from "../api/bulkImportApi.js";
import {cn} from "../design-system/cn.js";


const STATUS_META = {
    VALID:     { label: 'Valid',       cls: 'bg-success-100 text-success-700' },
    INVALID:   { label: 'Invalid',     cls: 'bg-danger-100 text-danger-700' },
    DUPLICATE: { label: 'Duplicat',    cls: 'bg-warning-100 text-warning-700' },
};

const ROLE_LABELS = {
    ELEV: 'Elev', PROFESOR: 'Profesor', PARINTE: 'Părinte',
    EDITOR: 'Editor', ADMIN: 'Admin',
};

export default function BulkImportModal({ onClose, onImported }) {
    const fileInputRef = useRef(null);
    const [step, setStep] = useState('upload');   // 'upload' | 'preview' | 'result'
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dragging, setDragging] = useState(false);



    const handleFile = (f) => {
        if (!f) return;
        const ext = f.name.split('.').pop().toLowerCase();
        if (!['csv', 'xlsx', 'xls'].includes(ext)) {
            setError('Fișier nesuportat. Acceptăm .csv, .xlsx, .xls.');
            return;
        }
        setError('');
        setFile(f);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
    };

    const handlePreview = async () => {
        if (!file) return;
        setLoading(true);
        setError('');
        try {
            const data = await bulkImportApi.preview(file);
            setPreview(data);
            setStep('preview');
        } catch (err) {
            setError(err.response?.data?.message || 'Eroare la previzualizare');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!file) return;
        setLoading(true);
        setError('');
        try {
            const data = await bulkImportApi.importUsers(file);
            setResult(data);
            setStep('result');
            onImported?.();
        } catch (err) {
            setError(err.response?.data?.message || 'Eroare la import');
        } finally {
            setLoading(false);
        }
    };

    const exportResultCsv = () => {
        if (!result) return;
        const header = 'email,name,role,status,parola_temp,eroare';
        const rows = result.rows.map(r =>
            [r.email, r.name ?? '', r.role, r.status, r.tempPassword ?? '', r.errorMessage ?? '']
                .map(v => `"${String(v).replace(/"/g, '""')}"`)
                .join(',')
        );
        const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'rezultat_import.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-scale-in">


                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 flex-shrink-0">
                    <div>
                        <h2 className="text-h3 font-bold text-neutral-900">Import în masă utilizatori</h2>
                        <StepIndicator step={step} />
                    </div>
                    <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-xl">✕</button>
                </div>


                <div className="flex-1 overflow-y-auto px-6 py-5">

                    {error && (
                        <div className="flex items-center gap-2 bg-danger-50 border border-danger-200
                                        text-danger-700 rounded-md px-4 py-3 text-body font-semibold mb-4">
                            ⚠️ {error}
                            <button onClick={() => setError('')} className="ml-auto text-danger-400 hover:text-danger-600">✕</button>
                        </div>
                    )}


                    {step === 'upload' && (
                        <div className="flex flex-col gap-5">
                            {/* Template download */}
                            <div className="flex items-center justify-between bg-neutral-50 rounded-lg px-4 py-3 border border-neutral-200">
                                <div>
                                    <p className="text-body font-semibold text-neutral-700">Șablon CSV</p>
                                    <p className="text-caption text-neutral-400">
                                        Descarcă fișierul șablon cu coloanele corecte: email, name, role
                                    </p>
                                </div>
                                <button
                                    onClick={() => bulkImportApi.downloadTemplate()}
                                    className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-caption
                                               font-bold text-neutral-600 hover:bg-neutral-50 transition-colors whitespace-nowrap"
                                >
                                    ⬇ Descarcă șablon
                                </button>
                            </div>


                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={handleDrop}
                                className={cn(
                                    'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
                                    dragging
                                        ? 'border-primary-400 bg-primary-50'
                                        : 'border-neutral-300 hover:border-primary-300 hover:bg-neutral-50',
                                )}
                            >
                                <div className="text-4xl mb-3">{file ? '📄' : '📂'}</div>
                                {file ? (
                                    <div>
                                        <p className="text-body font-bold text-neutral-900">{file.name}</p>
                                        <p className="text-caption text-neutral-400 mt-1">
                                            {(file.size / 1024).toFixed(1)} KB · Click pentru a schimba
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-body font-semibold text-neutral-600">
                                            Trage fișierul aici sau click pentru a selecta
                                        </p>
                                        <p className="text-caption text-neutral-400 mt-1">CSV, XLSX, XLS — max 5 MB</p>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    className="hidden"
                                    onChange={(e) => handleFile(e.target.files[0])}
                                />
                            </div>


                            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                                <p className="text-caption font-bold text-neutral-600 uppercase tracking-wide mb-2">
                                    Coloane acceptate
                                </p>
                                <div className="flex flex-col gap-1.5">
                                    {[
                                        { col: 'email', req: true,  desc: 'Adresa de email — trebuie să fie unică' },
                                        { col: 'name',  req: false, desc: 'Numele complet (opțional)' },
                                        { col: 'role',  req: true,  desc: 'ELEV / PROFESOR / PARINTE / EDITOR / ADMIN' },
                                    ].map(c => (
                                        <div key={c.col} className="flex items-baseline gap-2 text-caption">
                                            <code className="font-bold text-neutral-800 bg-neutral-200 px-1 rounded">{c.col}</code>
                                            {c.req
                                                ? <span className="text-danger-600 font-bold">obligatoriu</span>
                                                : <span className="text-neutral-400">opțional</span>}
                                            <span className="text-neutral-500">— {c.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'preview' && preview && (
                        <div className="flex flex-col gap-4">
                            <SummaryBadges
                                total={preview.totalRows}
                                valid={preview.validCount}
                                invalid={preview.invalidCount}
                                duplicate={preview.duplicateCount}
                            />
                            <PreviewTable rows={preview.rows} />
                        </div>
                    )}

                    {step === 'result' && result && (
                        <div className="flex flex-col gap-4">
                            <div className="bg-success-50 border border-success-200 rounded-xl px-5 py-4 text-center">
                                <div className="text-3xl mb-2">✅</div>
                                <p className="text-body-lg font-bold text-success-700">
                                    Import finalizat — {result.validCount} conturi create
                                </p>
                                {result.errorCount > 0 && (
                                    <p className="text-caption text-warning-600 mt-1">
                                        {result.errorCount} rânduri au eșuat, {result.duplicateCount} duplicate omise
                                    </p>
                                )}
                            </div>
                            <SummaryBadges
                                total={result.totalRows}
                                valid={result.validCount}
                                invalid={result.errorCount}
                                duplicate={result.duplicateCount}
                            />
                            <ResultTable rows={result.rows} />
                            <button
                                onClick={exportResultCsv}
                                className="self-start px-4 py-2 border border-neutral-200 rounded-lg
                                           text-caption font-bold text-neutral-600 hover:bg-neutral-50 transition-colors"
                            >
                                ⬇ Exportă rezultat CSV
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-neutral-200 flex gap-3 justify-end flex-shrink-0">
                    {step === 'upload' && (
                        <>
                            <button onClick={onClose}
                                    className="px-4 py-2 border border-neutral-200 rounded-lg text-body font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors">
                                Anulează
                            </button>
                            <button
                                onClick={handlePreview}
                                disabled={!file || loading}
                                className="px-6 py-2 bg-primary-600 text-white rounded-lg text-body font-bold hover:bg-primary-700 transition-colors disabled:opacity-60"
                            >
                                {loading ? 'Se verifică...' : 'Previzualizează →'}
                            </button>
                        </>
                    )}

                    {step === 'preview' && (
                        <>
                            <button onClick={() => setStep('upload')}
                                    className="px-4 py-2 border border-neutral-200 rounded-lg text-body font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors">
                                ← Înapoi
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={loading || preview?.validCount === 0}
                                className="px-6 py-2 bg-success-600 text-white rounded-lg text-body font-bold hover:bg-success-700 transition-colors disabled:opacity-60"
                            >
                                {loading
                                    ? 'Se importă...'
                                    : `Importă ${preview?.validCount ?? 0} conturi →`}
                            </button>
                        </>
                    )}

                    {step === 'result' && (
                        <button onClick={onClose}
                                className="px-6 py-2 bg-primary-600 text-white rounded-lg text-body font-bold hover:bg-primary-700 transition-colors">
                            Închide
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StepIndicator({ step }) {
    const steps = ['upload', 'preview', 'result'];
    const labels = { upload: 'Fișier', preview: 'Previzualizare', result: 'Rezultat' };
    const current = steps.indexOf(step);
    return (
        <div className="flex items-center gap-2 mt-1">
            {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-1">
                    <span className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-micro font-bold',
                        i <= current ? 'bg-primary-600 text-white' : 'bg-neutral-200 text-neutral-400'
                    )}>
                        {i + 1}
                    </span>
                    <span className={cn(
                        'text-caption font-semibold',
                        i === current ? 'text-primary-600' : 'text-neutral-400'
                    )}>
                        {labels[s]}
                    </span>
                    {i < steps.length - 1 && <span className="text-neutral-300 mx-1">›</span>}
                </div>
            ))}
        </div>
    );
}

function SummaryBadges({ total, valid, invalid, duplicate }) {
    return (
        <div className="grid grid-cols-4 gap-3">
            {[
                { label: 'Total',     value: total,     cls: 'bg-neutral-100 text-neutral-700' },
                { label: 'Valide',    value: valid,     cls: 'bg-success-100 text-success-700' },
                { label: 'Invalide',  value: invalid,   cls: 'bg-danger-100  text-danger-700' },
                { label: 'Duplicate', value: duplicate, cls: 'bg-warning-100 text-warning-700' },
            ].map(b => (
                <div key={b.label} className={cn('rounded-lg px-3 py-3 text-center', b.cls)}>
                    <p className="text-h3 font-bold">{b.value}</p>
                    <p className="text-caption font-semibold">{b.label}</p>
                </div>
            ))}
        </div>
    );
}

function PreviewTable({ rows }) {
    return (
        <div className="rounded-xl border border-neutral-200 overflow-hidden">
            <table className="w-full text-body">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                    {['#', 'Email', 'Nume', 'Rol', 'Status', 'Eroare'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 text-caption font-bold text-neutral-600 uppercase tracking-wide">
                            {h}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                {rows.map(r => {
                    const meta = STATUS_META[r.status] ?? STATUS_META.INVALID;
                    return (
                        <tr key={r.rowNumber} className="hover:bg-neutral-50">
                            <td className="px-3 py-2.5 text-caption text-neutral-400">{r.rowNumber}</td>
                            <td className="px-3 py-2.5 font-semibold text-neutral-900 max-w-[180px] truncate">{r.email}</td>
                            <td className="px-3 py-2.5 text-neutral-600 max-w-[140px] truncate">{r.name || '—'}</td>
                            <td className="px-3 py-2.5">
                                {r.role
                                    ? <span className="text-caption font-semibold">{ROLE_LABELS[r.role] ?? r.role}</span>
                                    : <span className="text-neutral-400">—</span>}
                            </td>
                            <td className="px-3 py-2.5">
                                    <span className={cn('px-2 py-0.5 rounded-full text-caption font-bold', meta.cls)}>
                                        {meta.label}
                                    </span>
                            </td>
                            <td className="px-3 py-2.5 text-caption text-danger-600">{r.errorMessage || '—'}</td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}

function ResultTable({ rows }) {
    const created = rows.filter(r => r.status === 'VALID');
    const failed  = rows.filter(r => r.status !== 'VALID');

    return (
        <div className="flex flex-col gap-4">
            {created.length > 0 && (
                <section>
                    <p className="text-caption font-bold text-neutral-600 uppercase tracking-wide mb-2">
                        Conturi create ({created.length})
                    </p>
                    <div className="rounded-xl border border-neutral-200 overflow-hidden">
                        <table className="w-full text-body">
                            <thead className="bg-success-50 border-b border-success-100">
                            <tr>
                                {['Email', 'Nume', 'Rol', 'Parolă temporară'].map(h => (
                                    <th key={h} className="text-left px-3 py-2.5 text-caption font-bold text-success-700 uppercase tracking-wide">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                            {created.map(r => (
                                <tr key={r.rowNumber}>
                                    <td className="px-3 py-2.5 font-semibold text-neutral-900">{r.email}</td>
                                    <td className="px-3 py-2.5 text-neutral-600">{r.name || '—'}</td>
                                    <td className="px-3 py-2.5 text-caption font-semibold">{ROLE_LABELS[r.role] ?? r.role}</td>
                                    <td className="px-3 py-2.5">
                                        <code className="bg-neutral-100 px-2 py-1 rounded text-caption font-mono font-bold text-neutral-800">
                                            {r.tempPassword}
                                        </code>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-caption text-warning-600 mt-1.5">
                        ⚠️ Parolele temporare se văd o singură dată — exportă CSV pentru a le salva.
                    </p>
                </section>
            )}

            {failed.length > 0 && (
                <section>
                    <p className="text-caption font-bold text-neutral-600 uppercase tracking-wide mb-2">
                        Eșuate / Omise ({failed.length})
                    </p>
                    <div className="rounded-xl border border-neutral-200 overflow-hidden">
                        <table className="w-full text-body">
                            <thead className="bg-danger-50 border-b border-danger-100">
                            <tr>
                                {['#', 'Email', 'Status', 'Motiv'].map(h => (
                                    <th key={h} className="text-left px-3 py-2.5 text-caption font-bold text-danger-700 uppercase tracking-wide">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                            {failed.map(r => {
                                const meta = STATUS_META[r.status] ?? STATUS_META.INVALID;
                                return (
                                    <tr key={r.rowNumber}>
                                        <td className="px-3 py-2.5 text-caption text-neutral-400">{r.rowNumber}</td>
                                        <td className="px-3 py-2.5 font-semibold text-neutral-900">{r.email || '—'}</td>
                                        <td className="px-3 py-2.5">
                                                <span className={cn('px-2 py-0.5 rounded-full text-caption font-bold', meta.cls)}>
                                                    {meta.label}
                                                </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-caption text-danger-600">{r.errorMessage || '—'}</td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
}

