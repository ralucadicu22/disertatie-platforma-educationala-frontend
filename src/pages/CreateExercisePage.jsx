import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

export default function CreateExercisePage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const quizId = searchParams.get('quizId');

    const [activeTab, setActiveTab] = useState('scratch'); // 'scratch' | 'template'
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (activeTab === 'template') {
            setLoadingTemplates(true);
            api.get('/exercises/versions/templates')
                .then(res => setTemplates(res.data))
                .catch(err => {
                    console.error(err);
                    setError('Nu am putut incarca template-urile.');
                })
                .finally(() => setLoadingTemplates(false));
        }
    }, [activeTab]);

    const handleCreateFromScratch = async () => {
        if (!quizId) {
            setError('Lipseste quizId in URL.');
            return;
        }
        setCreating(true);
        setError(null);
        try {
            navigate(`/editor/new?quizId=${quizId}`);
        } catch (err) {
            setError('Eroare la creare exercitiu.');
            setCreating(false);
        }
    };

    const handleCreateFromTemplate = async (templateVersionId) => {
        if (!quizId) {
            setError('Lipseste quizId in URL.');
            return;
        }
        setCreating(true);
        setError(null);
        try {
            const res = await api.post('/exercises/from-template', {
                templateVersionId,
                quizId: parseInt(quizId),
                changeNote: 'Creat din template',
            });
            navigate(`/editor/${res.data.exerciseId}`);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Eroare la creare din template.');
            setCreating(false);
        }
    };

    if (!quizId) {
        return (
            <div style={styles.errorPage}>
                <div style={styles.errorIcon}>⚠️</div>
                <p style={styles.errorText}>
                    Nu ai specificat un quiz. Foloseste linkul /editor/create?quizId=X
                </p>
                <button style={styles.backBtn} onClick={() => navigate('/')}>
                    Inapoi la pagina principala
                </button>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.topBar}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>← Inapoi</button>
                <span style={styles.topBarTitle}>Creeaza exercitiu nou</span>
                <div style={{ width: 80 }} />
            </div>

            <div style={styles.container}>
                <div style={styles.tabs}>
                    <button
                        onClick={() => setActiveTab('scratch')}
                        style={{
                            ...styles.tab,
                            ...(activeTab === 'scratch' ? styles.tabActive : {}),
                        }}
                    >
                        De la zero
                    </button>
                    <button
                        onClick={() => setActiveTab('template')}
                        style={{
                            ...styles.tab,
                            ...(activeTab === 'template' ? styles.tabActive : {}),
                        }}
                    >
                        Din template
                    </button>
                </div>

                {error && (
                    <div style={styles.errorBanner}>
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {activeTab === 'scratch' && (
                    <div style={styles.scratchCard}>
                        <div style={styles.scratchIcon}>📄</div>
                        <h2 style={styles.scratchTitle}>Incepe cu un canvas gol</h2>
                        <p style={styles.scratchDesc}>
                            Ai libertate completa in constructie: adaugi elementele pe care le doresti
                            (text, imagini, forme) si configurezi comportamentul in modul Solutie.
                        </p>
                        <button
                            onClick={handleCreateFromScratch}
                            disabled={creating}
                            style={{
                                ...styles.primaryBtn,
                                opacity: creating ? 0.6 : 1,
                                cursor: creating ? 'wait' : 'pointer',
                            }}
                        >
                            {creating ? 'Se creeaza...' : 'Deschide editorul'}
                        </button>
                    </div>
                )}

                {activeTab === 'template' && (
                    <>
                        {loadingTemplates ? (
                            <div style={styles.loadingWrap}>
                                <div style={styles.spinner} />
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            </div>
                        ) : templates.length === 0 ? (
                            <div style={styles.emptyState}>
                                <div style={styles.emptyIcon}>📚</div>
                                <h3 style={styles.emptyTitle}>Nu exista template-uri</h3>
                                <p style={styles.emptyDesc}>
                                    Un template este o versiune publicata a unui exercitiu care poate
                                    fi folosita ca punct de plecare. Marcheaza un exercitiu publicat
                                    ca template pentru a-l face disponibil aici.
                                </p>
                            </div>
                        ) : (
                            <div style={styles.templateGrid}>
                                {templates.map(t => (
                                    <TemplateCard
                                        key={t.id}
                                        template={t}
                                        onSelect={() => handleCreateFromTemplate(t.id)}
                                        disabled={creating}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function TemplateCard({ template, onSelect, disabled }) {
    const elementsCount = parseElementsCount(template.config);
    const createdDate = template.createdAt
        ? new Date(template.createdAt).toLocaleDateString('ro-RO')
        : '—';

    return (
        <div style={styles.templateCard}>
            <div style={styles.templateHeader}>
                <span style={styles.templateBadge}>TEMPLATE</span>
                <span style={styles.templateVersion}>v{template.versionNumber}</span>
            </div>
            <div style={styles.templatePreview}>
                <span style={styles.templatePreviewIcon}>🎨</span>
            </div>
            <div style={styles.templateInfo}>
                <h3 style={styles.templateName}>
                    Exercitiu #{template.exerciseId}
                </h3>
                <div style={styles.templateMeta}>
                    <span>👤 {template.createdByName || 'Necunoscut'}</span>
                    <span>📅 {createdDate}</span>
                    <span>🧩 {elementsCount} elemente</span>
                </div>
                {template.changeNote && (
                    <p style={styles.templateNote}>{template.changeNote}</p>
                )}
            </div>
            <button
                onClick={onSelect}
                disabled={disabled}
                style={{
                    ...styles.templateBtn,
                    opacity: disabled ? 0.6 : 1,
                    cursor: disabled ? 'wait' : 'pointer',
                }}
            >
                Foloseste template-ul
            </button>
        </div>
    );
}

function parseElementsCount(configStr) {
    try {
        const cfg = JSON.parse(configStr);
        return (cfg.elements || []).length;
    } catch {
        return 0;
    }
}

const styles = {
    page: { minHeight: '100vh', background: '#f0f2f5' },
    errorPage: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: '#f0f2f5',
    },
    errorIcon: { fontSize: '3rem' },
    errorText: {
        fontSize: '1rem',
        fontWeight: 700,
        color: '#dc2626',
        maxWidth: 400,
        textAlign: 'center',
    },
    topBar: {
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
    topBarTitle: {
        fontWeight: 800,
        fontSize: '1rem',
        color: '#1a1d23',
    },
    container: {
        maxWidth: 900,
        margin: '0 auto',
        padding: '32px 20px',
    },
    tabs: {
        display: 'flex',
        gap: 4,
        background: '#f3f4f6',
        padding: 4,
        borderRadius: 12,
        marginBottom: 24,
        maxWidth: 320,
    },
    tab: {
        flex: 1,
        background: 'transparent',
        border: 'none',
        padding: '10px 18px',
        borderRadius: 8,
        fontSize: '0.9rem',
        fontWeight: 700,
        color: '#6b7280',
        cursor: 'pointer',
        transition: 'all 0.15s',
    },
    tabActive: {
        background: 'white',
        color: '#1a1d23',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    },
    errorBanner: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: '#fef2f2',
        color: '#991b1b',
        padding: '12px 14px',
        borderRadius: 10,
        fontSize: '0.85rem',
        fontWeight: 600,
        marginBottom: 16,
        border: '1px solid #fecaca',
    },
    scratchCard: {
        background: 'white',
        borderRadius: 20,
        padding: '40px 32px',
        textAlign: 'center',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        maxWidth: 520,
        margin: '0 auto',
    },
    scratchIcon: {
        fontSize: '3rem',
        marginBottom: 16,
    },
    scratchTitle: {
        fontSize: '1.4rem',
        fontWeight: 900,
        color: '#1a1d23',
        marginBottom: 10,
    },
    scratchDesc: {
        fontSize: '0.9rem',
        color: '#6b7280',
        fontWeight: 500,
        lineHeight: 1.6,
        marginBottom: 24,
    },
    primaryBtn: {
        background: '#4F6BF6',
        color: 'white',
        border: 'none',
        padding: '13px 32px',
        borderRadius: 12,
        fontSize: '0.95rem',
        fontWeight: 800,
        boxShadow: '0 4px 0 #3a52c4',
    },
    loadingWrap: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
    },
    spinner: {
        width: 40, height: 40,
        border: '3px solid #e5e7eb',
        borderTop: '3px solid #4F6BF6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
    emptyState: {
        background: 'white',
        borderRadius: 16,
        padding: '48px 24px',
        textAlign: 'center',
        border: '2px dashed #e5e7eb',
        maxWidth: 520,
        margin: '0 auto',
    },
    emptyIcon: {
        fontSize: '2.5rem',
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: '1.1rem',
        fontWeight: 800,
        color: '#1a1d23',
        marginBottom: 8,
    },
    emptyDesc: {
        fontSize: '0.85rem',
        color: '#6b7280',
        fontWeight: 500,
        lineHeight: 1.6,
    },
    templateGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
    },
    templateCard: {
        background: 'white',
        borderRadius: 14,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid #f3f4f6',
    },
    templateHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    templateBadge: {
        background: '#eef2ff',
        color: '#4F6BF6',
        padding: '3px 8px',
        borderRadius: 5,
        fontSize: '0.65rem',
        fontWeight: 800,
        letterSpacing: '0.5px',
    },
    templateVersion: {
        fontSize: '0.7rem',
        color: '#9ca3af',
        fontWeight: 700,
    },
    templatePreview: {
        background: '#f9fafb',
        borderRadius: 10,
        padding: '24px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #f3f4f6',
    },
    templatePreviewIcon: {
        fontSize: '2rem',
    },
    templateInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
    },
    templateName: {
        fontSize: '0.95rem',
        fontWeight: 800,
        color: '#1a1d23',
        margin: 0,
    },
    templateMeta: {
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        fontSize: '0.75rem',
        color: '#6b7280',
        fontWeight: 600,
    },
    templateNote: {
        fontSize: '0.8rem',
        color: '#6b7280',
        fontWeight: 500,
        fontStyle: 'italic',
        margin: '4px 0 0 0',
    },
    templateBtn: {
        background: '#4F6BF6',
        color: 'white',
        border: 'none',
        padding: '9px 12px',
        borderRadius: 10,
        fontSize: '0.85rem',
        fontWeight: 800,
        boxShadow: '0 2px 0 #3a52c4',
    },
};