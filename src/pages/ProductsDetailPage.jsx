import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'

export default function ProductDetailPage() {
    const { productId } = useParams()
    const [product, setProduct] = useState(null)
    const [modules, setModules] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        Promise.all([
            api.get(`/products/${productId}`),
            api.get(`/modules/product/${productId}`)
        ])
            .then(([productRes, modulesRes]) => {
                setProduct(productRes.data)
                setModules(modulesRes.data)
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }, [productId])

    if (loading) return (
        <div style={styles.loadingWrap}>
            <div style={styles.spinner} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )

    if (!product) return null

    return (
        <div style={styles.container}>
            <button onClick={() => navigate('/')} style={styles.backBtn}>
                ← Inapoi la produse
            </button>

            <div style={styles.hero}>
                {product.coverImageUrl ? (
                    <div style={styles.heroCover}>
                        <img src={product.coverImageUrl} alt={product.title} style={styles.heroCoverImg} />
                    </div>
                ) : (
                    <div style={{ ...styles.heroCover, ...styles.heroCoverPlaceholder }}>📚</div>
                )}

                <div style={styles.heroBody}>
                    <div style={styles.tags}>
                        {product.subject && <span style={styles.tag}>{product.subject}</span>}
                        {product.targetAgeGroup && (
                            <span style={{ ...styles.tag, background: '#fef9c3', color: '#854d0e' }}>
                {product.targetAgeGroup}
              </span>
                        )}
                    </div>
                    <h1 style={styles.heroTitle}>{product.title}</h1>
                    <p style={styles.heroDesc}>{product.description}</p>
                    <div style={styles.heroStats}>
                        <div style={styles.stat}>
                            <span style={styles.statNum}>{modules.length}</span>
                            <span style={styles.statLabel}>module</span>
                        </div>
                    </div>
                </div>
            </div>

            <h2 style={styles.sectionTitle}>Module disponibile</h2>

            {modules.length === 0 ? (
                <div style={styles.empty}>
                    <p>Nu exista module disponibile pentru acest produs.</p>
                </div>
            ) : (
                <div style={styles.modulesList}>
                    {modules.map((m, i) => (
                        <div
                            key={m.id}
                            onClick={() => navigate(`/module/${m.id}`)}
                            style={styles.moduleCard}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-3px)'
                                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'
                            }}
                        >
                            <div style={{ ...styles.moduleAccent, background: ACCENTS[i % ACCENTS.length] }} />
                            <div style={styles.moduleIcon}>{ICONS[i % ICONS.length]}</div>
                            <div style={styles.moduleBody}>
                                <span style={styles.moduleNum}>Modul {i + 1}</span>
                                <h3 style={styles.moduleTitle}>{m.title}</h3>
                                <p style={styles.moduleDesc}>{m.description}</p>
                            </div>
                            <div style={styles.moduleArrow}>→</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

const ACCENTS = ['#4F6BF6', '#1CB0F6', '#FF9600', '#FF4B4B', '#CE82FF', '#22c55e']
const ICONS = ['📚', '🔢', '🎯', '⭐', '🧠', '🎨']

const styles = {
    container: {
        maxWidth: 900,
        margin: '0 auto',
        padding: '24px 20px',
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
        marginBottom: 20,
    },
    hero: {
        background: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid #f3f4f6',
        display: 'flex',
        marginBottom: 32,
    },
    heroCover: {
        width: 240,
        flexShrink: 0,
        overflow: 'hidden',
    },
    heroCoverImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    heroCoverPlaceholder: {
        background: 'linear-gradient(135deg, #4F6BF6, #8B5CF6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '4rem',
        color: 'white',
    },
    heroBody: {
        padding: '24px 28px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    tags: {
        display: 'flex',
        gap: 8,
        marginBottom: 10,
        flexWrap: 'wrap',
    },
    tag: {
        background: '#dbeafe',
        color: '#1e40af',
        fontSize: '0.72rem',
        fontWeight: 800,
        padding: '4px 12px',
        borderRadius: 20,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    heroTitle: {
        fontSize: '1.6rem',
        fontWeight: 900,
        color: '#1a1d23',
        marginBottom: 8,
        lineHeight: 1.2,
    },
    heroDesc: {
        fontSize: '0.95rem',
        color: '#6b7280',
        fontWeight: 500,
        lineHeight: 1.6,
        marginBottom: 16,
    },
    heroStats: {
        display: 'flex',
        gap: 20,
        marginTop: 'auto',
    },
    stat: {
        display: 'flex',
        flexDirection: 'column',
    },
    statNum: {
        fontSize: '1.4rem',
        fontWeight: 900,
        color: '#4F6BF6',
    },
    statLabel: {
        fontSize: '0.75rem',
        color: '#9ca3af',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    sectionTitle: {
        fontSize: '0.85rem',
        fontWeight: 800,
        color: '#9ca3af',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        marginBottom: 16,
    },
    modulesList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    moduleCard: {
        background: 'white',
        borderRadius: 14,
        padding: '18px 18px 18px 0',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid #f3f4f6',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        overflow: 'hidden',
    },
    moduleAccent: {
        width: 5,
        alignSelf: 'stretch',
        flexShrink: 0,
    },
    moduleIcon: {
        fontSize: '1.8rem',
        flexShrink: 0,
    },
    moduleBody: {
        flex: 1,
    },
    moduleNum: {
        fontSize: '0.7rem',
        fontWeight: 800,
        color: '#9ca3af',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
    },
    moduleTitle: {
        fontSize: '1rem',
        fontWeight: 800,
        color: '#1a1d23',
        marginTop: 2,
        marginBottom: 3,
    },
    moduleDesc: {
        fontSize: '0.85rem',
        color: '#6b7280',
        fontWeight: 500,
        lineHeight: 1.4,
    },
    moduleArrow: {
        fontSize: '1.1rem',
        color: '#d1d5db',
        fontWeight: 700,
        flexShrink: 0,
        paddingRight: 8,
    },
    empty: {
        padding: 40,
        textAlign: 'center',
        color: '#9ca3af',
        background: 'white',
        borderRadius: 14,
        border: '1px solid #f3f4f6',
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