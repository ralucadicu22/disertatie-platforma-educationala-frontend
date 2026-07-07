import { useEffect, useState } from 'react'
import api from '../api/axios'

export default function TeacherDashboard() {
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedStudent, setSelectedStudent] = useState(null)

    useEffect(() => {
        api.get('/progress/teacher/all-students')
            .then(res => setStudents(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <div style={styles.loadingWrap}>
            <div style={styles.spinner} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )

    // Statistici agregate pe toata grupa
    const totalStudents = students.length
    const totalCompleted = students.reduce((sum, s) => sum + (s.completedExercises || 0), 0)
    const totalPoints = students.reduce((sum, s) => sum + (s.totalPoints || 0), 0)
    const avgPoints = totalStudents > 0 ? Math.round(totalPoints / totalStudents) : 0

    // Sorteaza elevii dupa puncte (descrescator) pentru clasament
    const sorted = [...students].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))

    return (
        <div style={styles.container}>
            <h2 style={styles.sectionTitle}>Privire de ansamblu</h2>

            {/* Statistici agregate */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIconWrap, background: '#dbeafe' }}>
                        <span style={styles.statIcon}>👥</span>
                    </div>
                    <div>
                        <div style={styles.statNum}>{totalStudents}</div>
                        <div style={styles.statLabel}>Elevi activi</div>
                    </div>
                </div>

                <div style={styles.statCard}>
                    <div style={{ ...styles.statIconWrap, background: '#dcfce7' }}>
                        <span style={styles.statIcon}>✅</span>
                    </div>
                    <div>
                        <div style={styles.statNum}>{totalCompleted}</div>
                        <div style={styles.statLabel}>Exercitii rezolvate</div>
                    </div>
                </div>

                <div style={styles.statCard}>
                    <div style={{ ...styles.statIconWrap, background: '#fef9c3' }}>
                        <span style={styles.statIcon}>📊</span>
                    </div>
                    <div>
                        <div style={styles.statNum}>{avgPoints}</div>
                        <div style={styles.statLabel}>Scor mediu / elev</div>
                    </div>
                </div>
            </div>

            {/* Tabel elevi */}
            <h2 style={{ ...styles.sectionTitle, marginTop: 32 }}>Progresul elevilor</h2>

            {students.length === 0 ? (
                <div style={styles.empty}>
                    <span style={{ fontSize: '2.5rem' }}>📭</span>
                    <p style={styles.emptyText}>Inca nu exista elevi cu activitate inregistrata.</p>
                </div>
            ) : (
                <div style={styles.tableWrap}>
                    <div style={styles.tableHeader}>
                        <div style={{ ...styles.thRank }}>#</div>
                        <div style={{ ...styles.thName }}>Elev</div>
                        <div style={{ ...styles.thStat }}>Rezolvate</div>
                        <div style={{ ...styles.thStat }}>Incercari</div>
                        <div style={{ ...styles.thStat }}>Puncte</div>
                    </div>

                    {sorted.map((student, i) => (
                        <div
                            key={student.userId}
                            style={styles.tableRow}
                            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                        >
                            <div style={styles.tdRank}>
                <span style={{
                    ...styles.rankBadge,
                    background: i === 0 ? '#fef9c3' : i === 1 ? '#f3f4f6' : i === 2 ? '#fed7aa' : 'transparent',
                    color: i < 3 ? '#1a1d23' : '#9ca3af',
                }}>
                  {i + 1}
                </span>
                            </div>
                            <div style={styles.tdName}>
                                <div style={styles.avatar}>
                                    {student.userName?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <span style={styles.studentName}>{student.userName}</span>
                            </div>
                            <div style={styles.tdStat}>{student.completedExercises || 0}</div>
                            <div style={styles.tdStat}>{student.totalSubmissions || 0}</div>
                            <div style={styles.tdStat}>
                                <span style={styles.pointsBadge}>{student.totalPoints || 0}</span>
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
        maxWidth: 900,
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
    statIcon: { fontSize: '1.4rem' },
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
    tableWrap: {
        background: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid #f3f4f6',
    },
    tableHeader: {
        display: 'flex',
        alignItems: 'center',
        padding: '12px 18px',
        borderBottom: '1px solid #f3f4f6',
        background: '#fafafa',
    },
    thRank: {
        width: 40,
        fontSize: '0.72rem',
        fontWeight: 800,
        color: '#9ca3af',
        textTransform: 'uppercase',
    },
    thName: {
        flex: 1,
        fontSize: '0.72rem',
        fontWeight: 800,
        color: '#9ca3af',
        textTransform: 'uppercase',
    },
    thStat: {
        width: 90,
        textAlign: 'center',
        fontSize: '0.72rem',
        fontWeight: 800,
        color: '#9ca3af',
        textTransform: 'uppercase',
    },
    tableRow: {
        display: 'flex',
        alignItems: 'center',
        padding: '14px 18px',
        borderBottom: '1px solid #f3f4f6',
        transition: 'background 0.15s',
    },
    tdRank: {
        width: 40,
    },
    rankBadge: {
        width: 26,
        height: 26,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.85rem',
        fontWeight: 800,
    },
    tdName: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    },
    avatar: {
        width: 34,
        height: 34,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #4F6BF6, #8B5CF6)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.9rem',
        fontWeight: 800,
        flexShrink: 0,
    },
    studentName: {
        fontSize: '0.92rem',
        fontWeight: 700,
        color: '#1a1d23',
    },
    tdStat: {
        width: 90,
        textAlign: 'center',
        fontSize: '0.92rem',
        fontWeight: 700,
        color: '#6b7280',
    },
    pointsBadge: {
        background: '#fef9c3',
        color: '#854d0e',
        padding: '4px 12px',
        borderRadius: 20,
        fontSize: '0.85rem',
        fontWeight: 800,
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