import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { Badge } from '../design-system/components';
import { cn } from '../design-system/cn';

const COLORS = [
    'from-success-500 to-success-400',
    'from-primary-500 to-primary-400',
    'from-warm-500 to-warm-400',
    'from-danger-400 to-warm-400',
    'from-accent-500 to-accent-400',
];

export default function QuizzesPage() {
    const { moduleId } = useParams();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isEditorOrAdmin = user.role === 'EDITOR' || user.role === 'ADMIN';

    useEffect(() => {
        api.get(`/quizzes/module/${moduleId}`)
            .then(res => setQuizzes(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [moduleId]);

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-body font-semibold text-neutral-500 hover:text-neutral-800 transition-colors mb-6"
            >
                ← Înapoi
            </button>

            <p className="text-micro text-neutral-400 uppercase tracking-widest font-bold mb-3">
                Quiz-uri disponibile
            </p>

            {quizzes.length === 0 ? (
                <div className="bg-white rounded-xl border-2 border-dashed border-neutral-200 p-12 text-center">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-body text-neutral-500">Nu există quiz-uri în acest modul.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {quizzes.map((q, i) => (
                        <div
                            key={q.id}
                            className="group bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <div className="flex items-center gap-4">
                                {/* Number badge */}
                                <div className={cn(
                                    'w-11 h-11 rounded-xl flex items-center justify-center text-body-lg font-bold text-white flex-shrink-0 bg-gradient-to-br shadow-sm',
                                    COLORS[i % COLORS.length]
                                )}>
                                    {i + 1}
                                </div>

                                <div
                                    className="flex-1 min-w-0 cursor-pointer"
                                    onClick={() => navigate(`/quiz/${q.id}`)}
                                >
                                    <p className="text-body-lg font-bold text-neutral-900 mb-0.5">
                                        {q.title}
                                    </p>
                                    <p className="text-caption text-neutral-500 truncate mb-1.5">
                                        {q.description}
                                    </p>
                                    {q.maxAttempts > 0 && (
                                        <Badge variant="neutral" size="sm">
                                            {q.maxAttempts} încercări
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {isEditorOrAdmin && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/editor/create?quizId=${q.id}`);
                                            }}
                                            className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-caption font-bold hover:bg-primary-700 transition-colors whitespace-nowrap"
                                        >
                                            + Exercițiu
                                        </button>
                                    )}
                                    <button
                                        onClick={() => navigate(`/quiz/${q.id}`)}
                                        className="text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-1 transition-all text-lg"
                                    >
                                        →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}