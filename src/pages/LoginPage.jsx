import { useState } from 'react';
import api from '../api/axios';
import { cn } from '../design-system/cn';

const ROLE_REDIRECTS = {
    PARINTE:  '/parinte',
    PROFESOR: '/clase',
    ADMIN:    '/clase',
    EDITOR:   '/',
    ELEV:     '/',
};

export default function LoginPage() {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            const userRes = await api.get('/auth/me');
            localStorage.setItem('user', JSON.stringify(userRes.data));
            window.location.href = ROLE_REDIRECTS[userRes.data.role] || '/';
        } catch (err) {
            setError(err.response?.data?.message || 'Email sau parolă incorectă');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary-200 opacity-20 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-accent-200 opacity-20 blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden flex">

                {/* Brand side */}
                <div className="hidden md:flex flex-col justify-center w-80 flex-shrink-0 bg-gradient-to-br from-neutral-900 to-neutral-700 p-10">
                    <div className="text-5xl mb-4">🎓</div>
                    <h1 className="text-h1 font-bold text-white mb-3 leading-tight">EduPlatform</h1>
                    <p className="text-body text-neutral-400 mb-8 leading-relaxed">
                        Platformă educațională interactivă pentru copii.
                    </p>
                    <div className="flex flex-col gap-4">
                        {[
                            { icon: '📚', text: 'Exerciții interactive' },
                            { icon: '📊', text: 'Progres în timp real' },
                            { icon: '🏆', text: 'Feedback și recompense' },
                        ].map(f => (
                            <div key={f.text} className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-lg flex-shrink-0">
                                    {f.icon}
                                </div>
                                <span className="text-body text-neutral-300 font-semibold">{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form side */}
                <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
                    <div className="mb-8">
                        <h2 className="text-h2 font-bold text-neutral-900 mb-1">
                            Bine ai revenit!
                        </h2>
                        <p className="text-body text-neutral-500">
                            Conectează-te pentru a continua
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-danger-50 border border-danger-200 text-danger-700 rounded-md px-4 py-3 text-body font-semibold mb-5">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <Field label="Email">
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                placeholder="email@exemplu.ro"
                                className={inputCls}
                                autoFocus
                            />
                        </Field>

                        <Field label="Parolă">
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className={inputCls}
                            />
                        </Field>

                        <button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                'w-full py-3 rounded-lg text-body-lg font-bold text-white transition-all mt-2',
                                'bg-gradient-to-r from-primary-600 to-primary-500',
                                'hover:from-primary-700 hover:to-primary-600 hover:shadow-glow-primary',
                                'active:scale-[0.98]',
                                loading && 'opacity-60 cursor-not-allowed'
                            )}
                        >
                            {loading ? 'Se procesează...' : 'Conectează-te'}
                        </button>
                    </form>

                    <p className="text-center text-caption text-neutral-400 mt-8">
                        Contul tău este creat de administratorul platformei.
                    </p>
                </div>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-caption font-bold text-neutral-700 uppercase tracking-wide">
                {label}
            </label>
            {children}
        </div>
    );
}

const inputCls = [
    'w-full px-4 py-2.5 rounded-lg border-2 border-neutral-200 bg-white',
    'text-body text-neutral-900 placeholder-neutral-400',
    'focus:outline-none focus:border-primary-400 transition-colors',
    'font-sans',
].join(' ');