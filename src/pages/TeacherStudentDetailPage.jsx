import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Target, Trophy, TrendingUp, Clock,
    CheckCircle2, XCircle, BookOpen, AlertCircle,
} from 'lucide-react';
import {
    Card, Avatar, Badge, StatCard, EmptyState, Skeleton, Tabs,
} from '../design-system/components';
import { cn } from '../design-system/cn';
import api from '../api/axios';
import { timeAgo, formatNumber } from '../utils/formatters';

export default function TeacherStudentDetailPage() {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [student, setStudent] = useState(null);
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [tab, setTab] = useState('history');

    useEffect(() => {
        Promise.all([
            api.get(`/users/${studentId}`),
            api.get(`/progress/student/${studentId}/stats`),
            api.get(`/progress/student/${studentId}`),
        ])
            .then(([u, s, h]) => {
                setStudent(u.data);
                setStats(s.data);
                setHistory(h.data);
            })
            .catch(err => setError(
                err?.response?.data?.message || 'Eroare la încărcarea datelor'
            ))
            .finally(() => setLoading(false));
    }, [studentId]);

    if (loading) return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <Skeleton variant="card" height={140} />
            <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="card" height={120} />)}
            </div>
        </div>
    );

    if (error) return (
        <div className="max-w-3xl mx-auto">
            <Card>
                <EmptyState
                    icon={AlertCircle}
                    variant="warm"
                    title="Nu există date de afișat pentru acest rol.rut o eroare"
                    description={error}
                    action={
                        <button
                            onClick={() => navigate(-1)}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-body font-bold"
                        >
                            Înapoi
                        </button>
                    }
                />
            </Card>
        </div>
    );

    const successRate = stats?.totalSubmissions > 0
        ? Math.round((stats.completedExercises / stats.totalSubmissions) * 100)
        : 0;

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            {/* Back */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-body font-semibold text-neutral-500 hover:text-neutral-800 transition-colors mb-6"
            >
                ← Înapoi
            </button>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card variant="cool" padding="lg" className="mb-6">
                    <div className="flex items-center gap-4">
                        <Avatar name={student?.name} size="xl" />
                        <div>
                            <h1 className="text-h2 font-bold text-neutral-900">
                                {student?.name}
                            </h1>
                            <p className="text-body text-neutral-500">{student?.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="primary">{student?.role}</Badge>
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                    label="Exerciții"
                    value={String(stats?.totalSubmissions || 0)}
                    icon={Target}
                    variant="primary"
                />
                <StatCard
                    label="Rezolvate"
                    value={String(stats?.completedExercises || 0)}
                    icon={BookOpen}
                    variant="success"
                />
                <StatCard
                    label="Puncte"
                    value={formatNumber(stats?.totalPoints || 0)}
                    icon={Trophy}
                    variant="warning"
                />
                <StatCard
                    label="Rată succes"
                    value={`${successRate}%`}
                    icon={TrendingUp}
                    variant="accent"
                />
            </div>
            <Tabs
                value={tab}
                onChange={setTab}
                variant="underline"
                className="mb-6"
                options={[
                    { value: 'history', label: 'Istoric încercări', icon: Clock, badge: history.length },
                ]}
            />

            {tab === 'history' && (
                history.length === 0 ? (
                    <Card>
                        <EmptyState
                            icon={Clock}
                            variant="neutral"
                            title="Nicio activitate încă"
                            description="Elevul nu a rezolvat niciun exercițiu."
                            size="sm"
                        />
                    </Card>
                ) : (
                    <Card padding="none">
                        <div className="divide-y divide-neutral-100">
                            {history.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="p-4 flex items-center gap-4 hover:bg-neutral-50 transition-colors"
                                >
                                    <div className={cn(
                                        'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
                                        item.correct ? 'bg-success-100' : 'bg-danger-100'
                                    )}>
                                        {item.correct
                                            ? <CheckCircle2 className="w-6 h-6 text-success-600" />
                                            : <XCircle className="w-6 h-6 text-danger-600" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-body font-semibold text-neutral-900">
                                            Exercițiul #{item.exerciseId}
                                        </p>
                                        <p className="text-caption text-neutral-500">
                                            Încercarea #{item.attemptNumber} · {timeAgo(item.submittedAt)}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <span className={cn(
                                            'text-h3 font-bold',
                                            item.pointsEarned > 0 ? 'text-success-700' : 'text-neutral-400'
                                        )}>
                                            {item.pointsEarned > 0 ? `+${item.pointsEarned}` : '0'}
                                        </span>
                                        <p className="text-caption text-neutral-500">puncte</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </Card>
                )
            )}
        </div>
    );
}