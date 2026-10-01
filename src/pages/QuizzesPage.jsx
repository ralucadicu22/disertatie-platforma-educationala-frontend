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

const STATUS_STYLES = {
    PUBLISHED:      { bg: 'bg-success-100', text: 'text-success-700', label: 'Publicat' },
    PENDING_REVIEW: { bg: 'bg-warning-100', text: 'text-warning-700', label: 'În review' },
    DRAFT:          { bg: 'bg-neutral-100', text: 'text-neutral-600', label: 'Draft' },
    ARCHIVED:       { bg: 'bg-neutral-100', text: 'text-neutral-400', label: 'Arhivat' },
};

export default function QuizzesPage() {
    const { moduleId } = useParams();
    const [quizzes, setQuizzes] = useState([]);
    const [exercises, setExercises] = useState({});
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isEditorOrAdmin = user.role === 'EDITOR' || user.role === 'ADMIN';
    const handleToggleTemplate = async (exerciseId, isCurrentlyTemplate) => {
        try {
            const versionsRes = await api.get(`/exercises/${exerciseId}/versions`);
            const publishedVersion = versionsRes.data?.find(v => v.status === 'PUBLISHED');
            if (!publishedVersion) return;

            if (isCurrentlyTemplate) {
                await api.delete(`/exercises/versions/${publishedVersion.id}/template`);
            } else {
                await api.post(`/exercises/versions/${publishedVersion.id}/template`);
            }
            const quizId = quizzes.find(q =>
                exercises[q.id]?.some(e => e.id === exerciseId)
            )?.id;
            if (quizId) {
                const res = await api.get(`/exercises/quiz/${quizId}`);
                setExercises(prev => ({ ...prev, [quizId]: res.data }));
            }
        } catch (err) {
            console.error('Toggle template error:', err);
            alert('Eroare la marcarea template-ului');
        }
    };
    const handleDeleteExercise = async (exerciseId, quizId, e) => {
        e.stopPropagation();
        if (!window.confirm('Ștergi definitiv acest exercițiu? Acțiunea nu poate fi anulată.')) return;
        try {
            await api.delete(`/exercises/${exerciseId}`);
            setExercises(prev => ({
                ...prev,
                [quizId]: prev[quizId].filter(ex => ex.id !== exerciseId)
            }));
        } catch (err) {
            alert('Eroare la ștergerea exercițiului');
        }
    };
    useEffect(() => {
        api.get(`/quizzes/module/${moduleId}`)
            .then(res => setQuizzes(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [moduleId]);

    useEffect(() => {
        if (!isEditorOrAdmin || quizzes.length === 0) return;
        quizzes.forEach(q => {
            api.get(`/exercises/quiz/${q.id}`)
                .then(res => setExercises(prev => ({ ...prev, [q.id]: res.data })))
                .catch(() => {});
        });
    }, [quizzes, isEditorOrAdmin]);

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
                    {quizzes.map((q, i) => {
                        const quizExercises = exercises[q.id] || [];
                        return (
                            <div
                                key={q.id}
                                className="group bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <div className="flex items-center gap-4">

                                    <div className={cn(
                                        'w-11 h-11 rounded-xl flex items-center justify-center text-body-lg font-bold text-white flex-shrink-0 bg-gradient-to-br shadow-sm',
                                        COLORS[i % COLORS.length]
                                    )}>
                                        {i + 1}
                                    </div>


                                    <div
                                        className={cn(
                                            "flex-1 min-w-0",
                                            !isEditorOrAdmin && "cursor-pointer"
                                        )}
                                        onClick={() => !isEditorOrAdmin && navigate(`/quiz/${q.id}`)}
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
                                        {!isEditorOrAdmin && (
                                            <button
                                                onClick={() => navigate(`/quiz/${q.id}`)}
                                                className="text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-1 transition-all text-lg"
                                            >
                                                →
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {isEditorOrAdmin && quizExercises.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-col gap-1.5">
                                        <p className="text-micro text-neutral-400 uppercase tracking-wide font-bold mb-1">
                                            Exerciții ({quizExercises.length})
                                        </p>
                                        {quizExercises.map(ex => {
                                            const st = STATUS_STYLES[ex.status] || STATUS_STYLES.DRAFT;
                                            return (
                                                <div
                                                    key={ex.id}
                                                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors border border-neutral-100"
                                                >
    <span className={cn(
        'px-2 py-0.5 rounded-full text-micro font-bold flex-shrink-0',
        st.bg, st.text
    )}>
        {st.label}
    </span>
                                                    <span className="text-caption text-neutral-700 font-semibold flex-1 truncate">
        {ex.name || `Exercițiu #${ex.id}`}
    </span>

                                                    {ex.status === 'PUBLISHED' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleToggleTemplate(ex.id, ex.isTemplate);
                                                            }}
                                                            className={cn(
                                                                'px-2 py-1 rounded-lg text-micro font-bold border transition-colors flex-shrink-0',
                                                                ex.isTemplate
                                                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100'
                                                                    : 'bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50'
                                                            )}
                                                            title={ex.isTemplate ? 'E template — click pentru a demarca' : 'Marchează ca template'}
                                                        >
                                                            {ex.isTemplate ? '⭐ Template' : '☆ Template'}
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => navigate(`/editor/${ex.id}`)}
                                                        className="text-caption text-neutral-400 hover:text-neutral-600 flex-shrink-0"
                                                    >
                                                        ✏️ Editează →
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteExercise(ex.id, q.id, e)}
                                                        className="text-caption text-neutral-300 hover:text-danger-500 flex-shrink-0 transition-colors"
                                                        title="Șterge exercițiu"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {isEditorOrAdmin && quizExercises.length === 0 && (
                                    <div className="mt-3 pt-3 border-t border-neutral-100">
                                        <p className="text-caption text-neutral-400 italic">
                                            Niciun exercițiu creat încă. Apasă „+ Exercițiu" pentru a crea primul.
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}