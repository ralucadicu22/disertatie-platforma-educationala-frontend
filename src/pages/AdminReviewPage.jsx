import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { cn } from '../design-system/cn';
import FindAndSelectPlayer from '../components/player/FindAndSelectPlayer';
import DragAndDropPlayer from '../components/player/DragAndDropPlayer';

export default function AdminReviewPage() {
    const navigate = useNavigate();
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actioningId, setActioningId] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectNote, setRejectNote] = useState('');
    const [previewVersion, setPreviewVersion] = useState(null);

    const loadPending = () => {
        setLoading(true);
        api.get('/exercises/versions/pending-review')
            .then(res => setVersions(res.data))
            .catch(err => setError(err.response?.data?.message || 'Eroare la încărcare'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadPending(); }, []);

    const parseMeta = (cfg) => { try { return JSON.parse(cfg).meta || {}; } catch { return {}; } };
    const parseConfig = (cfg) => { try { return JSON.parse(cfg); } catch { return null; } };

    const handleApprove = async (id) => {
        setActioningId(id);
        try {
            await api.post(`/exercises/versions/${id}/approve`, {});
            setVersions(prev => prev.filter(v => v.id !== id));
            if (previewVersion?.id === id) setPreviewVersion(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Eroare la aprobare');
        } finally { setActioningId(null); }
    };

    const confirmReject = async (id) => {
        if (!rejectNote.trim()) { setError('Motivul respingerii este obligatoriu'); return; }
        setActioningId(id);
        try {
            await api.post(`/exercises/versions/${id}/reject`, { reviewNote: rejectNote.trim() });
            setVersions(prev => prev.filter(v => v.id !== id));
            setRejectingId(null);
            setRejectNote('');
            if (previewVersion?.id === id) setPreviewVersion(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Eroare la respingere');
        } finally { setActioningId(null); }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate(-1)} className="text-body font-semibold text-neutral-500 hover:text-neutral-800 transition-colors">
                    ← Înapoi
                </button>
                <h1 className="text-h2 font-bold text-neutral-900">Exerciții în review</h1>
            </div>

            {error && (
                <div className="flex items-center gap-2 bg-danger-50 border border-danger-200 text-danger-700 rounded-md px-4 py-3 text-body font-semibold mb-4">
                    ⚠️ {error}
                    <button onClick={() => setError('')} className="ml-auto">✕</button>
                </div>
            )}

            {versions.length === 0 ? (
                <div className="bg-white rounded-xl border-2 border-dashed border-neutral-200 p-12 text-center">
                    <div className="text-4xl mb-3">✅</div>
                    <p className="text-body text-neutral-500">Nu există versiuni în așteptare.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {versions.map(v => {
                        const meta = parseMeta(v.config);
                        const config = parseConfig(v.config);
                        const acting = actioningId === v.id;
                        const rejecting = rejectingId === v.id;
                        const isPreviewing = previewVersion?.id === v.id;

                        return (
                            <div key={v.id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="text-body-lg font-bold text-neutral-900 mb-0.5">
                                                {meta.name || `Exercițiu #${v.exerciseId}`}
                                            </p>
                                            <p className="text-caption text-neutral-400">
                                                {meta.type || 'CUSTOM'} · versiunea {v.versionNumber}
                                            </p>
                                        </div>
                                        <span className="px-2.5 py-1 bg-warning-100 text-warning-700 rounded-full text-micro font-bold flex-shrink-0">
                                            PENDING REVIEW
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-3 mb-4">
                                        <div className="flex items-center gap-1.5 text-caption text-neutral-500">
                                            <span>👤</span>
                                            <span>Creat de <strong>{v.createdByName || 'necunoscut'}</strong></span>
                                        </div>
                                        {v.createdAt && (
                                            <div className="flex items-center gap-1.5 text-caption text-neutral-500">
                                                <span>📅</span>
                                                <span>{new Date(v.createdAt).toLocaleString('ro-RO')}</span>
                                            </div>
                                        )}
                                        {meta.type && (
                                            <div className="flex items-center gap-1.5 text-caption text-neutral-500">
                                                <span>🎯</span>
                                                <span>{meta.type === 'FIND_AND_SELECT' ? 'Găsește și selectează' : meta.type === 'DRAG_AND_DROP' ? 'Drag & Drop' : meta.type}</span>
                                            </div>
                                        )}
                                        {v.changeNote && (
                                            <div className="flex items-center gap-1.5 text-caption text-neutral-500">
                                                <span>📝</span>
                                                <span>{v.changeNote}</span>
                                            </div>
                                        )}
                                    </div>

                                    {!rejecting ? (
                                        <div className="flex gap-2 flex-wrap">
                                            <button
                                                onClick={() => setPreviewVersion(isPreviewing ? null : v)}
                                                className={cn(
                                                    'px-4 py-2 rounded-lg text-body font-bold transition-colors border',
                                                    isPreviewing
                                                        ? 'bg-primary-100 text-primary-700 border-primary-300'
                                                        : 'bg-primary-50 text-primary-600 border-primary-200 hover:bg-primary-100'
                                                )}
                                            >
                                                {isPreviewing ? '▲ Închide preview' : '👁 Previzualizează'}
                                            </button>
                                            <button
                                                onClick={() => handleApprove(v.id)}
                                                disabled={acting}
                                                className="px-4 py-2 bg-success-600 text-white rounded-lg text-body font-bold hover:bg-success-700 transition-colors disabled:opacity-60"
                                            >
                                                {acting ? 'Se procesează...' : '✓ Aprobă'}
                                            </button>
                                            <button
                                                onClick={() => { setRejectingId(v.id); setRejectNote(''); }}
                                                disabled={acting}
                                                className="px-4 py-2 bg-danger-600 text-white rounded-lg text-body font-bold hover:bg-danger-700 transition-colors disabled:opacity-60"
                                            >
                                                ✗ Respinge
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            <textarea
                                                autoFocus
                                                value={rejectNote}
                                                onChange={e => setRejectNote(e.target.value)}
                                                placeholder="Motivul respingerii (obligatoriu)"
                                                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg text-body font-sans resize-none focus:outline-none focus:border-danger-400 transition-colors"
                                                rows={3}
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => confirmReject(v.id)}
                                                    disabled={acting}
                                                    className="px-4 py-2 bg-danger-600 text-white rounded-lg text-body font-bold hover:bg-danger-700 transition-colors disabled:opacity-60"
                                                >
                                                    {acting ? 'Se trimite...' : 'Confirmă respingerea'}
                                                </button>
                                                <button
                                                    onClick={() => setRejectingId(null)}
                                                    className="px-4 py-2 bg-white border border-neutral-200 text-neutral-600 rounded-lg text-body font-bold hover:bg-neutral-50 transition-colors"
                                                >
                                                    Anulează
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {isPreviewing && config && (
                                    <div className="border-t-2 border-primary-100" style={{ height: '80vh', minHeight: 600 }}>
                                        <AdminExercisePreview config={config} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function AdminExercisePreview({ config }) {
    if (!config) return null;
    const type = config.meta?.type;

    if (type === 'FIND_AND_SELECT') {
        return (
            <FindAndSelectPlayer
                exerciseId={-1}
                config={config}
                onExit={() => {}}
                isPreview={true}
            />
        );
    }
    if (type === 'DRAG_AND_DROP') {
        return (
            <DragAndDropPlayer
                exerciseId={-1}
                config={config}
                onExit={() => {}}
                isPreview={true}
            />
        );
    }
    return (
        <div className="flex items-center justify-center h-full text-neutral-400">
            <div className="text-center">
                <div className="text-3xl mb-2">🔍</div>
                <p className="text-body font-semibold">Preview nedisponibil pentru tipul „{type}"</p>
            </div>
        </div>
    );
}