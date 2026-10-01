import { useState, useEffect, useMemo } from 'react';
import { BookOpen, Search, Check } from 'lucide-react';
import {
    Modal, Button, Input, EmptyState, Skeleton, Badge,
} from '../../design-system/components';
import { quizAssignmentApi } from '../../api/quizAssignmentApi';
import { quizApi } from '../../api/quizApi';
import { notify } from '../../design-system/toast';
import { cn } from '../../design-system/cn';

const AssignQuizzesModal = ({ open, onClose, classroom, onAssigned }) => {
    const [allQuizzes, setAllQuizzes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const alreadyAssigned = useMemo(
        () => new Set((classroom?.assignedQuizzes || []).map((q) => q.id)),
        [classroom]
    );

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        setSelectedIds(new Set());
        setSearch('');
        quizApi.getAll()
            .then((data) => { setAllQuizzes(data || []); setLoading(false); })
            .catch(() => { notify.error('Nu am putut încărca quiz-urile'); setLoading(false); });
    }, [open]);

    const filtered = useMemo(() => {
        if (!search.trim()) return allQuizzes;
        const q = search.trim().toLowerCase();
        return allQuizzes.filter((quiz) =>
            quiz.title?.toLowerCase().includes(q) ||
            quiz.description?.toLowerCase().includes(q)
        );
    }, [allQuizzes, search]);

    const toggleSelect = (quizId) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(quizId) ? next.delete(quizId) : next.add(quizId);
            return next;
        });
    };

    const handleAssign = async () => {
        if (selectedIds.size === 0) {
            notify.warning('Selectează cel puțin un quiz');
            return;
        }
        setSaving(true);
        try {
            await quizAssignmentApi.assign(
                Array.from(selectedIds),
                [classroom.id]
            );
            notify.success(`${selectedIds.size} quiz-uri asignate la "${classroom.name}"`);
            onAssigned?.();
            onClose();
        } catch (err) {
            notify.error(err?.response?.data?.message || 'Nu am putut asigna quiz-urile');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Asignează quiz-uri — ${classroom?.name || ''}`}
            description="Selectează quiz-urile pe care vrei să le faci disponibile elevilor din această clasă."
            size="lg"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={saving}>
                        Anulează
                    </Button>
                    <Button
                        variant="primary"
                        icon={BookOpen}
                        onClick={handleAssign}
                        loading={saving}
                        disabled={selectedIds.size === 0}
                    >
                        Asignează {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <Input
                    placeholder="Caută quiz după titlu..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    icon={Search}
                    autoFocus
                />

                {selectedIds.size > 0 && (
                    <div className="flex items-center justify-between px-3 py-2 bg-primary-50 rounded-md border border-primary-200">
                        <span className="text-caption text-primary-700 font-semibold">
                            {selectedIds.size} quiz-uri selectate
                        </span>
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="text-caption text-primary-600 hover:text-primary-800 font-bold"
                        >
                            Șterge selecția
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="card" height={72} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={BookOpen}
                        variant="neutral"
                        title="Nu am găsit quiz-uri"
                        description={search ? 'Încearcă alt termen de căutare.' : 'Nu există quiz-uri în sistem.'}
                        size="sm"
                    />
                ) : (
                    <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1">
                        {filtered.map((quiz) => {
                            const isAssigned = alreadyAssigned.has(quiz.id);
                            const isSelected = selectedIds.has(quiz.id);

                            return (
                                <button
                                    key={quiz.id}
                                    onClick={() => !isAssigned && toggleSelect(quiz.id)}
                                    disabled={isAssigned}
                                    className={cn(
                                        'w-full flex items-center gap-3 p-3 rounded-md text-left transition-all',
                                        isAssigned
                                            ? 'bg-neutral-50 opacity-60 cursor-not-allowed'
                                            : isSelected
                                                ? 'bg-primary-50 border-2 border-primary-300'
                                                : 'bg-white border-2 border-neutral-200 hover:border-primary-200 hover:bg-primary-50/50'
                                    )}
                                >
                                    <div className={cn(
                                        'w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all',
                                        isAssigned
                                            ? 'bg-neutral-200 border-neutral-300'
                                            : isSelected
                                                ? 'bg-primary-500 border-primary-500'
                                                : 'border-neutral-300 bg-white'
                                    )}>
                                        {(isSelected || isAssigned) && (
                                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                        )}
                                    </div>

                                    <div className="w-10 h-10 rounded-md bg-primary-100 flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="w-5 h-5 text-primary-600" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="text-body font-semibold text-neutral-900 truncate">
                                            {quiz.title}
                                        </div>
                                        {quiz.description && (
                                            <div className="text-caption text-neutral-500 truncate">
                                                {quiz.description}
                                            </div>
                                        )}
                                    </div>

                                    {isAssigned && (
                                        <Badge variant="success" size="sm">Asignat</Badge>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AssignQuizzesModal;