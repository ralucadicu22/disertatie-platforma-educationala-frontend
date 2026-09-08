import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    PlayCircle, Clock, CheckCircle2, XCircle,
    RotateCcw, Lock, Trophy, AlertCircle,
} from 'lucide-react';
import {
    Card, Button, Badge, ProgressBar, EmptyState, Skeleton,
} from '../../design-system/components';
import { quizAttemptApi } from '../../api/quizAttemptApi';
import { timeAgo, formatDate } from '../../utils/formatters';
import { notify } from '../../design-system/toast';
import { cn } from '../../design-system/cn';

const QuizStartScreen = ({ quiz, onStart }) => {
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [history, setHistory] = useState(null);

    useEffect(() => {
        if (!quiz?.id) return;
        quizAttemptApi.getHistory(quiz.id)
            .then((data) => { setHistory(data); setLoading(false); })
            .catch(() => { setHistory(null); setLoading(false); });
    }, [quiz?.id]);

    const handleStart = async () => {
        setStarting(true);
        try {
            const attempt = await quizAttemptApi.start(quiz.id);
            onStart?.(attempt.attemptId, attempt);
        } catch (err) {
            const msg = err?.response?.data?.message || 'Nu am putut porni quiz-ul';
            notify.error(msg);
        } finally {
            setStarting(false);
        }
    };

    const isLocked = history?.replaysRemaining === 0;
    const hasActiveAttempt = history?.attempts?.some(
        (a) => a.status === 'IN_PROGRESS'
    );
    const bestAttempt = history?.attempts
        ?.filter((a) => a.status === 'COMPLETED')
        ?.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))[0];

    const completedCount = history?.attempts?.filter(
        (a) => a.status === 'COMPLETED'
    ).length ?? 0;

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card variant="hero" padding="lg" className="mb-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                        <PlayCircle className="w-9 h-9 text-white" />
                    </div>
                    <h1 className="text-h1 text-white mb-2">{quiz?.title}</h1>
                    {quiz?.description && (
                        <p className="text-body-lg text-white/80">{quiz.description}</p>
                    )}


                    <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                        {quiz?.exercises?.length > 0 && (
                            <div className="bg-white/20 rounded-full px-3 py-1.5 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                                <span className="text-body text-white font-semibold">
                                    {quiz.exercises.length} exercitii
                                </span>
                            </div>
                        )}
                        {history?.maxReplays > 0 && (
                            <div className="bg-white/20 rounded-full px-3 py-1.5 flex items-center gap-1.5">
                                <RotateCcw className="w-4 h-4 text-white" />
                                <span className="text-body text-white font-semibold">
                                    {history.replaysRemaining} incercari ramase
                                </span>
                            </div>
                        )}
                        {(!history?.maxReplays || history?.maxReplays === 0) && (
                            <div className="bg-white/20 rounded-full px-3 py-1.5 flex items-center gap-1.5">
                                <RotateCcw className="w-4 h-4 text-white" />
                                <span className="text-body text-white font-semibold">
                                    Incercari nelimitate
                                </span>
                            </div>
                        )}
                    </div>
                </Card>
            </motion.div>

            {bestAttempt && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-4"
                >
                    <Card variant="fresh" padding="md">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
                                    <Trophy className="w-5 h-5 text-success-600" />
                                </div>
                                <div>
                                    <div className="text-caption text-success-700 font-bold uppercase tracking-wider">
                                        Cel mai bun rezultat
                                    </div>
                                    <div className="text-h3 text-neutral-900 mt-0.5">
                                        {bestAttempt.correctExercises}/{bestAttempt.totalExercises} exercitii corecte
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-display font-bold text-stat-md text-success-700">
                                    {bestAttempt.totalPoints}
                                </div>
                                <div className="text-caption text-neutral-500">puncte</div>
                            </div>
                        </div>
                        {bestAttempt.totalExercises > 0 && (
                            <ProgressBar
                                value={Math.round(
                                    (bestAttempt.correctExercises / bestAttempt.totalExercises) * 100
                                )}
                                variant="success"
                                className="mt-3"
                            />
                        )}
                    </Card>
                </motion.div>
            )}

            {/* Buton start / locked */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-6"
            >
                {isLocked ? (
                    <Card variant="warm" padding="md">
                        <div className="flex items-center gap-3">
                            <Lock className="w-6 h-6 text-warm-600 flex-shrink-0" />
                            <div>
                                <div className="text-body font-semibold text-warm-900">
                                    Ai atins limita de tentative
                                </div>
                                <div className="text-caption text-warm-700 mt-0.5">
                                    Ai folosit toate cele {history?.maxReplays} incercari disponibile.
                                </div>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <Button
                        variant="primary"
                        size="lg"
                        icon={hasActiveAttempt ? RotateCcw : PlayCircle}
                        fullWidth
                        onClick={handleStart}
                        loading={starting}
                    >
                        {hasActiveAttempt ? 'Continua quiz-ul' : 'Incepe quiz-ul'}
                    </Button>
                )}
            </motion.div>

            {loading && <Skeleton variant="card" height={120} />}

            {!loading && history?.attempts?.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className="text-h3 text-neutral-900 mb-3">
                        Istoricul tentativelor ({completedCount} completate)
                    </h2>
                    <Card padding="none">
                        <div className="divide-y divide-neutral-100">
                            {history.attempts.map((attempt, index) => (
                                <AttemptRow
                                    key={attempt.id}
                                    attempt={attempt}
                                    index={index}
                                />
                            ))}
                        </div>
                    </Card>
                </motion.div>
            )}
        </div>
    );
};

const AttemptRow = ({ attempt, index }) => {
    const isCompleted = attempt.status === 'COMPLETED';
    const isInProgress = attempt.status === 'IN_PROGRESS';
    const successRate = attempt.totalExercises > 0
        ? Math.round((attempt.correctExercises / attempt.totalExercises) * 100)
        : 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="p-4 flex items-center gap-4"
        >

            <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                isCompleted ? 'bg-success-100' :
                    isInProgress ? 'bg-primary-100' : 'bg-neutral-100'
            )}>
                {isCompleted
                    ? <CheckCircle2 className="w-5 h-5 text-success-600" />
                    : isInProgress
                        ? <Clock className="w-5 h-5 text-primary-600" />
                        : <XCircle className="w-5 h-5 text-neutral-400" />
                }
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-body font-semibold text-neutral-900">
                        Tentativa #{attempt.attemptNumber}
                    </span>
                    <Badge
                        variant={isCompleted ? 'success' : isInProgress ? 'primary' : 'neutral'}
                        size="sm"
                    >
                        {isCompleted ? 'Completata' : isInProgress ? 'In progres' : 'Abandonata'}
                    </Badge>
                </div>
                <div className="text-caption text-neutral-500 mt-0.5">
                    {isCompleted
                        ? `${attempt.correctExercises}/${attempt.totalExercises} corecte · ${timeAgo(attempt.finishedAt)}`
                        : `Inceput ${timeAgo(attempt.startedAt)}`
                    }
                </div>
                {isCompleted && attempt.totalExercises > 0 && (
                    <ProgressBar
                        value={successRate}
                        variant={successRate >= 75 ? 'success' : 'primary'}
                        size="sm"
                        className="mt-2 max-w-48"
                        animated={false}
                    />
                )}
            </div>

            {isCompleted && (
                <div className="text-right flex-shrink-0">
                    <div className="font-display font-bold text-stat-md text-neutral-900">
                        {attempt.totalPoints}
                    </div>
                    <div className="text-caption text-neutral-500">pct</div>
                </div>
            )}
        </motion.div>
    );
};

export default QuizStartScreen;