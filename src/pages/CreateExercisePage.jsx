import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { cn } from '../design-system/cn';
import {EXERCISE_TYPE_DEFINITIONS} from "../constants/exerciseTypes.js";
import {exerciseTypeApi} from "../api/exerciseTypeApi.js";

const TYPE_STYLES = {
    FIND_AND_SELECT: {
        color: 'from-primary-500 to-accent-500',
        bg: 'bg-primary-50',
        border: 'border-primary-200',
    },
    DRAG_AND_DROP: {
        color: 'from-warm-400 to-accent-400',
        bg: 'bg-warm-50',
        border: 'border-warm-200',
    },
    CUSTOM: {
        color: 'from-neutral-400 to-neutral-500',
        bg: 'bg-neutral-50',
        border: 'border-neutral-200',
    },

    _default: {
        color: 'from-primary-300 to-primary-500',
        bg: 'bg-primary-50',
        border: 'border-primary-100',
    },
};

function getTypeStyle(type) {
    return TYPE_STYLES[type] || TYPE_STYLES._default;
}

export default function CreateExercisePage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const quizId = searchParams.get('quizId');

    const [activeTab, setActiveTab] = useState('scratch');
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [creating, setCreating] = useState(null);
    const [error, setError] = useState(null);

    const [allowedTypes, setAllowedTypes] = useState(null);
    const [loadingAllowed, setLoadingAllowed] = useState(true);


    useEffect(() => {
        if (!quizId) { setLoadingAllowed(false); return; }
        exerciseTypeApi.getAllowedTypesForQuiz(Number(quizId))
            .then(data => setAllowedTypes(data))
            .catch(() => {
                setAllowedTypes(null);
            })
            .finally(() => setLoadingAllowed(false));
    }, [quizId]);

    const exerciseOptions = EXERCISE_TYPE_DEFINITIONS
        .filter(def => def.implemented)
        .filter(def => allowedTypes === null || allowedTypes.includes(def.type))
        .map(def => ({
            ...def,
            ...getTypeStyle(def.type),
        }));
    useEffect(() => {
        if (activeTab !== 'template') return;
        setLoadingTemplates(true);
        api.get('/exercises/versions/templates')
            .then(res => setTemplates(res.data))
            .catch(() => setError('Nu am putut încărca template-urile.'))
            .finally(() => setLoadingTemplates(false));
    }, [activeTab]);

    const handleCreateFromScratch = (exerciseType) => {
        if (!quizId || creating) return;
        setCreating(exerciseType);
        setError(null);
        navigate(`/editor/new?quizId=${quizId}&type=${exerciseType}`);
    };

    const handleCreateFromTemplate = async (templateVersionId) => {
        if (!quizId || creating) return;
        setCreating('template');
        setError(null);
        try {
            const res = await api.post('/exercises/from-template', {
                templateVersionId,
                quizId: parseInt(quizId),
                changeNote: 'Creat din template',
            });
            navigate(`/editor/${res.data.exerciseId}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Eroare la creare din template.');
            setCreating(null);
        }
    };

    if (!quizId) {
        return (
            <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center gap-4 p-6">
                <div className="text-5xl">⚠️</div>
                <p className="text-danger-600 font-bold text-body-lg text-center max-w-sm">
                    Nu ai specificat un quiz. Folosește linkul /editor/create?quizId=X
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="px-5 py-2.5 bg-white border border-neutral-200 rounded-md text-body font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                    Înapoi la pagina principală
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-100">
            <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-body font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                    ← Înapoi
                </button>
                <span className="text-body-lg font-bold text-neutral-900">Exercițiu nou</span>
                <div className="w-20" />
            </div>

            <div className="max-w-2xl mx-auto px-4 py-10">
                {/* Tabs */}
                <div className="flex bg-neutral-200 rounded-lg p-1 mb-8 w-fit">
                    {['scratch', 'template'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                'px-5 py-2 rounded-md text-body font-semibold transition-all',
                                activeTab === tab
                                    ? 'bg-white text-neutral-900 shadow-sm'
                                    : 'text-neutral-500 hover:text-neutral-700'
                            )}
                        >
                            {tab === 'scratch' ? 'De la zero' : 'Din template'}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="flex items-center gap-2 bg-danger-50 border border-danger-200 text-danger-700 rounded-md px-4 py-3 text-body font-semibold mb-6">
                        ⚠️ {error}
                    </div>
                )}

                {activeTab === 'scratch' && (
                    <>
                        {loadingAllowed ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : exerciseOptions.length === 0 ? (
                            <div className="bg-white rounded-xl border-2 border-dashed border-neutral-200 p-12 text-center">
                                <div className="text-4xl mb-3">🚫</div>
                                <h3 className="text-h3 font-bold text-neutral-900 mb-2">
                                    Niciun tip de exercițiu disponibil
                                </h3>
                                <p className="text-body text-neutral-500 max-w-xs mx-auto">
                                    Administratorul a dezactivat toate tipurile de exerciții pentru acest produs.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {exerciseOptions.map(opt => (
                                    <button
                                        key={opt.type}
                                        onClick={() => handleCreateFromScratch(opt.type)}
                                        disabled={!!creating}
                                        className={cn(
                                            'group relative flex items-center gap-5 w-full text-left',
                                            'bg-white rounded-xl border-2 p-5 transition-all duration-200',
                                            'hover:shadow-md hover:-translate-y-0.5',
                                            opt.border,
                                            creating === opt.type && 'opacity-70 cursor-wait',
                                            creating && creating !== opt.type && 'opacity-40 cursor-not-allowed',
                                        )}
                                    >
                                        <div className={cn(
                                            'w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0',
                                            'bg-gradient-to-br text-white shadow-sm',
                                            opt.color,
                                        )}>
                                            {creating === opt.type ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                opt.icon
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-body-lg font-bold text-neutral-900">
                                                    {opt.label}
                                                </span>
                                                {opt.type !== 'CUSTOM' && (
                                                    <span className="px-2 py-0.5 bg-success-100 text-success-700 text-micro rounded-full font-bold">
                                                        DISPONIBIL
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-caption text-neutral-500 leading-relaxed">
                                                {opt.description}
                                            </p>
                                        </div>

                                        <div className="text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-1 transition-all text-lg flex-shrink-0">
                                            →
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'template' && (
                    <>
                        {loadingTemplates ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="bg-white rounded-xl border-2 border-dashed border-neutral-200 p-12 text-center">
                                <div className="text-4xl mb-3">📚</div>
                                <h3 className="text-h3 font-bold text-neutral-900 mb-2">
                                    Nu există template-uri
                                </h3>
                                <p className="text-body text-neutral-500 max-w-xs mx-auto leading-relaxed">
                                    Publică un exercițiu și marchează-l ca template pentru a-l folosi ca punct de plecare.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {templates.map(t => (
                                    <TemplateRow
                                        key={t.id}
                                        template={t}
                                        onSelect={() => handleCreateFromTemplate(t.id)}
                                        disabled={!!creating}
                                        loading={creating === 'template'}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function TemplateRow({ template, onSelect, disabled, loading }) {
    const createdDate = template.createdAt
        ? new Date(template.createdAt).toLocaleDateString('ro-RO')
        : '—';
    const elementsCount = (() => {
        try { return (JSON.parse(template.config).elements || []).length; }
        catch { return 0; }
    })();

    return (
        <button
            onClick={onSelect}
            disabled={disabled}
            className={cn(
                'group flex items-center gap-4 w-full text-left',
                'bg-white rounded-xl border-2 border-neutral-200 p-4 transition-all duration-200',
                'hover:shadow-md hover:border-primary-300 hover:-translate-y-0.5',
                disabled && 'opacity-50 cursor-not-allowed'
            )}
        >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center text-xl flex-shrink-0">
                🎨
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-body font-bold text-neutral-900">
                        Exercițiu #{template.exerciseId}
                    </span>
                    <span className="text-micro text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                        v{template.versionNumber}
                    </span>
                </div>
                <div className="flex items-center gap-3 text-caption text-neutral-400">
                    <span>👤 {template.createdByName || 'Necunoscut'}</span>
                    <span>📅 {createdDate}</span>
                    <span>🧩 {elementsCount} elem.</span>
                </div>
            </div>

            <div className={cn(
                'px-4 py-2 rounded-lg text-body font-bold transition-all flex-shrink-0',
                'bg-primary-50 text-primary-700 group-hover:bg-primary-600 group-hover:text-white'
            )}>
                {loading ? '...' : 'Folosește'}
            </div>
        </button>
    );
}