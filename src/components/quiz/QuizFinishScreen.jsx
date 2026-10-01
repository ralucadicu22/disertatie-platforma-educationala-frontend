import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Home, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, ProgressBar } from '../../design-system/components';
import { quizAttemptApi } from '../../api/quizAttemptApi';
import { celebrate, celebrateBig } from '../../design-system/confetti';
import { notify } from '../../design-system/toast';
import { useEffect } from 'react';
import { cn } from '../../design-system/cn';
const QuizFinishScreen = ({ attemptId, quizId, quizTitle, onRestart }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);
    const [restarting, setRestarting] = useState(false);

    useEffect(() => {
        quizAttemptApi.finish(attemptId)
            .then((data) => {
                setResult(data);
                setLoading(false);

                const rate = data.totalExercises > 0
                    ? (data.correctExercises / data.totalExercises) * 100
                    : 0;
                if (rate === 100) {
                    setTimeout(celebrateBig, 300);
                } else if (rate >= 50) {
                    setTimeout(celebrate, 300);
                }
            })
            .catch(() => {
                notify.error('Nu am putut finaliza quiz-ul');
                setLoading(false);
            });
    }, [attemptId]);

    const handleRestart = async () => {
        setRestarting(true);
        try {
            const attempt = await quizAttemptApi.start(quizId);
            onRestart?.(attempt.attemptId, attempt);
        } catch (err) {
            notify.error(err?.response?.data?.message || 'Nu mai poți relua acest quiz');
        } finally {
            setRestarting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-lg mx-auto py-16 text-center">
                <div className="animate-pulse space-y-4">
                    <div className="w-20 h-20 bg-neutral-200 rounded-full mx-auto" />
                    <div className="h-8 bg-neutral-200 rounded-md w-48 mx-auto" />
                    <div className="h-4 bg-neutral-200 rounded-md w-32 mx-auto" />
                </div>
            </div>
        );
    }

    if (!result) return null;

    const successRate = result.totalExercises > 0
        ? Math.round((result.correctExercises / result.totalExercises) * 100)
        : 0;

    const isPerfect = successRate === 100;
    const isPassed = successRate >= 50;

    return (
        <div className="max-w-lg mx-auto py-8 px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.68, -0.55, 0.265, 1.55] }}
                className="text-center mb-6"
            >

                <div className={cn(
                    'w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4',
                    isPerfect ? 'bg-warning-100' : isPassed ? 'bg-success-100' : 'bg-neutral-100'
                )}>
                    {isPerfect ? (
                        <Trophy className="w-12 h-12 text-warning-500" />
                    ) : isPassed ? (
                        <CheckCircle2 className="w-12 h-12 text-success-600" />
                    ) : (
                        <XCircle className="w-12 h-12 text-neutral-400" />
                    )}
                </div>

                <h1 className="text-h1 text-neutral-900">
                    {isPerfect ? 'Perfect! 🎉' : isPassed ? 'Bravo! 👏' : 'Mai incearcă! 💪'}
                </h1>
                <p className="text-body-lg text-neutral-600 mt-2">
                    {quizTitle}
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card variant={isPassed ? 'fresh' : 'warm'} padding="lg" className="mb-4 text-center">
                    <div className="font-display font-bold text-display-2 text-neutral-900 leading-none">
                        {result.correctExercises}
                        <span className="text-h1 text-neutral-500">/{result.totalExercises}</span>
                    </div>
                    <div className="text-body-lg text-neutral-600 mt-1">exerciții corecte</div>
                    <ProgressBar
                        value={successRate}
                        variant={isPassed ? 'success' : 'warm'}
                        size="lg"
                        showLabel
                        className="mt-4"
                    />
                </Card>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-6"
            >
                <Card padding="md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-warning-600" />
                            </div>
                            <div>
                                <div className="text-caption text-neutral-500">Puncte câștigate</div>
                                <div className="font-display font-bold text-stat-md text-neutral-900 leading-none mt-0.5">
                                    {result.totalPoints}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-caption text-neutral-500">Rata succes</div>
                            <div className={cn(
                                'font-display font-bold text-stat-md leading-none mt-0.5',
                                isPassed ? 'text-success-700' : 'text-danger-600'
                            )}>
                                {successRate}%
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
            >
                <Button
                    variant="primary"
                    size="lg"
                    icon={RotateCcw}
                    fullWidth
                    onClick={handleRestart}
                    loading={restarting}
                >
                    Incearcă din nou
                </Button>
                <Button
                    variant="secondary"
                    size="lg"
                    icon={Home}
                    fullWidth
                    onClick={() => navigate('/')}
                >
                    Înapoi la pagina principală
                </Button>
            </motion.div>
        </div>
    );
};


export default QuizFinishScreen;