import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'

export default function ExercisePage() {
    const { quizId } = useParams()
    const navigate = useNavigate()
    const [exercises, setExercises] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get(`/exercises/quiz/${quizId}`)
            .then(res => setExercises(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }, [quizId])

    if (loading) return (
        <div style={styles.centered}>
            <div style={styles.spinner} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <button onClick={() => navigate('/')} style={styles.backBtn}>← Înapoi</button>
                <span style={styles.title}>Quiz</span>
                <div style={{ width: 80 }} />
            </div>

            <div style={styles.container}>
                <h2 style={styles.sectionTitle}>Exerciții în acest quiz ({exercises.length})</h2>
                {exercises.length === 0 ? (
                    <p style={styles.emptyText}>Nu există exerciții publicate în acest quiz.</p>
                ) : (
                    <div style={styles.list}>
                        {exercises.map((ex, i) => (
                            <div key={ex.id} style={styles.exerciseCard}>
                                <div style={styles.exerciseNum}>{i + 1}</div>
                                <div style={styles.exerciseContent}>
                                    <p style={styles.exerciseType}>{ex.type || 'CUSTOM'}</p>
                                    <p style={styles.exercisePoints}>
                                        {ex.points} puncte · dificultate {ex.difficulty}
                                    </p>
                                </div>
                                <button
                                    style={styles.playBtn}
                                    onClick={() => navigate(`/exercise/${ex.id}/play`)}
                                >
                                    Rezolvă →
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
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
    title: {
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
        fontSize: '0.85rem',
        fontWeight: 800,
        color: '#9ca3af',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        marginBottom: 14,
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    },
    exerciseCard: {
        background: 'white',
        borderRadius: 12,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    },
    exerciseNum: {
        width: 36, height: 36,
        borderRadius: 10,
        background: '#4F6BF6',
        color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900,
        fontSize: '0.9rem',
        flexShrink: 0,
    },
    exerciseContent: { flex: 1 },
    exerciseType: {
        fontSize: '0.9rem',
        fontWeight: 700,
        color: '#1a1d23',
        margin: '0 0 3px 0',
    },
    exercisePoints: {
        fontSize: '0.8rem',
        color: '#6b7280',
        fontWeight: 600,
        margin: 0,
    },
    playBtn: {
        padding: '9px 16px',
        background: '#4F6BF6',
        color: 'white',
        border: 'none',
        borderRadius: 10,
        fontSize: '0.85rem',
        fontWeight: 700,
        cursor: 'pointer',
        flexShrink: 0,
    },
    emptyText: {
        fontSize: '0.9rem',
        color: '#9ca3af',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: '40px 20px',
    },
}