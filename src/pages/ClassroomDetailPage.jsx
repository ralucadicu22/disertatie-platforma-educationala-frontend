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
import { gradeLevelLabel } from '../utils/gradeLevel';
import { formatDate } from '../utils/formatters';
import { notify } from '../design-system/toast';

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

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isAdmin = user?.role === 'ADMIN';

    const load = () => {
        setLoading(true);
        setError(null);
        classroomApi.getOne(id)
            .then((data) => { setClassroom(data); setLoading(false); })
            .catch((err) => {
                setError(err?.response?.data?.message || 'Nu am putut incarca clasa');
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

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await classroomApi.delete(id);
            notify.success('Clasa a fost stearsa');
            navigate('/clase');
        } catch (err) {
            notify.error(err?.response?.data?.message || 'Nu am putut sterge clasa');
            setDeleting(false);
        }
    };

    const excludeIds = tab === 'teachers'
        ? (classroom?.teachers || []).map((t) => t.id)
        : (classroom?.students || []).map((s) => s.id);

    return (
        <div user={user} title={classroom?.name || 'Detaliu clasa'} back={{ to: '/clase' }}>
            {loading && (
                <div className="space-y-6">
                    <Skeleton variant="card" height={160} />
                    <Skeleton variant="card" height={300} />
                </div>
            )}

            {error && !loading && (
                <Card>
                    <EmptyState
                        icon={AlertCircle}
                        variant="warm"
                        title="A aparut o eroare"
                        description={error}
                        action={<Button variant="primary" onClick={load}>Reincarca</Button>}
                    />
                </Card>
            )}

            {!loading && !error && classroom && (
                <>
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
                                        Creata pe {formatDate(classroom.createdAt)}
                                    </p>
                                </div>
                                {isAdmin && (
                                    <Button
                                        variant="ghost"
                                        icon={Trash2}
                                        onClick={() => setDeleteOpen(true)}
                                        className="text-danger-600 hover:bg-danger-50"
                                    >
                                        <span className="hidden md:inline">Sterge</span>
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
                        {tab !== 'quizzes' && (isAdmin || tab === 'students') && (
                            <Button variant="primary" icon={Plus} onClick={() => setAddOpen(true)}>
                                {tab === 'teachers' ? 'Adauga profesor' : 'Adauga elev'}
                            </Button>
                        )}
                    </div>

                    {tab === 'students' && (
                        <MemberList
                            members={classroom.students}
                            emptyIcon={Users}
                            emptyTitle="Nu exista elevi inca"
                            emptyDescription="Adauga primul elev in aceasta clasa."
                            onRemove={(uid) => handleRemoveMember(uid, 'student')}
                            removingId={removingId}
                        />
                    )}
                    {tab === 'teachers' && (
                        <MemberList
                            members={classroom.teachers}
                            emptyIcon={GraduationCap}
                            emptyTitle="Nu exista profesori inca"
                            emptyDescription="Doar administratorii pot adauga profesori."
                            onRemove={isAdmin ? (uid) => handleRemoveMember(uid, 'teacher') : null}
                            removingId={removingId}
                        />
                    )}
                    {tab === 'quizzes' && (
                        <QuizzesList quizzes={classroom.assignedQuizzes} />
                    )}
                </>
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
                title="Sterge clasa?"
                description={`Aceasta actiune va sterge definitiv clasa "${classroom?.name}".`}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                            Anuleaza
                        </Button>
                        <Button variant="danger" icon={Trash2} onClick={handleDelete} loading={deleting}>
                            Sterge definitiv
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
                                <span className="hidden md:inline">Elimina</span>
                            </Button>
                        )}
                    </motion.div>
                ))}
            </div>
        </Card>
    );
};

const QuizzesList = ({ quizzes }) => {
    if (!quizzes || quizzes.length === 0) {
        return (
            <Card>
                <EmptyState
                    icon={BookOpen}
                    variant="primary"
                    title="Niciun quiz asignat inca"
                    description="Asigneaza quiz-uri din pagina de gestiune quiz-uri."
                    size="sm"
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
                            <div className="text-body font-semibold text-neutral-900 truncate">{q.title}</div>
                            {q.description && (
                                <div className="text-caption text-neutral-500 truncate">{q.description}</div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </Card>
    );
};

export default ClassroomDetailPage;