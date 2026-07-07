import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'

export default function QuizzesPage() {
    const { moduleId } = useParams()
    const [quizzes, setQuizzes] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        api.get(`/quizzes/module/${moduleId}`)
            .then(res => setQuizzes(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }, [moduleId])

    return (
        <div style={styles.page}>
            <div style={styles.topBar}>
                <button onClick={() => navigate('/')} style={styles.backBtn}>
                    ← Inapoi
                </button>
                <span style={styles.topBarTitle}>Alege un quiz</span>
                <div style={{ width: 80 }} />
            </div>

            <div style={styles.container}>
                {loading ? (
                    <div style={styles.loadingWrap}>
                        <div style={styles.spinner} />
                    </div>
                ) : (
                    <>
                        <h2 style={styles.sectionTitle}>Quiz-uri disponibile</h2>
                        <div style={styles.grid}>
                            {quizzes.map((q, i) => (
                                <div
                                    key={q.id}
                                    onClick={() => navigate(`/quiz/${q.id}`)}
                                    style={styles.card}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-3px)'
                                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)'
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translateY(0)'
                                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'
                                    }}
                                >
                                    <div style={styles.cardLeft}>
                                        <div style={{ ...styles.quizNum, background: COLORS[i % COLORS.length] }}>
                                            {i + 1}
                                        </div>
                                    </div>
                                    <div style={styles.cardContent}>
                                        <h3 style={styles.cardTitle}>{q.title}</h3>
                                        <p style={styles.cardDesc}>{q.description}</p>
                                        {q.maxAttempts > 0 && (
                                            <span style={styles.badge}>
                        {q.maxAttempts} incercari
                      </span>
                                        )}
                                    </div>
                                    <span style={styles.arrow}>→</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

const COLORS = ['#58CC02', '#1CB0F6', '#FF9600', '#FF4B4B', '#CE82FF']

const styles = {
    page: { minHeight: '100vh', background: '#f0f2f5' },
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
        transition: 'all 0.15s',
    },
    topBarTitle: {
        fontWeight: 800,
        fontSize: '1rem',
        color: '#1a1d23',
    },
    container: {
        maxWidth: 720,
        margin: '0 auto',
        padding: '32px 20px',
    },
    sectionTitle: {
        fontSize: '1.1rem',
        fontWeight: 800,
        color: '#6b7280',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        marginBottom: 16,
    },
    grid: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    card: {
        background: 'white',
        borderRadius: 16,
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid #f3f4f6',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    },
    cardLeft: { flexShrink: 0 },
    quizNum: {
        width: 44,
        height: 44,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 900,
        fontSize: '1.1rem',
    },
    cardContent: { flex: 1 },
    cardTitle: {
        fontSize: '1rem',
        fontWeight: 800,
        color: '#1a1d23',
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: '0.85rem',
        color: '#6b7280',
        fontWeight: 600,
        lineHeight: 1.4,
        marginBottom: 6,
    },
    badge: {
        display: 'inline-block',
        background: '#f3f4f6',
        color: '#6b7280',
        fontSize: '0.75rem',
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: 20,
    },
    arrow: {
        fontSize: '1.1rem',
        color: '#d1d5db',
        fontWeight: 700,
        flexShrink: 0,
    },
    loadingWrap: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
    },
    spinner: {
        width: 36, height: 36,
        border: '3px solid #e5e7eb',
        borderTop: '3px solid #58CC02',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
}