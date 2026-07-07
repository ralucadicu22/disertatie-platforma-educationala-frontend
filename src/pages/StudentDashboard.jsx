import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function StudentDashboard() {
    const [stats, setStats] = useState(null)
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        Promise.all([
            api.get('/progress/me/stats'),
            api.get('/progress/me')
        ])
            .then(([statsRes, historyRes]) => {
                setStats(statsRes.data)
                setHistory(historyRes.data)
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <div style={styles.loadingWrap}>
            <div style={styles.spinner} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )

    // Grupeaza istoricul pe exercitii pentru a arata cate incercari per exercitiu
    const formatDate = (dateStr) => {
        const d = new Date(dateStr)
        return d.toLocaleDateString('ro-RO', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        })
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.sectionTitle}>Progresul meu</h2>

            {/* Statistici */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIconWrap, background: '#dbeafe' }}>
                        <span style={styles.statIcon}>✅</span>
                    </div>
                    <div>
                        <div style={styles.statNum}>{stats?.completedExercises || 0}</div>
                        <div style={styles.statLabel}>Exercitii rezolvate</div>
                    </div>
                </div>

                <div style={styles.statCard}>
                    <div style={{ ...styles.statIconWrap, background: '#fef9c3' }}>
                        <span style={styles.statIcon}>⭐</span>
                    </div>
                    <div>
                        <div style={styles.statNum}>{stats?.totalPoints || 0}</div>
                        <div style={styles.statLabel}>Puncte acumulate</div>
                    </div>
                </div>

                <div style={styles.statCard}>
                    <div style={{ ...styles.statIconWrap, background: '#dcfce7' }}>
                        <span style={styles.statIcon}>🎯</span>
                    </div>
                    <div>
                        <div style={styles.statNum}>{stats?.totalSubmissions || 0}</div>
                        <div style={styles.statLabel}>Total incercari</div>
                    </div>
                </div>
            </div>

            {/* Istoric */}
            <h2 style={{ ...styles.sectionTitle, marginTop: 32 }}>Istoric activitate</h2>

            {history.length === 0 ? (
                <div style={styles.empty}>
                    <span style={{ fontSize: '2.5rem' }}>📭</span>
                    <p style={styles.emptyText}>Inca nu ai rezolvat niciun exercitiu.</p>
                    <button onClick={() => navigate('/')} style={styles.startBtn}>
                        Incepe sa inveti
                    </button>
                </div>
            ) : (
                <div style={styles.historyList}>
                    {history.map(item => (
                        <div key={item.id} style={styles.historyCard}>
                            <div style={{
                                ...styles.historyStatus,
                                background: item.correct ? '#dcfce7' : '#fee2e2',
                            }}>
                                {item.correct ? '✓' : '✗'}
                            </div>

                            <div style={styles.historyBody}>
                                <p style={styles.historyQuestion}>Exercițiul #{item.exerciseId}</p>
                                <div style={styles.historyMeta}>
                  <span style={styles.metaItem}>
                    Incercarea #{item.attemptNumber}
                  </span>
                                    <span style={styles.metaDot}>•</span>
                                    <span style={styles.metaItem}>
                    {formatDate(item.submittedAt)}
                  </span>
                                </div>
                            </div>

                            <div style={styles.historyPoints}>
                                {item.pointsEarned > 0 ? (
                                    <span style={styles.pointsPositive}>+{item.pointsEarned}</span>
                                ) : (
                                    <span style={styles.pointsZero}>0</span>
                                )}
                                <span style={styles.pointsLabel}>pct</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

const styles = {
    container: {
        maxWidth: 800,
        margin: '0 auto',
        padding: '28px 20px',
    },
    sectionTitle: {
        fontSize: '0.85rem',
        fontWeight: 800,
        color: '#9ca3af',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        marginBottom: 16,
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 14,
    },
    statCard: {
        background: 'white',
        borderRadius: 16,
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid #f3f4f6',
    },
    statIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    statIcon: {
        fontSize: '1.4rem',
    },
    statNum: {
        fontSize: '1.8rem',
        fontWeight: 900,
        color: '#1a1d23',
        lineHeight: 1,
    },
    statLabel: {
        fontSize: '0.78rem',
        fontWeight: 700,
        color: '#9ca3af',
        marginTop: 4,
    },
    historyList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    },
    historyCard: {
        background: 'white',
        borderRadius: 14,
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid #f3f4f6',
    },
    historyStatus: {
        width: 36,
        height: 36,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.1rem',
        fontWeight: 800,
        flexShrink: 0,
    },
    historyBody: {
        flex: 1,
        minWidth: 0,
    },
    historyQuestion: {
        fontSize: '0.95rem',
        fontWeight: 700,
        color: '#1a1d23',
        margin: 0,
        marginBottom: 4,
    },
    historyMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    metaItem: {
        fontSize: '0.78rem',
        color: '#9ca3af',
        fontWeight: 600,
    },
    metaDot: {
        color: '#d1d5db',
    },
    historyPoints: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flexShrink: 0,
    },
    pointsPositive: {
        fontSize: '1.1rem',
        fontWeight: 900,
        color: '#22c55e',
    },
    pointsZero: {
        fontSize: '1.1rem',
        fontWeight: 900,
        color: '#d1d5db',
    },
    pointsLabel: {
        fontSize: '0.65rem',
        fontWeight: 700,
        color: '#9ca3af',
        textTransform: 'uppercase',
    },
    empty: {
        background: 'white',
        borderRadius: 16,
        padding: '40px 20px',
        textAlign: 'center',
        border: '1px solid #f3f4f6',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        color: '#9ca3af',
        fontWeight: 600,
        margin: 0,
    },
    startBtn: {
        background: '#4F6BF6',
        color: 'white',
        border: 'none',
        borderRadius: 12,
        padding: '11px 24px',
        fontSize: '0.95rem',
        fontWeight: 800,
        cursor: 'pointer',
        marginTop: 8,
    },
    loadingWrap: {
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    spinner: {
        width: 36,
        height: 36,
        border: '3px solid #e5e7eb',
        borderTop: '3px solid #4F6BF6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
}