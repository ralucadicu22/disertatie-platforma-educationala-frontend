import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ProductsPage from './ProductsPage.jsx';
import { StatCard } from '../design-system/components';
import { Users, BookOpen, FileText, CheckCircle, BarChart3, School } from 'lucide-react';
import { cn } from '../design-system/cn';
import {classroomApi} from "../api/classroomApi.js";

const ACCENTS = [
    'from-primary-500 to-accent-500',
    'from-primary-400 to-primary-600',
    'from-warm-400 to-accent-400',
    'from-danger-400 to-warm-500',
    'from-success-400 to-primary-400',
];
const ICONS = ['📚', '🔢', '🎯', '⭐', '🧠'];

export default function ModulesPage() {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [classroomsWithQuizzes, setClassroomsWithQuizzes] = useState([]);
    const [loadingQuizzes, setLoadingQuizzes] = useState(false);

    const [userCount, setUserCount] = useState(null);
    const [exerciseCount, setExerciseCount] = useState(null);
    const [classroomCount, setClassroomCount] = useState(null);
    const [quizCount, setQuizCount] = useState(null);
    const [pendingReviewCount, setPendingReviewCount] = useState(null);

    const [profesorStudentCount, setProfesorStudentCount] = useState(null);
    const [profesorClassroomCount, setProfesorClassroomCount] = useState(null);
    const [profesorQuizCount, setProfesorQuizCount] = useState(null);

    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role || 'ELEV';
    const firstName = user.name?.split(' ')[0] || 'utilizator';

    useEffect(() => {
        if (['PROFESOR', 'EDITOR', 'ADMIN'].includes(role)) {
            api.get('/modules')
                .then(res => setModules(res.data))
                .catch(console.error)
                .finally(() => setLoading(false));
        } else if (role === 'ELEV') {
            setLoading(false);
            setLoadingQuizzes(true);
            classroomApi.getMy()
                .then(data => setClassroomsWithQuizzes(data))
                .catch(console.error)
                .finally(() => setLoadingQuizzes(false));
        } else {
            setLoading(false);
        }

        if (role === 'ADMIN') {
            api.get('/users/count')
                .then(res => setUserCount(res.data))
                .catch(console.error);
            api.get('/exercises/count')
                .then(res => setExerciseCount(res.data))
                .catch(console.error);
            api.get('/classrooms')
                .then(res => setClassroomCount(res.data.length))
                .catch(console.error);
            api.get('/quizzes')
                .then(res => setQuizCount(res.data.length))
                .catch(console.error);
            api.get('/exercises/filter?status=PENDING_REVIEW')
                .then(res => setPendingReviewCount(res.data.length))
                .catch(console.error);
        }

        if (role === 'PROFESOR') {
            api.get('/classrooms/my')
                .then(res => {
                    const classrooms = res.data;
                    setProfesorClassroomCount(classrooms.length);

                    const studentIds = new Set();
                    let totalQuizzes = 0;
                    classrooms.forEach(c => {
                        (c.studentIds || c.students || []).forEach(s => {
                            const id = s.id ?? s;
                            studentIds.add(id);
                        });
                        totalQuizzes += (c.quizCount ?? c.assignedQuizzes?.length ?? 0);
                    });
                    setProfesorStudentCount(studentIds.size);
                    setProfesorQuizCount(totalQuizzes);
                })
                .catch(console.error);
        }
    }, [role]);

    const fmt = (val) => val !== null ? String(val) : '—';

    return (
        <div className="animate-fade-in">

            {role === 'ELEV' && (
                <>
                    <div className="mb-6">
                        <h1 className="text-h1 font-bold text-neutral-900 mb-1">
                            Salut, {firstName}! 👋
                        </h1>
                        <p className="text-body-lg text-neutral-500">
                            Alege o clasă pentru a rezolva exercițiile.
                        </p>
                    </div>

                    {loadingQuizzes ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : classroomsWithQuizzes.length === 0 ? (
                        <div className="bg-white rounded-xl border-2 border-dashed border-neutral-200 p-12 text-center">
                            <div className="text-4xl mb-3">📭</div>
                            <h3 className="text-h3 font-bold text-neutral-900 mb-2">
                                Nu ești în nicio clasă încă
                            </h3>
                            <p className="text-body text-neutral-500">
                                Profesorul tău trebuie să te adauge într-o clasă.
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-micro text-neutral-400 uppercase tracking-widest font-bold mb-3">
                                Clasele mele
                            </p>
                            <div className="flex flex-col gap-3">
                                {classroomsWithQuizzes.map((classroom, i) => (
                                    <button
                                        key={classroom.id}
                                        onClick={() => navigate(`/clase/${classroom.id}`)}
                                        className="group flex items-center gap-4 bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left w-full"
                                    >
                                        <div className={cn(
                                            'w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-gradient-to-br text-white shadow-sm',
                                            ACCENTS[i % ACCENTS.length]
                                        )}>
                                            🎓
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-body-lg font-bold text-neutral-900 mb-0.5">
                                                {classroom.name}
                                            </p>
                                            <p className="text-caption text-neutral-500">
                                                {classroom.quizCount || 0} quiz-uri · {classroom.studentCount || 0} elevi
                                            </p>
                                        </div>
                                        <div className="text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-1 transition-all">
                                            →
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}

            {role === 'PROFESOR' && (
                <>
                    <div className="mb-6">
                        <h1 className="text-h1 font-bold text-neutral-900 mb-1">
                            Bine ai venit, {firstName}!
                        </h1>
                        <p className="text-body-lg text-neutral-500">
                            Monitorizează progresul elevilor și gestionează conținut.
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <StatCard label="Elevi înscriși" value={fmt(profesorStudentCount)} icon={Users} />
                        <StatCard label="Clase active" value={fmt(profesorClassroomCount)} icon={School} />
                        <StatCard label="Quiz-uri atribuite" value={fmt(profesorQuizCount)} icon={CheckCircle} />
                    </div>
                    <ModuleList modules={modules} loading={loading} navigate={navigate} />
                </>
            )}

            {role === 'EDITOR' && (
                <>
                    <div className="mb-6">
                        <h1 className="text-h1 font-bold text-neutral-900 mb-1">
                            Bine ai venit, {firstName}! ✏️
                        </h1>
                        <p className="text-body-lg text-neutral-500">
                            Alege un modul pentru a construi sau edita exerciții.
                        </p>
                    </div>
                    <ModuleList modules={modules} loading={loading} navigate={navigate} />
                </>
            )}

            {role === 'ADMIN' && (
                <>
                    <div className="mb-6">
                        <h1 className="text-h1 font-bold text-neutral-900 mb-1">
                            Panou Administrare ⚙️
                        </h1>
                        <p className="text-body-lg text-neutral-500">
                            Gestionezi platforma, utilizatorii și conținutul.
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <StatCard label="Utilizatori totali" value={fmt(userCount)} icon={Users} />
                        <StatCard label="Module active" value={String(modules.length)} icon={BookOpen} />
                        <StatCard label="Exerciții totale" value={fmt(exerciseCount)} icon={FileText} />
                        <StatCard label="Clase active" value={fmt(classroomCount)} icon={School} />
                        <StatCard label="Quiz-uri totale" value={fmt(quizCount)} icon={CheckCircle} />
                        <StatCard
                            label="Pending review"
                            value={fmt(pendingReviewCount)}
                            icon={BarChart3}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

function ModuleList({ modules, loading, navigate }) {
    if (loading) return (
        <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
    if (modules.length === 0) return (
        <div className="bg-white rounded-xl border-2 border-dashed border-neutral-200 p-12 text-center">
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-h3 font-bold text-neutral-900 mb-2">Nu există module încă</h3>
            <p className="text-body text-neutral-500">
                Trebuie să existe cel puțin un modul cu un quiz asociat în platformă.
            </p>
        </div>
    );
    return (
        <>
            <p className="text-micro text-neutral-400 uppercase tracking-widest font-bold mb-3">
                Module disponibile
            </p>
            <div className="flex flex-col gap-3">
                {modules.map((m, i) => (
                    <button
                        key={m.id}
                        onClick={() => navigate(`/module/${m.id}`)}
                        className="group flex items-center gap-4 bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left w-full"
                    >
                        <div className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-gradient-to-br text-white shadow-sm',
                            ACCENTS[i % ACCENTS.length]
                        )}>
                            {ICONS[i % ICONS.length]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-body-lg font-bold text-neutral-900 mb-0.5">{m.title}</p>
                            <p className="text-caption text-neutral-500 truncate">{m.description}</p>
                        </div>
                        <div className="text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-1 transition-all">→</div>
                    </button>
                ))}
            </div>
        </>
    );
}
