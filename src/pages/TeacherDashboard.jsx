import { useEffect, useState } from 'react';
import api from '../api/axios';
import { StatCard } from '../design-system/components';
import { cn } from '../design-system/cn';
import { exportApi } from '../api/exportApi';
import { classroomApi } from '../api/classroomApi';
import { Users, CheckCircle, BarChart3 } from 'lucide-react';

export default function TeacherDashboard() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myClassrooms, setMyClassrooms] = useState([]);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        api.get('/progress/teacher/all-students')
            .then(res => setStudents(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));

        classroomApi.getMy()
            .then(setMyClassrooms)
            .catch(console.error);
    }, []);

    const handleExport = async (classroomId, classroomName, type) => {
        setExporting(true);
        try {
            if (type === 'detailed') {
                await exportApi.downloadClassroomCsv(classroomId, classroomName);
            } else {
                await exportApi.downloadClassroomSummaryCsv(classroomId, classroomName);
            }
        } catch (err) {
            console.error('Eroare la export:', err);
        } finally {
            setExporting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const sorted = [...students].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
    const totalCompleted = students.reduce((s, x) => s + (x.completedExercises || 0), 0);
    const avgPoints = students.length
        ? Math.round(students.reduce((s, x) => s + (x.totalPoints || 0), 0) / students.length)
        : 0;

    const RANK_STYLES = [
        'bg-warning-100 text-warning-700',
        'bg-neutral-100 text-neutral-600',
        'bg-warm-100 text-warm-700',
    ];

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="mb-6">
                <h1 className="text-h2 font-bold text-neutral-900 mb-1">Dashboard Profesor</h1>
                <p className="text-body text-neutral-500">Privire de ansamblu asupra activității elevilor.</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <StatCard label="Elevi activi" value={String(students.length)} icon={Users} />
                <StatCard label="Exerciții rezolvate" value={String(totalCompleted)} icon={CheckCircle} variant="success" />
                <StatCard label="Scor mediu / elev" value={String(avgPoints)} icon={BarChart3} variant="warning" />
            </div>

            {myClassrooms.length > 0 && (
                <>
                    <p className="text-micro text-neutral-400 uppercase tracking-widest font-bold mb-3">
                        Export rezultate
                    </p>
                    <div className="flex flex-col gap-3 mb-8">
                        {myClassrooms.map(classroom => (
                            <div
                                key={classroom.id}
                                className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center justify-between"
                            >
                                <div>
                                    <p className="text-body font-bold text-neutral-900">{classroom.name}</p>
                                    <p className="text-caption text-neutral-500">
                                        {classroom.studentCount} elevi · {classroom.quizCount} quiz-uri
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleExport(classroom.id, classroom.name, 'summary')}
                                        disabled={exporting}
                                        className="px-3 py-1.5 bg-success-600 text-white rounded-lg text-caption font-bold hover:bg-success-700 transition-colors disabled:opacity-60"
                                    >
                                        📊 Sumar CSV
                                    </button>
                                    <button
                                        onClick={() => handleExport(classroom.id, classroom.name, 'detailed')}
                                        disabled={exporting}
                                        className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-caption font-bold hover:bg-primary-700 transition-colors disabled:opacity-60"
                                    >
                                        📋 Detaliat CSV
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <p className="text-micro text-neutral-400 uppercase tracking-widest font-bold mb-3">
                Progresul elevilor
            </p>

            {students.length === 0 ? (
                <div className="bg-white rounded-xl border-2 border-dashed border-neutral-200 p-12 text-center">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-body text-neutral-500">
                        Nu există elevi cu activitate înregistrată.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                    <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                        {['#', 'Elev', 'Rezolvate', 'Încercări', 'Puncte'].map((h, i) => (
                            <div
                                key={h}
                                className={cn(
                                    'text-micro text-neutral-400 font-bold uppercase tracking-wide',
                                    i === 0 ? 'col-span-1' : i === 1 ? 'col-span-5' : 'col-span-2 text-center'
                                )}
                            >
                                {h}
                            </div>
                        ))}
                    </div>

                    {sorted.map((s, i) => (
                        <div
                            key={s.userId}
                            className="grid grid-cols-12 gap-2 items-center px-4 py-3.5 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
                        >
                            <div className="col-span-1">
                                <span className={cn(
                                    'inline-flex w-7 h-7 rounded-lg items-center justify-center text-caption font-bold',
                                    i < 3 ? RANK_STYLES[i] : 'text-neutral-400'
                                )}>
                                    {i + 1}
                                </span>
                            </div>
                            <div className="col-span-5 flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-hero-primary flex items-center justify-center text-white text-caption font-bold flex-shrink-0">
                                    {s.userName?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <span className="text-body font-semibold text-neutral-900 truncate">
                                    {s.userName}
                                </span>
                            </div>
                            <div className="col-span-2 text-center text-body font-semibold text-neutral-700">
                                {s.completedExercises || 0}
                            </div>
                            <div className="col-span-2 text-center text-body font-semibold text-neutral-700">
                                {s.totalSubmissions || 0}
                            </div>
                            <div className="col-span-2 text-center">
                                <span className="px-2.5 py-1 bg-warning-100 text-warning-700 rounded-full text-caption font-bold">
                                    {s.totalPoints || 0}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}