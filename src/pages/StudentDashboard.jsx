import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { StatCard } from '../design-system/components';
import { cn } from '../design-system/cn';

export default function StudentDashboard() {
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([api.get('/progress/me/stats'), api.get('/progress/me')])
            .then(([s, h]) => { setStats(s.data); setHistory(h.data); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const formatDate = (d) => new Date(d).toLocaleDateString('ro-RO', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="mb-6">
                <h1 className="text-h2 font-bold text-neutral-900 mb-1">Progresul meu</h1>
                <p className="text-body text-neutral-500">Urmărește activitatea și punctele acumulate.</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <StatCard title="Exerciții rezolvate" value={String(stats?.completedExercises || 0)} icon="✅" />
                <StatCard title="Puncte acumulate" value={String(stats?.totalPoints || 0)} icon="⭐" />
                <StatCard title="Total încercări" value={String(stats?.totalSubmissions || 0)} icon="🎯" />
            </div>

            <p className="text-micro text-neutral-400 uppercase tracking-widest font-bold mb-3">
                Istoric activitate
            </p>

            {history.length === 0 ? (
                <div className="bg-white rounded-xl border-2 border-dashed border-neutral-200 p-12 text-center">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-body text-neutral-500 mb-4">
                        Nu ai rezolvat niciun exercițiu încă.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-body font-bold hover:bg-primary-700 transition-colors"
                    >
                        Începe să înveți
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {history.map(item => (
                        <div
                            key={item.id}
                            className="flex items-center gap-4 bg-white rounded-xl border border-neutral-200 p-4"
                        >
                            <div className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center text-body-lg font-bold flex-shrink-0',
                                item.correct
                                    ? 'bg-success-100 text-success-600'
                                    : 'bg-danger-100 text-danger-600'
                            )}>
                                {item.correct ? '✓' : '✗'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-body font-bold text-neutral-900">
                                    Exercițiul #{item.exerciseId}
                                </p>
                                <p className="text-caption text-neutral-400">
                                    Încercarea #{item.attemptNumber} · {formatDate(item.submittedAt)}
                                </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <span className={cn(
                                    'text-body-lg font-bold',
                                    item.pointsEarned > 0 ? 'text-success-600' : 'text-neutral-300'
                                )}>
                                    {item.pointsEarned > 0 ? `+${item.pointsEarned}` : '0'}
                                </span>
                                <p className="text-micro text-neutral-400">pct</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}