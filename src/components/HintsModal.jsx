import { useEffect, useState } from 'react';
import api from "../api/axios.js";

export default function HintsModal({ exerciseId, onClose }) {
    const [hints, setHints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!exerciseId) return;
        api.get(`/exercises/${exerciseId}/hints/all`)
            .then(r => setHints(r.data))
            .catch(() => setError('Nu s-au putut încărca indiciile.'))
            .finally(() => setLoading(false));
    }, [exerciseId]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000,
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: '28px 28px 24px',
                    width: '100%',
                    maxWidth: 480,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                    position: 'relative',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <span style={{ fontSize: 22 }}>💡</span>
                    <span style={{ fontWeight: 700, fontSize: 17, color: '#111827' }}>
                        Indicii pentru exercițiu
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            marginLeft: 'auto',
                            background: 'none',
                            border: 'none',
                            fontSize: 20,
                            color: '#9ca3af',
                            cursor: 'pointer',
                            lineHeight: 1,
                            padding: '2px 6px',
                            borderRadius: 6,
                        }}
                    >
                        ✕
                    </button>
                </div>

                {loading && (
                    <div style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
                        Se încarcă indiciile...
                    </div>
                )}

                {error && (
                    <div style={{ color: '#ef4444', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
                        {error}
                    </div>
                )}

                {!loading && !error && hints.length === 0 && (
                    <div style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
                        Nu există indicii pentru acest exercițiu.
                    </div>
                )}

                {!loading && !error && hints.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {hints.map((hint, i) => (
                            <div
                                key={i}
                                style={{
                                    background: '#fefce8',
                                    border: '1.5px solid #fde68a',
                                    borderRadius: 10,
                                    padding: '12px 14px',
                                    display: 'flex',
                                    gap: 12,
                                    alignItems: 'flex-start',
                                }}
                            >
                                <span style={{
                                    background: '#fbbf24',
                                    color: '#fff',
                                    borderRadius: '50%',
                                    width: 24, height: 24,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 700,
                                    flexShrink: 0, marginTop: 1,
                                }}>
                                    {i + 1}
                                </span>
                                <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.55 }}>
                                    {hint.text}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    onClick={onClose}
                    style={{
                        marginTop: 20,
                        width: '100%',
                        padding: '10px 0',
                        borderRadius: 10,
                        border: '1.5px solid #e5e7eb',
                        background: '#f9fafb',
                        color: '#374151',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                    }}
                >
                    Închide
                </button>
            </div>
        </div>
    );
}
