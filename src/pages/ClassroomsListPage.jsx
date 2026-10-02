import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Users, GraduationCap, School, ChevronRight, AlertCircle } from 'lucide-react';
import { Card, Button, Badge, EmptyState, Skeleton } from '../design-system/components';
import CreateClassroomModal from '../components/classroom/CreateClassroomModal';
import { classroomApi } from '../api/classroomApi';
import { gradeLevelLabel } from '../utils/gradeLevel';
import { notify } from '../design-system/toast';

const ClassroomsListPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [classrooms, setClassrooms] = useState([]);
    const [createOpen, setCreateOpen] = useState(false);

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isAdmin = user?.role === 'ADMIN';

    const load = () => {
        setLoading(true);
        setError(null);
        const promise = isAdmin ? classroomApi.getAll() : classroomApi.getMy();
        promise
            .then((data) => { setClassrooms(data || []); setLoading(false); })
            .catch((err) => {
                setError(err?.response?.data?.message || 'Nu am putut încărca clasele');
                setLoading(false);
            });
    };

    useEffect(() => { load(); }, []);

    return (
        <div user={user} title="Clase">
            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <h1 className="text-h1 text-neutral-900">
                        {isAdmin ? 'Toate clasele' : 'Clasele mele'}
                    </h1>
                    <p className="text-body-lg text-neutral-600 mt-1">
                        {isAdmin
                            ? 'Gestionați clasele, profesorii și elevii.'
                            : 'Clasele în care sunteți profesor.'}
                    </p>
                </div>
                <Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>
                    Clasă nouă
                </Button>
            </div>

            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="card" height={160} />)}
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
                        title="Nu există clase încă"
                        description={isAdmin
                            ? 'Creează prima clasă pentru a începe.'
                            : 'Contactează administratorul pentru a fi adăugat într-o clasă.'}
                        action={isAdmin
                            ? <Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>Creează prima clasă</Button>
                            : null}
                    />
                </Card>
            )}

            {!loading && !error && classrooms.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {classrooms.map((c, index) => (
                        <motion.div
                            key={c.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.04, duration: 0.3 }}
                        >
                            <Card interactive onClick={() => navigate(`/clase/${c.id}`)} padding="md" className="h-full">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            {!c.active && <Badge variant="neutral" size="sm">Inactiva</Badge>}
                                            {c.gradeLevel && <Badge variant="primary" size="sm">{gradeLevelLabel(c.gradeLevel)}</Badge>}
                                            {c.schoolYear && <Badge variant="neutral" size="sm">{c.schoolYear}</Badge>}
                                        </div>
                                        <h3 className="text-h3 text-neutral-900 truncate">{c.name}</h3>
                                        {c.description && (
                                            <p className="text-caption text-neutral-500 mt-1 line-clamp-2">{c.description}</p>
                                        )}
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                                </div>
                                <div className="flex items-center gap-4 pt-3 border-t border-neutral-100">
                                    <div className="flex items-center gap-1.5 text-caption text-neutral-600">
                                        <GraduationCap className="w-4 h-4 text-primary-500" />
                                        <span className="font-bold text-neutral-800">{c.teacherCount}</span>
                                        <span>profesori</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-caption text-neutral-600">
                                        <Users className="w-4 h-4 text-accent-500" />
                                        <span className="font-bold text-neutral-800">{c.studentCount}</span>
                                        <span>elevi</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-caption text-neutral-600">
                                        <School className="w-4 h-4 text-warm-500" />
                                        <span className="font-bold text-neutral-800">{c.quizCount}</span>
                                        <span>quiz-uri</span>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            <CreateClassroomModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={() => load()}
            />
        </div>
    );
};

export default ClassroomsListPage;