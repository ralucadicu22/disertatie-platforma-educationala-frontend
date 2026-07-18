import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function AdminReviewPage() {
    const navigate = useNavigate();
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [actioningId, setActioningId] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectNote, setRejectNote] = useState('');

    const loadPending = () => {
        setLoading(true);
        api.get('/exercises/versions/pending-review')
            .then(res => setVersions(res.data))
            .catch(err => {
                console.error(err);
                setErrorMessage(err.response?.data?.message || 'Eroare la încărcarea listei de review');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadPending();
    }, []);

    const parseMeta = (configString) => {
        try {
            const parsed = JSON.parse(configString);
            return parsed.meta || {};
        } catch {
            return {};
        }
    };

    const handleApprove = async (versionId) => {
        setActioningId(versionId);
        try {
            await api.post(`/exercises/versions/${versionId}/approve`, {});
            setVersions(prev => prev.filter(v => v.id !== versionId));
        } catch (err) {
            console.error(err);
            setErrorMessage(err.response?.data?.message || 'Eroare la aprobare');
        } finally {
            setActioningId(null);
        }
    };

    const startReject = (versionId) => {
        setRejectingId(versionId);
        setRejectNote('');
    };

    const cancelReject = () => {
        setRejectingId(null);
        setRejectNote('');
    };

    const confirmReject = async (versionId) => {
        if (!rejectNote.trim()) {
            setErrorMessage('Motivul respingerii este obligatoriu');
            return;
        }
        setActioningId(versionId);
        try {
            await api.post(`/exercises/versions/${versionId}/reject`, { reviewNote: rejectNote.trim() });
            setVersions(prev => prev.filter(v => v.id !== versionId));
            setRejectingId(null);
            setRejectNote('');
        } catch (err) {
            console.error(err);
            setErrorMessage(err.response?.data?.message || 'Eroare la respingere');
        } finally {
            setActioningId(null);
        }
    };

    if (loading) {
        return (
            <div style={styles.centered}>
                <div style={styles.spinner} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <button onClick={() => navigate('/')} style={styles.backBtn}>← Înapoi</button>
                <span style={styles.title}>Exerciții în review</span>
                <div style={{ width: 80 }} />
            </div>

            <div style={styles.container}>
                {errorMessage && <p style={styles.errorText}>{errorMessage}</p>}

                {versions.length === 0 ? (
                    <p style={styles.emptyText}>Nu există versiuni în așteptare la review.</p>
                ) : (
                    <div style={styles.list}>
                        {versions.map(v => {
                            const meta = parseMeta(v.config);
                            const isActing = actioningId === v.id;
                            const isRejecting = rejectingId === v.id;

                            return (
                                <div key={v.id} style={styles.card}>
                                    <div style={styles.cardHeader}>
                                        <div>
                                            <p style={styles.exerciseName}>
                                                {meta.name || `Exercițiu #${v.exerciseId}`}
                                            </p>
                                            <p style={styles.exerciseMeta}>
                                                {meta.type || 'CUSTOM'} · versiunea {v.versionNumber}
                                            </p>
                                        </div>
                                        <span style={styles.statusBadge}>PENDING REVIEW</span>
                                    </div>

                                    <div style={styles.cardDetails}>
                                        <p style={styles.detailLine}>
                                            Creat de <strong>{v.createdByName || 'necunoscut'}</strong>
                                            {v.createdAt && ` · ${new Date(v.createdAt).toLocaleString('ro-RO')}`}
                                        </p>
                                        {v.changeNote && (
                                            <p style={styles.detailLine}>Notă: {v.changeNote}</p>
                                        )}
                                    </div>

                                    {!isRejecting ? (
                                        <div style={styles.actions}>
                                            <button
                                                style={{ ...styles.approveBtn, opacity: isActing ? 0.6 : 1 }}
                                                onClick={() => handleApprove(v.id)}
                                                disabled={isActing}
                                            >
                                                {isActing ? 'Se procesează...' : '✓ Aprobă'}
                                            </button>
                                            <button
                                                style={{ ...styles.rejectBtn, opacity: isActing ? 0.6 : 1 }}
                                                onClick={() => startReject(v.id)}
                                                disabled={isActing}
                                            >
                                                ✗ Respinge
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={styles.rejectForm}>
                                            <textarea
                                                autoFocus
                                                value={rejectNote}
                                                onChange={(e) => setRejectNote(e.target.value)}
                                                placeholder="Motivul respingerii (obligatoriu)"
                                                style={styles.rejectTextarea}
                                            />
                                            <div style={styles.actions}>
                                                <button
                                                    style={{ ...styles.rejectBtn, opacity: isActing ? 0.6 : 1 }}
                                                    onClick={() => confirmReject(v.id)}
                                                    disabled={isActing}
                                                >
                                                    {isActing ? 'Se trimite...' : 'Confirmă respingerea'}
                                                </button>
                                                <button style={styles.cancelBtn} onClick={cancelReject} disabled={isActing}>
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
        </div>
    );
}

const styles = {
    page: { minHeight: '100vh', background: '#f0f2f5' },
    centered: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', flexDirection: 'column', gap: 16,
    },
    spinner: {
        width: 40, height: 40,
        border: '3px solid #e5e7eb',
        borderTop: '3px solid #4F6BF6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
    header: {
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        background: 'none',
        border: '1.5px solid #e5e7eb',
        borderRadius: 10,
        padding: '7px 14px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: 700,
        color: '#6b7280',
    },
    title: { fontWeight: 800, fontSize: '1rem', color: '#1a1d23' },
    container: { maxWidth: 760, margin: '0 auto', padding: '32px 20px' },
    errorText: {
        color: '#dc2626', fontWeight: 700, fontSize: '0.85rem',
        marginBottom: 16, background: '#fef2f2', padding: '10px 14px', borderRadius: 10,
    },
    list: { display: 'flex', flexDirection: 'column', gap: 14 },
    card: {
        background: 'white', borderRadius: 14, padding: '18px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    },
    cardHeader: {
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10,
    },
    exerciseName: { fontSize: '1rem', fontWeight: 800, color: '#1a1d23', margin: '0 0 3px 0' },
    exerciseMeta: { fontSize: '0.8rem', color: '#6b7280', fontWeight: 600, margin: 0 },
    statusBadge: {
        fontSize: '0.7rem', fontWeight: 800, color: '#b45309', background: '#fef3c7',
        padding: '5px 10px', borderRadius: 8, whiteSpace: 'nowrap',
    },
    cardDetails: { marginBottom: 14 },
    detailLine: { fontSize: '0.82rem', color: '#6b7280', fontWeight: 500, margin: '2px 0' },
    actions: { display: 'flex', gap: 10 },
    approveBtn: {
        padding: '9px 18px', background: '#16a34a', color: 'white', border: 'none',
        borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
    },
    rejectBtn: {
        padding: '9px 18px', background: '#dc2626', color: 'white', border: 'none',
        borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
    },
    cancelBtn: {
        padding: '9px 18px', background: 'white', border: '1.5px solid #e5e7eb', color: '#6b7280',
        borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
    },
    rejectForm: { display: 'flex', flexDirection: 'column', gap: 10 },
    rejectTextarea: {
        width: '100%', minHeight: 70, padding: '10px 12px', border: '1.5px solid #e5e7eb',
        borderRadius: 10, fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
    },
    emptyText: {
        fontSize: '0.9rem', color: '#9ca3af', fontStyle: 'italic',
        textAlign: 'center', padding: '40px 20px',
    },
};