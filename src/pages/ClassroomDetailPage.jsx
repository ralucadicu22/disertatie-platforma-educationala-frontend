import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Plus, Users, GraduationCap, Trash2, UserMinus,
    AlertCircle, School, Calendar, BookOpen,
} from 'lucide-react';
import { Card, Button, Badge, Avatar, EmptyState, Skeleton, Tabs, Modal } from '../design-system/components';
import AddMemberModal from '../components/classroom/AddMemberModal';
import { classroomApi } from '../api/classroomApi';
import { quizAssignmentApi } from '../api/quizAssignmentApi';
import { gradeLevelLabel } from '../utils/gradeLevel';
import { formatDate } from '../utils/formatters';
import { notify } from '../design-system/toast';
import { cn } from '../design-system/cn';

const ACCENTS = [
    'from-primary-500 to-accent-500',
    'from-primary-400 to-primary-600',
    'from-warm-400 to-accent-400',
    'from-danger-400 to-warm-500',
    'from-success-400 to-primary-400',
];

const ClassroomDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [classroom, setClassroom] = useState(null);
    const [tab, setTab] = useState('students');
    const [addOpen, setAddOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [removingId, setRemovingId] = useState(null);
    const [removingQuizId, setRemovingQuizId] = useState(null);

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isAdmin = user?.role === 'ADMIN';
    const isElev = user?.role === 'ELEV';

    const load = () => {
        setLoading(true);
        setError(null);
        classroomApi.getOne(id)
            .then((data) => { setClassroom(data); setLoading(false); })
            .catch((err) => {
                setError(err?.response?.data?.message || 'Nu am putut încărca clasa');
                setLoading(false);
            });
    };

    useEffect(() => { load(); }, [id]);

    const handleAddMember = async (userId) => {
        try {
            const updated = tab === 'teachers'
                ? await classroomApi.addTeacher(id, userId)
                : await classroomApi.addStudent(id, userId);
            setClassroom(updated);
            notify.success(tab === 'teachers' ? 'Profesor adaugat' : 'Elev adaugat');
        } catch (err) {
            notify.error(err?.response?.data?.message || 'Nu am putut adauga membrul');
            throw err;
        }
    };

    const handleRemoveMember = async (userId, memberType) => {
        setRemovingId(userId);
        try {
            const updated = memberType === 'teacher'
                ? await classroomApi.removeTeacher(id, userId)
                : await classroomApi.removeStudent(id, userId);
            setClassroom(updated);
            notify.success('Membru eliminat');
        } catch (err) {
            notify.error(err?.response?.data?.message || 'Nu am putut elimina membrul');
        } finally {
            setRemovingId(null);
        }
    };

    const handleRemoveQuiz = async (quizId) => {
        setRemovingQuizId(quizId);
        try {
            await quizAssignmentApi.unassign(id, quizId);
            setClassroom(prev => ({
                ...prev,
                assignedQuizzes: prev.assignedQuizzes.filter(q => q.id !== quizId),
            }));
            notify.success('Quiz dezasignat');
        } catch (err) {
            notify.error(err?.response?.data?.message || 'Eroare la dezasignare');
        } finally {
            setRemovingQuizId(null);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await classroomApi.delete(id);
            notify.success('Clasa a fost ștearsă');
            navigate('/clase');
        } catch (err) {
            notify.error(err?.response?.data?.message || 'Nu am putut șterge clasa');
            setDeleting(false);
        }
    };

    const excludeIds = tab === 'teachers'
        ? (classroom?.teachers || []).map((t) => t.id)
        : (classroom?.students || []).map((s) => s.id);

    if (loading) return (
        <div className="space-y-6">
            <Skeleton variant="card" height={160} />
            <Skeleton variant="card" height={300} />
        </div>
    );

    if (error) return (
        <Card>
            <EmptyState
                icon={AlertCircle}
                variant="warm"
                title="A aparut o eroare"
                description={error}
                action={<Button variant="primary" onClick={load}>Reîncarcă</Button>}
            />
        </Card>
    );

    if (!classroom) return null;

    if (isElev) {
        const quizzes = classroom.assignedQuizzes || [];
        return (
            <div className="animate-fade-in">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-1.5 text-body font-semibold text-neutral-500 hover:text-neutral-800 transition-colors mb-6"
                >
                    ← Înapoi
                </button>

                <div className="bg-gradient-to-br from-primary-50 to-accent-50 border border-primary-100 rounded-2xl p-6 mb-8">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {classroom.gradeLevel && (
                            <Badge variant="primary" icon={School}>
                                {gradeLevelLabel(classroom.gradeLevel)}
                            </Badge>
                        )}
                        {classroom.schoolYear && (
                            <Badge variant="accent" icon={Calendar}>
                                {classroom.schoolYear}
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-h1 font-bold text-neutral-900 mb-1">{classroom.name}</h1>
                    {classroom.description && (
                        <p className="text-body text-neutral-600">{classroom.description}</p>
                    )}
                </div>


                <p className="text-micro text-neutral-400 uppercase tracking-widest font-bold mb-3">
                    Quiz-uri disponibile ({quizzes.length})
                </p>

                {quizzes.length === 0 ? (
                    <div className="bg-white rounded-xl border-2 border-dashed border-neutral-200 p-12 text-center">
                        <div className="text-4xl mb-3">📭</div>
                        <h3 className="text-h3 font-bold text-neutral-900 mb-2">
                            Niciun quiz asignat încă
                        </h3>
                        <p className="text-body text-neutral-500">
                            Profesorul tău va asigna quiz-uri în curând.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {quizzes.map((q, i) => (
                            <button
                                key={q.id}
                                onClick={() => navigate(`/quiz/${q.id}`)}
                                className="group flex items-center gap-4 bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left w-full"
                            >
                                <div className={cn(
                                    'w-12 h-12 rounded-xl flex items-center justify-center text-body-lg font-bold text-white flex-shrink-0 bg-gradient-to-br shadow-sm',
                                    ACCENTS[i % ACCENTS.length]
                                )}>
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-body-lg font-bold text-neutral-900 mb-0.5">
                                        {q.title}
                                    </p>
                                    {q.description && (
                                        <p className="text-caption text-neutral-500 truncate">
                                            {q.description}
                                        </p>
                                    )}
                                </div>
                                <div className="text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-1 transition-all text-lg flex-shrink-0">
                                    →
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card variant="cool" padding="lg" className="mb-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                {!classroom.active && <Badge variant="neutral">Inactiva</Badge>}
                                {classroom.gradeLevel && (
                                    <Badge variant="primary" icon={School}>
                                        {gradeLevelLabel(classroom.gradeLevel)}
                                    </Badge>
                                )}
                                {classroom.schoolYear && (
                                    <Badge variant="accent" icon={Calendar}>
                                        {classroom.schoolYear}
                                    </Badge>
                                )}
                            </div>
                            <h1 className="text-h1 text-neutral-900">{classroom.name}</h1>
                            {classroom.description && (
                                <p className="text-body-lg text-neutral-700 mt-2">{classroom.description}</p>
                            )}
                            <p className="text-caption text-neutral-500 mt-3">
                                Creată pe {formatDate(classroom.createdAt)}
                            </p>
                        </div>
                        {isAdmin && (
                            <Button
                                variant="ghost"
                                icon={Trash2}
                                onClick={() => setDeleteOpen(true)}
                                className="text-danger-600 hover:bg-danger-50"
                            >
                                <span className="hidden md:inline">Șterge</span>
                            </Button>
                        )}
                    </div>
                </Card>
            </motion.div>

            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                <Tabs
                    value={tab}
                    onChange={setTab}
                    variant="pills"
                    options={[
                        { value: 'students', label: 'Elevi', icon: Users, badge: classroom.students?.length ?? 0 },
                        { value: 'teachers', label: 'Profesori', icon: GraduationCap, badge: classroom.teachers?.length ?? 0 },
                        { value: 'quizzes', label: 'Quiz-uri', icon: BookOpen, badge: classroom.assignedQuizzes?.length ?? 0 },
                    ]}
                />
                {tab === 'quizzes' ? (
                    <Button
                        variant="primary"
                        icon={Plus}
                        onClick={() => navigate('/asignare-quizuri')}
                    >
                        Asignează quiz-uri
                    </Button>
                ) : (isAdmin || tab === 'students') && (
                    <Button variant="primary" icon={Plus} onClick={() => setAddOpen(true)}>
                        {tab === 'teachers' ? 'Adaugă profesor' : 'Adaugă elev'}
                    </Button>
                )}
            </div>

            {tab === 'students' && (
                <MemberList
                    members={classroom.students}
                    emptyIcon={Users}
                    emptyTitle="Nu există elevi încă"
                    emptyDescription="Adaugă primul elev in aceasta clasă."
                    onRemove={(uid) => handleRemoveMember(uid, 'student')}
                    removingId={removingId}
                />
            )}
            {tab === 'teachers' && (
                <MemberList
                    members={classroom.teachers}
                    emptyIcon={GraduationCap}
                    emptyTitle="Nu există profesori încă"
                    emptyDescription="Doar administratorii pot adăuga profesori."
                    onRemove={isAdmin ? (uid) => handleRemoveMember(uid, 'teacher') : null}
                    removingId={removingId}
                />
            )}
            {tab === 'quizzes' && (
                <QuizzesList
                    quizzes={classroom.assignedQuizzes}
                    onRemove={handleRemoveQuiz}
                    removingId={removingQuizId}
                />
            )}

            <AddMemberModal
                open={addOpen}
                onClose={() => setAddOpen(false)}
                role={tab === 'teachers' ? 'PROFESOR' : 'ELEV'}
                excludeIds={excludeIds}
                onAdd={handleAddMember}
            />

            <Modal
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                title="Șterge clasa?"
                description={`Această acțiune va șterge definitiv clasa "${classroom?.name}".`}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                            Anulează
                        </Button>
                        <Button variant="danger" icon={Trash2} onClick={handleDelete} loading={deleting}>
                            Șterge definitiv
                        </Button>
                    </>
                }
            />
        </div>
    );
};

const MemberList = ({ members, emptyIcon, emptyTitle, emptyDescription, onRemove, removingId }) => {
    if (!members || members.length === 0) {
        return (
            <Card>
                <EmptyState icon={emptyIcon} variant="primary" title={emptyTitle} description={emptyDescription} size="sm" />
            </Card>
        );
    }
    return (
        <Card padding="none">
            <div className="divide-y divide-neutral-100">
                {members.map((m, index) => (
                    <motion.div
                        key={m.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-4 flex items-center gap-4 hover:bg-neutral-50 transition-colors"
                    >
                        <Avatar name={m.name} size="md" />
                        <div className="flex-1 min-w-0">
                            <div className="text-body font-semibold text-neutral-900 truncate">{m.name}</div>
                            <div className="text-caption text-neutral-500 truncate">{m.email}</div>
                        </div>
                        {onRemove && (
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={UserMinus}
                                onClick={() => onRemove(m.id)}
                                loading={removingId === m.id}
                                disabled={removingId != null && removingId !== m.id}
                                className="text-danger-600 hover:bg-danger-50"
                            >
                                <span className="hidden md:inline">Elimină</span>
                            </Button>
                        )}
                    </motion.div>
                ))}
            </div>
        </Card>
    );
};

const QuizzesList = ({ quizzes, onRemove, removingId }) => {
    const navigate = useNavigate();

    if (!quizzes || quizzes.length === 0) {
        return (
            <Card>
                <EmptyState
                    icon={BookOpen}
                    variant="primary"
                    title="Niciun quiz asignat încă"
                    description="Apasă 'Asignează quiz-uri' pentru a adăuga quiz-uri în această clasă."
                    size="sm"
                    action={
                        <Button variant="primary" icon={Plus} onClick={() => navigate('/asignare-quizuri')}>
                            Asignează quiz-uri
                        </Button>
                    }
                />
            </Card>
        );
    }

    return (
        <Card padding="none">
            <div className="divide-y divide-neutral-100">
                {quizzes.map((q, index) => (
                    <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-4 flex items-center gap-4"
                    >
                        <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-6 h-6 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-body font-semibold text-neutral-900 truncate">
                                {q.title}
                            </div>
                            {q.description && (
                                <div className="text-caption text-neutral-500 truncate">
                                    {q.description}
                                </div>
                            )}
                        </div>
                        {onRemove && (
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={Trash2}
                                onClick={() => onRemove(q.id)}
                                loading={removingId === q.id}
                                disabled={removingId != null && removingId !== q.id}
                                className="text-danger-600 hover:bg-danger-50"
                            >
                                <span className="hidden md:inline">Elimină</span>
                            </Button>
                        )}
                    </motion.div>
                ))}
            </div>
        </Card>
    );
};

export default ClassroomDetailPage;