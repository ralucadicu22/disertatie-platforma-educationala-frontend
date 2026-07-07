import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const ROLES = [
    { value: 'ELEV',     label: 'Elev',      icon: '🎒' },
    { value: 'PROFESOR', label: 'Profesor',   icon: '👩‍🏫' },
    { value: 'EDITOR',   label: 'Editor',     icon: '✏️' },
    { value: 'ADMIN',    label: 'Admin',      icon: '⚙️' },
]

export default function LoginPage() {
    const [email, setEmail]       = useState('')
    const [password, setPassword] = useState('')
    const [isLogin, setIsLogin]   = useState(true)
    const [name, setName]         = useState('')
    const [role, setRole]         = useState('ELEV')
    const [loading, setLoading]   = useState(false)
    const [error, setError]       = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register'
            const payload = isLogin
                ? { email, password }
                : { email, password, name, role }

            const res = await api.post(endpoint, payload)
            localStorage.setItem('token', res.data.token)

            const userRes = await api.get('/auth/me')
            localStorage.setItem('user', JSON.stringify(userRes.data))

            window.location.href = '/'
        } catch (err) {
            setError(err.response?.data?.message || 'Eroare la autentificare')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={styles.page}>

            <div style={styles.bgCircle1} />
            <div style={styles.bgCircle2} />
            <div style={styles.bgCircle3} />

            <div style={styles.wrapper}>

                <div style={styles.brandSide}>
                    <div style={styles.brandContent}>
                        <div style={styles.logoIcon}>🎓</div>
                        <h1 style={styles.brandTitle}>EduPlatform</h1>
                        <p style={styles.brandSub}>
                            Platforma educationala interactiva pentru copii.
                        </p>
                        <div style={styles.features}>
                            <div style={styles.feature}>
                                <span style={styles.featureIcon}>📚</span>
                                <span style={styles.featureText}>Exercitii interactive</span>
                            </div>
                            <div style={styles.feature}>
                                <span style={styles.featureIcon}>📊</span>
                                <span style={styles.featureText}>Progres in timp real</span>
                            </div>
                            <div style={styles.feature}>
                                <span style={styles.featureIcon}>🏆</span>
                                <span style={styles.featureText}>Feedback si recompense</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={styles.formSide}>
                    <div style={styles.formHeader}>
                        <h2 style={styles.formTitle}>
                            {isLogin ? 'Bine ai revenit!' : 'Creeaza un cont'}
                        </h2>
                        <p style={styles.formSub}>
                            {isLogin
                                ? 'Conecteaza-te pentru a continua'
                                : 'Inregistreaza-te si incepe sa inveti'}
                        </p>
                    </div>

                    {error && (
                        <div style={styles.error}>
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={styles.form}>
                        {!isLogin && (
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Nume complet</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    style={styles.input}
                                    onFocus={e => e.target.style.borderColor = '#4F6BF6'}
                                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                />
                            </div>
                        )}

                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                style={styles.input}
                                onFocus={e => e.target.style.borderColor = '#4F6BF6'}
                                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            />
                        </div>

                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Parola</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                style={styles.input}
                                onFocus={e => e.target.style.borderColor = '#4F6BF6'}
                                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            />
                        </div>

                        {!isLogin && (
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Selecteaza rolul</label>
                                <div style={styles.rolesGrid}>
                                    {ROLES.map(r => (
                                        <div
                                            key={r.value}
                                            onClick={() => setRole(r.value)}
                                            style={{
                                                ...styles.roleCard,
                                                borderColor: role === r.value ? '#4F6BF6' : '#e5e7eb',
                                                background: role === r.value ? '#f0f3ff' : 'white',
                                            }}
                                        >
                                            <span style={styles.roleIcon}>{r.icon}</span>
                                            <span style={{
                                                ...styles.roleLabel,
                                                color: role === r.value ? '#4F6BF6' : '#374151',
                                            }}>
                        {r.label}
                      </span>
                                            <span style={styles.roleDesc}>{r.desc}</span>
                                            {role === r.value && <div style={styles.roleCheck}>✓</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                ...styles.button,
                                opacity: loading ? 0.6 : 1,
                            }}
                        >
                            {loading
                                ? 'Se proceseaza...'
                                : isLogin
                                    ? 'Conecteaza-te'
                                    : 'Creeaza contul'}
                        </button>
                    </form>

                    <div style={styles.divider}>
                        <div style={styles.dividerLine} />
                        <span style={styles.dividerText}>sau</span>
                        <div style={styles.dividerLine} />
                    </div>

                    <p style={styles.toggle}>
                        {isLogin ? 'Nu ai un cont? ' : 'Ai deja un cont? '}
                        <span
                            onClick={() => {
                                setIsLogin(!isLogin)
                                setError('')
                            }}
                            style={styles.link}
                        >
              {isLogin ? 'Inregistreaza-te' : 'Conecteaza-te'}
            </span>
                    </p>
                </div>
            </div>
        </div>
    )
}

const styles = {
    page: {
        minHeight: '100vh',
        background: '#f0f2f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
    },
    bgCircle1: {
        position: 'absolute',
        width: 600, height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,107,246,0.08) 0%, transparent 70%)',
        top: -200, right: -100,
    },
    bgCircle2: {
        position: 'absolute',
        width: 400, height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,107,246,0.06) 0%, transparent 70%)',
        bottom: -100, left: -100,
    },
    bgCircle3: {
        position: 'absolute',
        width: 300, height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
    },
    wrapper: {
        display: 'flex',
        maxWidth: 900,
        width: '100%',
        background: 'white',
        borderRadius: 24,
        boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
    },
    brandSide: {
        flex: '0 0 340px',
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        padding: '48px 32px',
        display: 'flex',
        alignItems: 'center',
    },
    brandContent: {
        color: 'white',
    },
    logoIcon: {
        fontSize: '3rem',
        marginBottom: 16,
    },
    brandTitle: {
        fontSize: '1.8rem',
        fontWeight: 900,
        marginBottom: 12,
        letterSpacing: '-0.5px',
    },
    brandSub: {
        fontSize: '0.9rem',
        fontWeight: 500,
        lineHeight: 1.6,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 32,
    },
    features: {
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
    },
    feature: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    },
    featureIcon: {
        fontSize: '1.2rem',
        width: 36, height: 36,
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    featureText: {
        fontSize: '0.85rem',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.85)',
    },
    formSide: {
        flex: 1,
        padding: '40px 36px',
        overflowY: 'auto',
        maxHeight: '90vh',
    },
    formHeader: {
        marginBottom: 24,
    },
    formTitle: {
        fontSize: '1.5rem',
        fontWeight: 800,
        color: '#1a1d23',
        marginBottom: 6,
    },
    formSub: {
        fontSize: '0.9rem',
        color: '#6b7280',
        fontWeight: 500,
    },
    error: {
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
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
    },
    label: {
        fontSize: '0.8rem',
        fontWeight: 700,
        color: '#374151',
        letterSpacing: '0.3px',
    },
    input: {
        padding: '11px 14px',
        border: '2px solid #e5e7eb',
        borderRadius: 10,
        fontSize: '0.9rem',
        fontFamily: 'inherit',
        outline: 'none',
        transition: 'border-color 0.2s',
        color: '#1a1d23',
    },
    rolesGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        marginTop: 4,
    },
    roleCard: {
        border: '2px solid #e5e7eb',
        borderRadius: 12,
        padding: '12px 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        textAlign: 'center',
    },
    roleIcon: {
        fontSize: '1.3rem',
    },
    roleLabel: {
        fontSize: '0.8rem',
        fontWeight: 700,
    },
    roleDesc: {
        fontSize: '0.65rem',
        color: '#9ca3af',
        fontWeight: 500,
        lineHeight: 1.3,
    },
    roleCheck: {
        position: 'absolute',
        top: 6, right: 6,
        width: 18, height: 18,
        borderRadius: '50%',
        background: '#4F6BF6',
        color: 'white',
        fontSize: '0.65rem',
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        padding: '13px 20px',
        background: '#4F6BF6',
        color: 'white',
        border: 'none',
        borderRadius: 10,
        fontSize: '1rem',
        fontWeight: 800,
        cursor: 'pointer',
        boxShadow: '0 4px 0 #3d55d4',
        transition: 'transform 0.1s',
        marginTop: 4,
    },
    divider: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        margin: '20px 0',
    },
    dividerLine: {
        flex: 1,
        height: 1,
        background: '#e5e7eb',
    },
    dividerText: {
        fontSize: '0.8rem',
        color: '#9ca3af',
        fontWeight: 600,
    },
    toggle: {
        textAlign: 'center',
        fontSize: '0.9rem',
        color: '#6b7280',
        fontWeight: 600,
    },
    link: {
        color: '#4F6BF6',
        cursor: 'pointer',
        fontWeight: 800,
    },
}
