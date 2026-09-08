import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Users, Target, Trophy, TrendingUp, ChevronRight,
    UserRound, AlertCircle, Clock,
} from 'lucide-react';
import {
    Card, Avatar, Badge, ProgressRing, StatCard, EmptyState,
    Skeleton, Button,
} from '../design-system/components';

import { parentDashboardApi } from '../api/parentDashboardApi';
import { timeAgo, formatNumber } from '../utils/formatters';
import { notify } from '../design-system/toast';

const ParentOverviewPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const user = JSON.parse(localStorage.getItem('user') || 'null');

    useEffect(() => {
        parentDashboardApi.getOverview()
            .then((res) => {
                setData(res);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError(err?.response?.data?.message || 'Nu am putut incarca datele');
                setLoading(false);
                notify.error('Nu am putut incarca dashboard-ul');
            });
    }, []);

    const totals = data?.children?.reduce(
        (acc, c) => ({
            attempts: acc.attempts + (c.totalAttempts || 0),
            correct: acc.correct + (c.correctAttempts || 0),
            points: acc.points + (c.totalPoints || 0),
        }),
        { attempts: 0, correct: 0, points: 0 },
    );

    const overallSuccess = totals?.attempts > 0
        ? Math.round((totals.correct / totals.attempts) * 100)
        : 0;

    return (
        <div user={user} title="Dashboard parinte">
            <div className="mb-6">
                <h1 className="text-h1 text-neutral-900">
                    Salut, {user?.name || 'parinte'}!
                </h1>
                <p className="text-body-lg text-neutral-600 mt-1">
                    Uite cum se descurca copiii tai in aceasta perioada.
                </p>
            </div>

            {loading && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} variant="card" height={140} />
                        ))}
                    </div>
                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <Skeleton key={i} variant="card" height={180} />
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
                        action={<Button variant="primary" onClick={() => window.location.reload()}>Reincarca</Button>}
                    />
                </Card>
            )}

            {!loading && !error && data?.children?.length === 0 && (
                <Card>
                    <EmptyState
                        icon={UserRound}
                        variant="primary"
                        title="Nu ai copii asociati inca"
                        description="Contacteaza administratorul scolii pentru a asocia copiii tai la contul tau."
                    />
                </Card>
            )}

            {!loading && !error && data?.children?.length > 0 && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <StatCard
                            label="Copii"
                            value={data.childrenCount}
                            icon={Users}
                            variant="primary"
                        />
                        <StatCard
                            label="Exercitii totale"
                            value={formatNumber(totals.attempts)}
                            icon={Target}
                            variant="accent"
                            hint={`${totals.correct} rezolvate corect`}
                        />
                        <StatCard
                            label="Puncte cumulate"
                            value={formatNumber(totals.points)}
                            icon={Trophy}
                            variant="warm"
                        />
                        <StatCard
                            label="Rata succes"
                            value={overallSuccess}
                            suffix="%"
                            icon={TrendingUp}
                            variant="success"
                            progress={overallSuccess}
                        />
                    </div>

                    <div>
                        <h2 className="text-h2 text-neutral-900 mb-4">
                            Copiii tai
                        </h2>
                        <div className="space-y-3">
                            {data.children.map((child, index) => (
                                <ChildCard
                                    key={child.childId}
                                    child={child}
                                    index={index}
                                    onClick={() => navigate(`/parinte/copil/${child.childId}`)}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const ChildCard = ({ child, index, onClick }) => {
    const successRate = child.successRate ?? 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
        >
            <Card interactive onClick={onClick} padding="none">
                <div className="p-5 flex items-center gap-4">
                    <Avatar name={child.childName} size="xl" />

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-h3 text-neutral-900 truncate">
                                {child.childName}
                            </h3>
                            {child.classroomNames?.slice(0, 2).map((name) => (
                                <Badge key={name} variant="primary" size="sm">
                                    {name}
                                </Badge>
                            ))}
                            {child.classroomNames?.length > 2 && (
                                <Badge variant="neutral" size="sm">
                                    +{child.classroomNames.length - 2}
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                            <div className="flex items-center gap-1.5 text-caption text-neutral-600">
                                <Target className="w-4 h-4 text-primary-500" />
                                <span className="font-semibold text-neutral-800">
                                    {child.correctAttempts}
                                </span>
                                <span>exercitii corecte</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-caption text-neutral-600">
                                <Trophy className="w-4 h-4 text-warm-500" />
                                <span className="font-semibold text-neutral-800">
                                    {formatNumber(child.totalPoints)}
                                </span>
                                <span>puncte</span>
                            </div>
                            {child.lastActivityAt && (
                                <div className="flex items-center gap-1.5 text-caption text-neutral-600">
                                    <Clock className="w-4 h-4 text-neutral-400" />
                                    <span>{timeAgo(child.lastActivityAt)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <ProgressRing
                            value={successRate}
                            size={64}
                            strokeWidth={6}
                            variant={successRate >= 75 ? 'success' : successRate >= 50 ? 'warm' : 'primary'}
                        >
                            <div className="text-center">
                                <div className="font-display font-bold text-body text-neutral-900 leading-none">
                                    {Math.round(successRate)}
                                </div>
                                <div className="text-[10px] font-bold text-neutral-500 uppercase">
                                    succes
                                </div>
                            </div>
                        </ProgressRing>
                        <ChevronRight className="w-5 h-5 text-neutral-400" />
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};

export default ParentOverviewPage;