import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Plus, Trash2, ChevronDown, ChevronUp,
    AlertCircle, School,
} from 'lucide-react';
import {
    Card, Button, Badge, EmptyState, Skeleton,
} from '../design-system/components';
import AppShell from '../components/layout/AppShell';
import AssignQuizzesModal from '../components/classroom/AssignQuizzesModal';
import { quizAssignmentApi } from '../api/quizAssignmentApi';
import { notify } from '../design-system/toast';

const QuizAssignmentPage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [classrooms, setClassrooms] = useState([]);
    const [expanded, setExpanded] = useState(new Set());
    const [assignModal, setAssignModal] = useState(null); // classroom object sau null
    const [removingKey, setRemovingKey] = useState(null); // `${classroomId}-${quizId}`

    const user = JSON.parse(localStorage.getItem('user') || 'null');

    const load = () => {
        setLoading(true);
        setError(null);
        quizAssignmentApi.getMyClassroomsWithQuizzes()
            .then((data) => { setClassrooms(data || []); setLoading(false); })
            .catch((err) => {
                setError(err?.response?.data?.message || 'Nu am putut încărca datele');
                setLoading(false);
            });
    };

    useEffect(() => { load(); }, []);

    const toggleExpand = (id) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleUnassign = async (classroomId, quizId, quizTitle) => {
        const key = `${classroomId}-${quizId}`;
        setRemovingKey(key);
        try {
            await quizAssignmentApi.unassign(classroomId, quizId);
            notify.success(`"${quizTitle}" a fost retras din clasă`);
            setClassrooms((prev) =>
                prev.map((c) =>
                    c.classroomId === classroomId
                        ? { ...c, quizzes: c.quizzes.filter((q) => q.id !== quizId) }
                        : c
                )
            );
        } catch (err) {
            notify.error(err?.response?.data?.message || 'Nu am putut retrage quiz-ul');
        } finally {
            setRemovingKey(null);
        }
    };

    const buildClassroomForModal = (c) => ({
        id: c.classroomId,
        name: c.classroomName,
        assignedQuizzes: (c.quizzes || []).map((q) => ({ id: q.id })),
    });

    return (
        <div user={user} title="Asignare quiz-uri">
            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <h1 className="text-h1 text-neutral-900">Asignare quiz-uri</h1>
                    <p className="text-body-lg text-neutral-600 mt-1">
                        Gestionează quiz-urile disponibile pentru fiecare clasă.
                    </p>
                </div>
            </div>
            {loading && (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} variant="card" height={80} />)}
                </div>
            )}

            {error && !loading && (
                <Card>
                    <EmptyState
                        icon={AlertCircle}
                        variant="warm"
                        title="A aparut o eroare"
                        description={error}
                        action={<Button variant="primary" onClick={load}>Reîncarcă</Button>}
                    />
                </Card>
            )}

            {!loading && !error && classrooms.length === 0 && (
                <Card>
                    <EmptyState
                        icon={School}
                        variant="primary"
                        title="Nu esti in nicio clasă încă"
                        description="Contacteaza administratorul pentru a fi adaugat ca profesor într-o clasă."
                    />
                </Card>
            )}

            {!loading && !error && classrooms.length > 0 && (
                <div className="space-y-3">
                    {classrooms.map((classroom, index) => {
                        const isExpanded = expanded.has(classroom.classroomId);
                        const quizCount = classroom.quizzes?.length ?? 0;

                        return (
                            <motion.div
                                key={classroom.classroomId}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                            >
                                <Card padding="none">
                                    <div className="p-4 flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                                            <School className="w-6 h-6 text-primary-600" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-h3 text-neutral-900">
                                                    {classroom.classroomName}
                                                </h3>
                                                <Badge
                                                    variant={quizCount > 0 ? 'primary' : 'neutral'}
                                                    size="sm"
                                                >
                                                    {quizCount} quiz-uri
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                icon={Plus}
                                                onClick={() => setAssignModal(buildClassroomForModal(classroom))}
                                            >
                                                <span className="hidden md:inline">Asigneaza</span>
                                            </Button>
                                            {quizCount > 0 && (
                                                <button
                                                    onClick={() => toggleExpand(classroom.classroomId)}
                                                    className="p-2 rounded-md hover:bg-neutral-100 transition-colors text-neutral-500"
                                                >
                                                    {isExpanded
                                                        ? <ChevronUp className="w-5 h-5" />
                                                        : <ChevronDown className="w-5 h-5" />
                                                    }
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isExpanded && quizCount > 0 && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden border-t border-neutral-100"
                                            >
                                                <div className="divide-y divide-neutral-100">
                                                    {classroom.quizzes.map((quiz) => {
                                                        const key = `${classroom.classroomId}-${quiz.id}`;
                                                        const isRemoving = removingKey === key;

                                                        return (
                                                            <div
                                                                key={quiz.id}
                                                                className="px-4 py-3 flex items-center gap-3 hover:bg-neutral-50 transition-colors"
                                                            >
                                                                <div className="w-8 h-8 rounded-md bg-primary-50 flex items-center justify-center flex-shrink-0">
                                                                    <BookOpen className="w-4 h-4 text-primary-500" />
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
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    icon={Trash2}
                                                                    loading={isRemoving}
                                                                    disabled={removingKey != null && !isRemoving}
                                                                    onClick={() => handleUnassign(
                                                                        classroom.classroomId,
                                                                        quiz.id,
                                                                        quiz.title
                                                                    )}
                                                                    className="text-danger-600 hover:bg-danger-50"
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {assignModal && (
                <AssignQuizzesModal
                    open={!!assignModal}
                    onClose={() => setAssignModal(null)}
                    classroom={assignModal}
                    onAssigned={load}
                />
            )}
        </div>
    );
};

export default QuizAssignmentPage;