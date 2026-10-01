import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    MessageSquare, AlertCircle, BarChart3,
    ThumbsUp, Star,
} from 'lucide-react';
import {
    Card, Badge, Avatar, EmptyState, Skeleton, StatCard,
} from '../design-system/components';
import { studentFeedbackApi } from '../api/studentFeedbackApi';
import { getFeedbackTag } from '../utils/feedbackHelpers';
import { timeAgo } from '../utils/formatters';

const REACTION_LABELS = {
    LOVED_IT:          { emoji: '😍', label: 'Mi-a plăcut mult' },
    LIKED_IT:          { emoji: '🙂', label: 'Mi-a plăcut' },
    NEUTRAL:           { emoji: '😐', label: 'Așa și așa' },
    TOO_HARD:          { emoji: '😰', label: 'Prea greu' },
    CONFUSING:         { emoji: '😕', label: 'Nu am înțeles' },
    BORING:            { emoji: '😴', label: 'Plictisitor' },
};

const ExerciseFeedbackSummaryPage = () => {
    const { exerciseId } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState(null);
    const [details, setDetails] = useState([]);

    const user = JSON.parse(localStorage.getItem('user') || 'null');

    useEffect(() => {
        setLoading(true);
        Promise.all([
            studentFeedbackApi.getSummary(exerciseId),
            studentFeedbackApi.getForExercise(exerciseId),
        ])
            .then(([s, d]) => {
                setSummary(s);
                setDetails(d || []);
                setLoading(false);
            })
            .catch((err) => {
                setError(err?.response?.data?.message || 'Nu am putut incarca datele');
                setLoading(false);
            });
    }, [exerciseId]);

    return (
        <div
            user={user}
            title="Feedback exercitiu"
            back={{ to: -1 }}
        >
            <div className="mb-6">
                <h1 className="text-h1 text-neutral-900">Feedback elevi</h1>
                <p className="text-body-lg text-neutral-600 mt-1">
                    Ce părere au elevii despre acest exercițiu.
                </p>
            </div>

            {loading && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="card" height={120} />)}
                    </div>
                    <Skeleton variant="card" height={200} />
                </div>
            )}

            {error && !loading && (
                <EmptyState
                    icon={AlertCircle}
                    variant="warm"
                    title="A apărut o eroare"
                    description={error}
                />
            )}

            {!loading && !error && summary && (
                <>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <StatCard
                            label="Total feedback"
                            value={summary.totalFeedback}
                            icon={MessageSquare}
                            variant="primary"
                        />
                        <StatCard
                            label="Dificultate medie"
                            value={summary.averageDifficulty?.toFixed(1) || '—'}
                            suffix="/5"
                            icon={BarChart3}
                            variant="warm"
                        />
                        <StatCard
                            label="Enjoyment mediu"
                            value={summary.averageEnjoyment?.toFixed(1) || '—'}
                            suffix="/5"
                            icon={ThumbsUp}
                            variant="success"
                        />
                        <StatCard
                            label="Cu comentarii"
                            value={summary.commentCount}
                            icon={Star}
                            variant="accent"
                        />
                    </div>

                    {summary.reactionCounts &&
                        Object.keys(summary.reactionCounts).length > 0 && (
                            <Card className="mb-6">
                                <h2 className="text-h3 text-neutral-900 mb-4">
                                    Distributia reactiilor
                                </h2>
                                <div className="space-y-3">
                                    {Object.entries(summary.reactionCounts)
                                        .sort(([, a], [, b]) => b - a)
                                        .map(([reaction, count]) => {
                                            const r = REACTION_LABELS[reaction];
                                            const pct = summary.totalFeedback > 0
                                                ? Math.round((count / summary.totalFeedback) * 100)
                                                : 0;
                                            return (
                                                <div key={reaction} className="flex items-center gap-3">
                                                <span className="text-xl w-8 flex-shrink-0">
                                                    {r?.emoji || '?'}
                                                </span>
                                                    <span className="text-body text-neutral-700 w-36 flex-shrink-0">
                                                    {r?.label || reaction}
                                                </span>
                                                    <div className="flex-1 h-3 bg-neutral-100 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                                                            className="h-full bg-hero-primary rounded-full"
                                                        />
                                                    </div>
                                                    <span className="text-caption font-bold text-neutral-600 w-16 text-right">
                                                    {count} ({pct}%)
                                                </span>
                                                </div>
                                            );
                                        })}
                                </div>
                            </Card>
                        )}

                    {details.length === 0 ? (
                        <EmptyState
                            icon={MessageSquare}
                            variant="neutral"
                            title="Niciun feedback inca"
                            description="Elevii nu au lasat inca feedback pentru acest exercitiu."
                            size="sm"
                        />
                    ) : (
                        <div>
                            <h2 className="text-h3 text-neutral-900 mb-4">
                                Toate feedback-urile ({details.length})
                            </h2>
                            <div className="space-y-3">
                                {details.map((f, index) => (
                                    <motion.div
                                        key={f.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                    >
                                        <Card padding="md">
                                            <div className="flex items-start gap-3">
                                                <Avatar name={f.studentName} size="md" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <span className="text-body font-semibold text-neutral-900">
                                                            {f.studentName}
                                                        </span>
                                                        {f.reaction && (
                                                            <span className="text-xl" title={REACTION_LABELS[f.reaction]?.label}>
                                                                {REACTION_LABELS[f.reaction]?.emoji}
                                                            </span>
                                                        )}
                                                        {f.difficultyRating && (
                                                            <Badge variant="warm" size="sm">
                                                                Dificultate: {f.difficultyRating}/5
                                                            </Badge>
                                                        )}
                                                        <span className="text-caption text-neutral-400 ml-auto">
                                                            {timeAgo(f.createdAt)}
                                                        </span>
                                                    </div>
                                                    {f.comment && (
                                                        <p className="text-body text-neutral-700 mt-1">
                                                            {f.comment}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ExerciseFeedbackSummaryPage;