import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { cn } from '../design-system/cn';

export default function AdminReviewPage() {
    const navigate = useNavigate();
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actioningId, setActioningId] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectNote, setRejectNote] = useState('');

    const loadPending = () => {
        setLoading(true);
        api.get('/exercises/versions/pending-review')
            .then(res => setVersions(res.data))
            .catch(err => setError(err.response?.data?.message || 'Eroare la încărcare'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadPending(); }, []);

    const parseMeta = (cfg) => { try { return JSON.parse(cfg).meta || {}; } catch { return {}; } };

    const handleApprove = async (id) => {
        setActioningId(id);
        try {
            await api.post(`/exercises/versions/${id}/approve`, {});
            setVersions(prev => prev.filter(v => v.id !== id));
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
        <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate(-1)} className="text-body font-semibold text-neutral-500 hover:text-neutral-800 transition-colors">
                    ← Înapoi
                </button>
                <h1 className="text-h2 font-bold text-neutral-900">Exerciții în review</h1>
            </div>

            {error && (
                <div className="flex items-center gap-2 bg-danger-50 border border-danger-200 text-danger-700 rounded-md px-4 py-3 text-body font-semibold mb-4">
                    ⚠️ {error}
                </div>
            )}

            {versions.length === 0 ? (
                <div className="bg-white rounded-xl border-2 border-dashed border-neutral-200 p-12 text-center">
                    <div className="text-4xl mb-3">✅</div>
                    <p className="text-body text-neutral-500">Nu există versiuni în așteptare.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {versions.map(v => {
                        const meta = parseMeta(v.config);
                        const acting = actioningId === v.id;
                        const rejecting = rejectingId === v.id;

                        return (
                            <div key={v.id} className="bg-white rounded-xl border border-neutral-200 p-5">
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

                                <p className="text-caption text-neutral-500 mb-4">
                                    Creat de <strong>{v.createdByName || 'necunoscut'}</strong>
                                    {v.createdAt && ` · ${new Date(v.createdAt).toLocaleString('ro-RO')}`}
                                    {v.changeNote && ` · ${v.changeNote}`}
                                </p>

                                {!rejecting ? (
                                    <div className="flex gap-2">
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
                        );
                    })}
                </div>
            )}
        </div>
    );
}