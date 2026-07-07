import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function ProductsPage() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        api.get('/products')
            .then(res => setProducts(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }, [])

    return (
        <div style={styles.container}>
            <h2 style={styles.sectionTitle}>Produse educationale</h2>

            {loading ? (
                <div style={styles.loadingWrap}>
                    <div style={styles.spinner} />
                    <p style={styles.loadingText}>Se incarca produsele...</p>
                </div>
            ) : (
                <div style={styles.grid}>
                    {products.map(p => (
                        <div
                            key={p.id}
                            onClick={() => navigate(`/product/${p.id}`)}
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
                            {p.coverImageUrl ? (
                                <div style={styles.cover}>
                                    <img src={p.coverImageUrl} alt={p.title} style={styles.coverImg} />
                                </div>
                            ) : (
                                <div style={{ ...styles.cover, ...styles.coverPlaceholder }}>
                                    📚
                                </div>
                            )}

                            <div style={styles.cardBody}>
                                <div style={styles.tags}>
                                    {p.subject && <span style={styles.tag}>{p.subject}</span>}
                                    {p.targetAgeGroup && (
                                        <span style={{ ...styles.tag, background: '#fef9c3', color: '#854d0e' }}>
                      {p.targetAgeGroup}
                    </span>
                                    )}
                                </div>
                                <h3 style={styles.cardTitle}>{p.title}</h3>
                                <p style={styles.cardDesc}>{p.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

const styles = {
    container: {
        maxWidth: 1100,
        margin: '0 auto',
        padding: '28px 20px',
    },
    sectionTitle: {
        fontSize: '0.85rem',
        fontWeight: 800,
        color: '#9ca3af',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        marginBottom: 20,
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 18,
    },
    card: {
        background: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid #f3f4f6',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
    },
    cover: {
        width: '100%',
        height: 160,
        overflow: 'hidden',
    },
    coverImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    coverPlaceholder: {
        background: 'linear-gradient(135deg, #4F6BF6 0%, #8B5CF6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '3.5rem',
    },
    cardBody: {
        padding: '16px 18px 18px',
    },
    tags: {
        display: 'flex',
        gap: 6,
        marginBottom: 8,
        flexWrap: 'wrap',
    },
    tag: {
        background: '#dbeafe',
        color: '#1e40af',
        fontSize: '0.7rem',
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: 20,
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
    },
    cardTitle: {
        fontSize: '1.05rem',
        fontWeight: 800,
        color: '#1a1d23',
        marginBottom: 6,
        lineHeight: 1.3,
    },
    cardDesc: {
        fontSize: '0.85rem',
        color: '#6b7280',
        fontWeight: 500,
        lineHeight: 1.5,
    },
    loadingWrap: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: 200,
        gap: 16,
    },
    spinner: {
        width: 36,
        height: 36,
        border: '3px solid #e5e7eb',
        borderTop: '3px solid #4F6BF6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
    loadingText: {
        color: '#9ca3af',
        fontWeight: 600,
        fontSize: '0.9rem',
    },
}