import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ProductsPage from './ProductsPage.jsx';
import { StatCard } from '../design-system/components';
import { cn } from '../design-system/cn';

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
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role || 'ELEV';

    useEffect(() => {
        if (['ELEV', 'PROFESOR', 'EDITOR', 'ADMIN'].includes(role)) {
            api.get('/modules')
                .then(res => setModules(res.data))
                .catch(console.error)
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [role]);

    const firstName = user.name?.split(' ')[0] || 'utilizator';

    return (
        <div className="animate-fade-in">
            {role === 'ELEV' && (
                <>
                    <div className="mb-6">
                        <h1 className="text-h1 font-bold text-neutral-900 mb-1">
                            Salut, {firstName}! 👋
                        </h1>
                        <p className="text-body-lg text-neutral-500">
                            Alege un produs și începe să înveți.
                        </p>
                    </div>
                    <ProductsPage />
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
                        <StatCard title="Elevi înscriși" value="—" icon="👥" />
                        <StatCard title="Exerciții completate" value="—" icon="📊" />
                        <StatCard title="Scor mediu" value="—" icon="⭐" />
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
                        <StatCard title="Utilizatori totali" value="—" icon="👥" />
                        <StatCard title="Module active" value={String(modules.length)} icon="📚" />
                        <StatCard title="Exerciții totale" value="—" icon="📝" />
                    </div>
                    <ModuleList modules={modules} loading={loading} navigate={navigate} />
                </>
            )}
        </div>
    );
}

function ModuleList({ modules, loading, navigate }) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    if (modules.length === 0) {
        return (
            <div className="bg-white rounded-xl border-2 border-dashed border-neutral-200 p-12 text-center">
                <div className="text-4xl mb-3">📚</div>
                <h3 className="text-h3 font-bold text-neutral-900 mb-2">Nu există module încă</h3>
                <p className="text-body text-neutral-500">
                    Trebuie să existe cel puțin un modul cu un quiz asociat în platformă.
                </p>
            </div>
        );
    }
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
                        <div className="text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-1 transition-all">
                            →
                        </div>
                    </button>
                ))}
            </div>
        </>
    );
}