import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import ProductsPage from "./ProductsPage.jsx";

export default function ModulesPage() {
    const [modules, setModules] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const role = user.role || 'ELEV'

    useEffect(() => {
        if (role === 'ELEV' || role === 'PROFESOR' || role === 'EDITOR' || role === 'ADMIN') {
            api.get('/modules')
                .then(res => setModules(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false))
        } else {
            setLoading(false)
        }
    }, [role])

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
    }

    return (
        <div style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={styles.logo}>🎓 EduPlatform</div>
                </div>
                <div style={styles.headerRight}>
                    <div style={styles.userInfo}>
                        <div style={styles.avatar}>
                            {ROLE_CONFIG[role]?.icon || '👤'}
                        </div>
                        <div style={styles.userDetails}>
                            <span style={styles.userName}>{user.name || 'Utilizator'}</span>
                            <span style={styles.userRole}>{ROLE_CONFIG[role]?.label || role}</span>
                        </div>
                    </div>
                    {role === 'ELEV' && (
                        <button
                            onClick={() => navigate('/progres')}
                            style={{
                                background: 'none',
                                border: '1.5px solid #e5e7eb',
                                borderRadius: 8,
                                padding: '6px 14px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: '#4F6BF6',
                                cursor: 'pointer',
                            }}
                        >
                            📊 Progresul meu
                        </button>
                    )}
                    {role === 'PROFESOR' && (
                        <button
                            onClick={() => navigate('/profesor')}
                            style={{
                                background: 'none',
                                border: '1.5px solid #e5e7eb',
                                borderRadius: 8,
                                padding: '6px 14px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: '#4F6BF6',
                                cursor: 'pointer',
                            }}
                        >
                            📊 Dashboard
                        </button>
                    )}
                    {role === 'ADMIN' && (
                        <button
                            onClick={() => navigate('/admin/review')}
                            style={{
                                background: 'none',
                                border: '1.5px solid #e5e7eb',
                                borderRadius: 8,
                                padding: '6px 14px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: '#4F6BF6',
                                cursor: 'pointer',
                            }}
                        >
                            📝 Exerciții în review
                        </button>
                    )}
                    <button onClick={handleLogout} style={styles.logoutBtn}>
                        Deconectare
                    </button>
                </div>
            </div>

            <div style={styles.container}>
                {/* ELEV — vede modulele si rezolva exercitii */}
                {role === 'ELEV' && (
                    <>
                        <div style={styles.welcome}>
                            <h1 style={styles.welcomeTitle}>Salut, {user.name?.split(' ')[0]}! 👋</h1>
                            <p style={styles.welcomeSub}>Alege un produs si incepe sa inveti.</p>
                        </div>

                        <ProductsPage />
                    </>
                )}

                {/* PROFESOR — vede modulele + dashboard profesor */}
                {role === 'PROFESOR' && (
                    <>
                        <div style={styles.welcome}>
                            <h1 style={styles.welcomeTitle}>Bine ai venit, {user.name?.split(' ')[0]}!</h1>
                            <p style={styles.welcomeSub}>Monitorizeaza progresul elevilor si gestioneaza continut.</p>
                        </div>

                        <div style={styles.dashboardGrid}>
                            <div style={styles.statCard}>
                                <div style={styles.statIcon}>👥</div>
                                <div style={styles.statNumber}>—</div>
                                <div style={styles.statLabel}>Elevi inscrisi</div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={styles.statIcon}>📊</div>
                                <div style={styles.statNumber}>—</div>
                                <div style={styles.statLabel}>Exercitii completate</div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={styles.statIcon}>⭐</div>
                                <div style={styles.statNumber}>—</div>
                                <div style={styles.statLabel}>Scor mediu</div>
                            </div>
                        </div>

                        <div style={styles.devBanner}>
                            <div style={styles.devIcon}>🔧</div>
                            <div>
                                <h3 style={styles.devTitle}>Dashboard Profesor — in dezvoltare</h3>
                                <p style={styles.devDesc}>
                                    Aceasta sectiune va include: vizualizarea progresului elevilor,
                                    rapoarte detaliate per clasa si per exercitiu, gestionarea claselor
                                    si a continutului educational.
                                </p>
                            </div>
                        </div>

                        {loading ? (
                            <div style={styles.loadingWrap}><div style={styles.spinner} /></div>
                        ) : (
                            <>
                                <h2 style={{ ...styles.sectionTitle, marginTop: 32 }}>Module existente</h2>
                                <div style={styles.grid}>
                                    {modules.map((m, i) => (
                                        <div
                                            key={m.id}
                                            onClick={() => navigate(`/module/${m.id}`)}
                                            style={styles.card}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = 'translateY(-4px)'
                                                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.12)'
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = 'translateY(0)'
                                                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'
                                            }}
                                        >
                                            <div style={{ ...styles.cardAccent, background: ACCENTS[i % ACCENTS.length] }} />
                                            <div style={styles.cardIcon}>{ICONS[i % ICONS.length]}</div>
                                            <div style={styles.cardContent}>
                                                <h3 style={styles.cardTitle}>{m.title}</h3>
                                                <p style={styles.cardDesc}>{m.description}</p>
                                            </div>
                                            <div style={styles.cardArrow}>→</div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* EDITOR — vede modulele si acceseaza editorul prin quiz-uri */}
                {role === 'EDITOR' && (
                    <>
                        <div style={styles.welcome}>
                            <h1 style={styles.welcomeTitle}>Bine ai venit, {user.name?.split(' ')[0]}! ✏️</h1>
                            <p style={styles.welcomeSub}>
                                Alege un modul pentru a construi sau edita exercitii.
                            </p>
                        </div>

                        {loading ? (
                            <div style={styles.loadingWrap}><div style={styles.spinner} /></div>
                        ) : modules.length === 0 ? (
                            <div style={styles.emptyState}>
                                <div style={styles.emptyIcon}>📚</div>
                                <h3 style={styles.emptyTitle}>Nu exista module inca</h3>
                                <p style={styles.emptyDesc}>
                                    Pentru a incepe sa creezi exercitii, trebuie sa existe cel putin un modul cu
                                    un quiz asociat in platforma.
                                </p>
                            </div>
                        ) : (
                            <>
                                <h2 style={styles.sectionTitle}>Module disponibile</h2>
                                <div style={styles.grid}>
                                    {modules.map((m, i) => (
                                        <div
                                            key={m.id}
                                            onClick={() => navigate(`/module/${m.id}`)}
                                            style={styles.card}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = 'translateY(-4px)'
                                                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.12)'
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = 'translateY(0)'
                                                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'
                                            }}
                                        >
                                            <div style={{ ...styles.cardAccent, background: ACCENTS[i % ACCENTS.length] }} />
                                            <div style={styles.cardIcon}>{ICONS[i % ICONS.length]}</div>
                                            <div style={styles.cardContent}>
                                                <h3 style={styles.cardTitle}>{m.title}</h3>
                                                <p style={styles.cardDesc}>{m.description}</p>
                                            </div>
                                            <div style={styles.cardArrow}>→</div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* ADMIN — vede statistici + modulele pentru acces la editor */}
                {role === 'ADMIN' && (
                    <>
                        <div style={styles.welcome}>
                            <h1 style={styles.welcomeTitle}>Panou Administrare ⚙️</h1>
                            <p style={styles.welcomeSub}>Gestionezi platforma, utilizatorii si continutul.</p>
                        </div>

                        <div style={styles.dashboardGrid}>
                            <div style={styles.statCard}>
                                <div style={styles.statIcon}>👥</div>
                                <div style={styles.statNumber}>—</div>
                                <div style={styles.statLabel}>Utilizatori totali</div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={styles.statIcon}>📚</div>
                                <div style={styles.statNumber}>{modules.length}</div>
                                <div style={styles.statLabel}>Module active</div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={styles.statIcon}>📝</div>
                                <div style={styles.statNumber}>—</div>
                                <div style={styles.statLabel}>Exercitii totale</div>
                            </div>
                        </div>

                        {loading ? (
                            <div style={styles.loadingWrap}><div style={styles.spinner} /></div>
                        ) : (
                            <>
                                <h2 style={{ ...styles.sectionTitle, marginTop: 32 }}>Module</h2>
                                <div style={styles.grid}>
                                    {modules.map((m, i) => (
                                        <div
                                            key={m.id}
                                            onClick={() => navigate(`/module/${m.id}`)}
                                            style={styles.card}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = 'translateY(-4px)'
                                                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.12)'
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = 'translateY(0)'
                                                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'
                                            }}
                                        >
                                            <div style={{ ...styles.cardAccent, background: ACCENTS[i % ACCENTS.length] }} />
                                            <div style={styles.cardIcon}>{ICONS[i % ICONS.length]}</div>
                                            <div style={styles.cardContent}>
                                                <h3 style={styles.cardTitle}>{m.title}</h3>
                                                <p style={styles.cardDesc}>{m.description}</p>
                                            </div>
                                            <div style={styles.cardArrow}>→</div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

const ROLE_CONFIG = {
    ELEV:     { label: 'Elev',     icon: '🎒' },
    PROFESOR: { label: 'Profesor', icon: '👩‍🏫' },
    EDITOR:   { label: 'Editor',  icon: '✏️' },
    ADMIN:    { label: 'Admin',   icon: '⚙️' },
}

const ACCENTS = ['#4F6BF6', '#1CB0F6', '#FF9600', '#FF4B4B', '#CE82FF']
const ICONS   = ['📚', '🔢', '🎯', '⭐', '🧠']

const styles = {
    page: { minHeight: '100vh', background: '#f0f2f5' },

    header: {
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {},
    logo: {
        fontSize: '1.3rem', fontWeight: 900,
        color: '#1a1d23', letterSpacing: '-0.5px',
    },
    headerRight: {
        display: 'flex', alignItems: 'center', gap: 16,
    },
    userInfo: {
        display: 'flex', alignItems: 'center', gap: 10,
    },
    avatar: {
        width: 38, height: 38,
        borderRadius: 10,
        background: '#f3f4f6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem',
    },
    userDetails: {
        display: 'flex', flexDirection: 'column',
    },
    userName: {
        fontSize: '0.85rem', fontWeight: 700, color: '#1a1d23',
    },
    userRole: {
        fontSize: '0.7rem', fontWeight: 600, color: '#9ca3af',
        textTransform: 'uppercase', letterSpacing: '0.5px',
    },
    logoutBtn: {
        background: 'none',
        border: '1.5px solid #e5e7eb',
        borderRadius: 8,
        padding: '6px 14px',
        fontSize: '0.8rem',
        fontWeight: 700,
        color: '#6b7280',
        cursor: 'pointer',
    },

    container: {
        maxWidth: 720, margin: '0 auto', padding: '28px 20px',
    },

    welcome: { marginBottom: 28 },
    welcomeTitle: {
        fontSize: '1.6rem', fontWeight: 900,
        color: '#1a1d23', marginBottom: 6,
    },
    welcomeSub: {
        fontSize: '0.95rem', color: '#6b7280', fontWeight: 600,
    },

    sectionTitle: {
        fontSize: '0.85rem', fontWeight: 800,
        color: '#9ca3af', letterSpacing: '1px',
        textTransform: 'uppercase', marginBottom: 14,
    },

    grid: {
        display: 'flex', flexDirection: 'column', gap: 10,
    },
    card: {
        background: 'white', borderRadius: 14,
        padding: '18px 18px 18px 0',
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid #f3f4f6',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        overflow: 'hidden',
    },
    cardAccent: {
        width: 5, alignSelf: 'stretch',
        borderRadius: '0 4px 4px 0', flexShrink: 0,
    },
    cardIcon: { fontSize: '1.8rem', flexShrink: 0 },
    cardContent: { flex: 1 },
    cardTitle: {
        fontSize: '0.95rem', fontWeight: 800,
        color: '#1a1d23', marginBottom: 3,
    },
    cardDesc: {
        fontSize: '0.82rem', color: '#6b7280',
        fontWeight: 600, lineHeight: 1.4,
    },
    cardArrow: {
        fontSize: '1.1rem', color: '#d1d5db',
        fontWeight: 700, flexShrink: 0, paddingRight: 4,
    },

    dashboardGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 14, marginBottom: 24,
    },
    statCard: {
        background: 'white', borderRadius: 14,
        padding: '20px 16px', textAlign: 'center',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid #f3f4f6',
    },
    statIcon: { fontSize: '1.5rem', marginBottom: 8 },
    statNumber: {
        fontSize: '1.8rem', fontWeight: 900, color: '#1a1d23',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: '0.75rem', fontWeight: 700,
        color: '#9ca3af', textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },

    devBanner: {
        display: 'flex', alignItems: 'flex-start', gap: 16,
        background: '#f8f9ff', border: '2px dashed #d1d9f6',
        borderRadius: 14, padding: '20px 20px',
        marginBottom: 24,
    },
    devIcon: { fontSize: '2rem', flexShrink: 0 },
    devTitle: {
        fontSize: '1rem', fontWeight: 800,
        color: '#1a1d23', marginBottom: 6,
    },
    devDesc: {
        fontSize: '0.85rem', color: '#6b7280',
        fontWeight: 500, lineHeight: 1.6,
    },

    emptyState: {
        background: 'white',
        borderRadius: 14,
        padding: '40px 24px',
        textAlign: 'center',
        border: '2px dashed #e5e7eb',
    },
    emptyIcon: {
        fontSize: '2.5rem',
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: '1rem',
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

    loadingWrap: {
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', minHeight: 200,
    },
    spinner: {
        width: 36, height: 36,
        border: '3px solid #e5e7eb',
        borderTop: '3px solid #4F6BF6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
}