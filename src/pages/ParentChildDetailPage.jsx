import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Target, Trophy, TrendingUp, Clock, CheckCircle2, XCircle,
    BookOpen, AlertCircle, Users,
} from 'lucide-react';
import {
    Card, Avatar, Badge, ProgressBar, StatCard, EmptyState,
    Skeleton, Tabs, Button,
} from '../design-system/components';
import AppShell from '../components/layout/AppShell';
import { parentDashboardApi } from '../api/parentDashboardApi';
import { timeAgo, formatDate, formatNumber } from '../utils/formatters';
import { notify } from '../design-system/toast';

const formatMinutes = (minutes) => {
    if (!minutes) return '0m';
    if (minutes >= 60) {
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
};

const ParentChildDetailPage = () => {
    const { childId } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [tab, setTab] = useState('overview');

    const user = JSON.parse(localStorage.getItem('user') || 'null');

    useEffect(() => {
        setLoading(true);
        parentDashboardApi.getChildDetail(childId)
            .then((res) => {
                setData(res);
                setLoading(false);
            })
            .catch((err) => {
                setError(err?.response?.data?.message || 'Nu am putut incarca datele');
                setLoading(false);
                notify.error('Nu am putut incarca detaliile');
            });
    }, [childId]);

    const successRate = data?.successRate ?? 0;

    return (
        <AppShell
            user={user}
            title="Detaliu copil"
            back={{ to: '/parinte' }}
        >
            {loading && (
                <div className="space-y-6">
                    <Skeleton variant="card" height={140} />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} variant="card" height={120} />
                        ))}
                    </div>
                </div>
            )}

            {error && !loading && (
                <Card>
                    <EmptyState
                        icon={AlertCircle}
                        variant="warm"
                        title="A aparut o eroare"
                        description={error}
                    />
                </Card>
            )}

            {!loading && !error && data && (
                <>
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card variant="warm" padding="lg" className="mb-6">
                            <div className="flex items-start gap-5 flex-wrap">
                                <Avatar name={data.childName} size="2xl" />
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-h1 text-neutral-900">{data.childName}</h1>
                                    <p className="text-body text-neutral-600 mt-0.5">{data.childEmail}</p>
                                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                                        {data.classroomProgress?.map((cp) => (
                                            <Badge key={cp.classroomId} variant="warm" icon={Users}>
                                                {cp.classroomName}
                                            </Badge>
                                        ))}
                                        {data.lastActivityAt && (
                                            <Badge variant="neutral" icon={Clock}>
                                                Ultima activitate {timeAgo(data.lastActivityAt)}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <StatCard
                            label="Exercitii"
                            value={formatNumber(data.totalAttempts)}
                            icon={Target}
                            variant="primary"
                            hint={`${data.correctAttempts} corecte`}
                        />
                        <StatCard
                            label="Exercitii distincte"
                            value={data.distinctExercisesCompleted}
                            icon={BookOpen}
                            variant="accent"
                        />
                        <StatCard
                            label="Puncte"
                            value={formatNumber(data.totalPoints)}
                            icon={Trophy}
                            variant="warm"
                        />
                        <StatCard
                            label="Timp petrecut"
                            value={formatMinutes(data.totalMinutesSpent)}
                            icon={Clock}
                            variant="success"
                        />
                    </div>

                    <Tabs
                        value={tab}
                        onChange={setTab}
                        variant="underline"
                        className="mb-6"
                        options={[
                            { value: 'overview', label: 'Clase & progres', icon: Users },
                            { value: 'history', label: 'Istoric', icon: Clock, badge: data.recentAttempts?.length },
                            { value: 'time', label: 'Timp petrecut', icon: TrendingUp, badge: data.quizTimeList?.length },
                        ]}
                    />

                    {tab === 'overview' && (
                        <ClassroomProgressList classrooms={data.classroomProgress} />
                    )}

                    {tab === 'history' && (
                        <RecentAttemptsList attempts={data.recentAttempts} />
                    )}

                    {tab === 'time' && (
                        <TimeSessionsList sessions={data.quizTimeList} />
                    )}
                </>
            )}
        </AppShell>
    );
};

const ClassroomProgressList = ({ classrooms }) => {
    if (!classrooms || classrooms.length === 0) {
        return (
            <Card>
                <EmptyState
                    icon={Users}
                    variant="primary"
                    title="Nu e inscris in nicio clasa inca"
                    description="Contacteaza administratorul scolii pentru a-l inscrie intr-o clasa."
                    size="sm"
                />
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {classrooms.map((c, index) => {
                const completionRate = c.assignedQuizzes > 0
                    ? Math.round((c.completedQuizzes / c.assignedQuizzes) * 100)
                    : 0;

                return (
                    <motion.div
                        key={c.classroomId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card padding="md">
                            <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                                <div className="min-w-0">
                                    <h3 className="text-h3 text-neutral-900">{c.classroomName}</h3>
                                    <p className="text-caption text-neutral-500 mt-0.5">
                                        {c.completedQuizzes} din {c.assignedQuizzes} quiz-uri completate
                                    </p>
                                </div>
                                <Badge variant="warm">
                                    {formatNumber(c.totalPointsInClassroom)} pct
                                </Badge>
                            </div>
                            <ProgressBar
                                value={completionRate}
                                variant={completionRate >= 75 ? 'success' : 'primary'}
                                showLabel
                            />
                        </Card>
                    </motion.div>
                );
            })}
        </div>
    );
};

const RecentAttemptsList = ({ attempts }) => {
    if (!attempts || attempts.length === 0) {
        return (
            <Card>
                <EmptyState
                    icon={Clock}
                    variant="neutral"
                    title="Nicio activitate inca"
                    description="Pe masura ce copilul rezolva exercitii, activitatea va aparea aici."
                    size="sm"
                />
            </Card>
        );
    }

    return (
        <Card padding="none">
            <div className="divide-y divide-neutral-100">
                {attempts.map((a, index) => (
                    <motion.div
                        key={a.attemptId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-4 flex items-center gap-4 hover:bg-neutral-50 transition-colors"
                    >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            a.correct ? 'bg-success-100' : 'bg-danger-100'
                        }`}>
                            {a.correct ? (
                                <CheckCircle2 className="w-6 h-6 text-success-600" />
                            ) : (
                                <XCircle className="w-6 h-6 text-danger-600" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="text-body font-semibold text-neutral-900 truncate">
                                {a.exerciseTitle}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-caption text-neutral-500">
                                <span>Tentativa #{a.attemptNumber}</span>
                                <span>·</span>
                                <span>{timeAgo(a.submittedAt)}</span>
                            </div>
                        </div>

                        <div className="flex-shrink-0 text-right">
                            <div className={`font-display font-bold text-h3 ${
                                a.pointsEarned > 0 ? 'text-success-700' : 'text-neutral-400'
                            }`}>
                                {a.pointsEarned > 0 ? `+${a.pointsEarned}` : '0'}
                            </div>
                            <div className="text-caption text-neutral-500">puncte</div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </Card>
    );
};

const TimeSessionsList = ({ sessions }) => {
    if (!sessions || sessions.length === 0) {
        return (
            <Card>
                <EmptyState
                    icon={Clock}
                    variant="neutral"
                    title="Nicio sesiune finalizata"
                    description="Timpul petrecut apare dupa ce copilul finalizeaza un quiz."
                    size="sm"
                />
            </Card>
        );
    }

    const totalMinutes = sessions.reduce((sum, s) => sum + s.minutesSpent, 0);
    const avgMinutes = Math.round(totalMinutes / sessions.length);

    return (
        <>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <Card padding="md">
                    <p className="text-caption text-neutral-500 mb-1">Total sesiuni</p>
                    <p className="text-h2 font-bold text-neutral-900">{sessions.length}</p>
                </Card>
                <Card padding="md">
                    <p className="text-caption text-neutral-500 mb-1">Timp mediu / sesiune</p>
                    <p className="text-h2 font-bold text-neutral-900">{formatMinutes(avgMinutes)}</p>
                </Card>
            </div>

            <Card padding="none">
                <div className="divide-y divide-neutral-100">
                    {sessions.map((session, index) => (
                        <motion.div
                            key={session.attemptId}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="p-4 flex items-center gap-4 hover:bg-neutral-50 transition-colors"
                        >
                            <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                                <Clock className="w-5 h-5 text-primary-600" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="text-body font-semibold text-neutral-900 truncate">
                                    {session.quizTitle}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-caption text-neutral-500">
                                    <span>{formatDate(session.startedAt)}</span>
                                    <span>·</span>
                                    <span>
                                        {session.status === 'COMPLETED' ? 'Finalizat' : 'În progres'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-shrink-0 text-right">
                                <div className="font-display font-bold text-h3 text-primary-700">
                                    {formatMinutes(session.minutesSpent)}
                                </div>
                                <div className="text-caption text-neutral-500">timp</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Card>
        </>
    );
};

export default ParentChildDetailPage;