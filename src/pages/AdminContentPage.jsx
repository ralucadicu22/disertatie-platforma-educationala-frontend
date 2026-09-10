import { useEffect, useState } from 'react';
import { adminContentApi } from '../api/adminContentApi';
import { cn } from '../design-system/cn';
import { Modal } from '../design-system/components';

export default function AdminContentPage() {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [modules, setModules] = useState([]);
    const [selectedModule, setSelectedModule] = useState(null);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');


    const [modal, setModal] = useState(null);

    useEffect(() => {
        adminContentApi.getProducts()
            .then(setProducts)
            .catch(() => setError('Eroare la încărcarea produselor'))
            .finally(() => setLoading(false));
    }, []);
    useEffect(() => {
        if (!selectedProduct) { setModules([]); setSelectedModule(null); setQuizzes([]); return; }
        adminContentApi.getModulesByProduct(selectedProduct.id)
            .then(setModules)
            .catch(() => setError('Eroare la încărcarea modulelor'));
    }, [selectedProduct]);

    useEffect(() => {
        if (!selectedModule) { setQuizzes([]); return; }
        adminContentApi.getQuizzesByModule(selectedModule.id)
            .then(setQuizzes)
            .catch(() => setError('Eroare la încărcarea quiz-urilor'));
    }, [selectedModule]);

    const openModal = (type, mode, data = {}) => setModal({ type, mode, data });
    const closeModal = () => setModal(null);

    const handleSave = async (formData) => {
        try {
            if (modal.type === 'product') {
                if (modal.mode === 'create') {
                    const created = await adminContentApi.createProduct(formData);
                    setProducts(prev => [...prev, created]);
                } else {
                    const updated = await adminContentApi.updateProduct(modal.data.id, formData);
                    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
                    if (selectedProduct?.id === updated.id) setSelectedProduct(updated);
                }
            } else if (modal.type === 'module') {
                if (modal.mode === 'create') {
                    const created = await adminContentApi.createModule(selectedProduct.id, formData);
                    setModules(prev => [...prev, created]);
                } else {
                    const updated = await adminContentApi.updateModule(modal.data.id, formData);
                    setModules(prev => prev.map(m => m.id === updated.id ? updated : m));
                    if (selectedModule?.id === updated.id) setSelectedModule(updated);
                }
            } else if (modal.type === 'quiz') {
                if (modal.mode === 'create') {
                    const created = await adminContentApi.createQuiz(selectedModule.id, formData);
                    setQuizzes(prev => [...prev, created]);
                } else {
                    const updated = await adminContentApi.updateQuiz(modal.data.id, formData);
                    setQuizzes(prev => prev.map(q => q.id === updated.id ? updated : q));
                }
            }
            closeModal();
        } catch (err) {
            setError(err.response?.data?.message || 'Eroare la salvare');
        }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm('Ești sigur? Această acțiune este ireversibilă.')) return;
        try {
            if (type === 'product') {
                await adminContentApi.deleteProduct(id);
                setProducts(prev => prev.filter(p => p.id !== id));
                if (selectedProduct?.id === id) { setSelectedProduct(null); }
            } else if (type === 'module') {
                await adminContentApi.deleteModule(id);
                setModules(prev => prev.filter(m => m.id !== id));
                if (selectedModule?.id === id) { setSelectedModule(null); }
            } else if (type === 'quiz') {
                await adminContentApi.deleteQuiz(id);
                setQuizzes(prev => prev.filter(q => q.id !== id));
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Eroare la ștergere');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <h1 className="text-h2 font-bold text-neutral-900 mb-1">
                    Gestionare conținut
                </h1>
                <p className="text-body text-neutral-500">
                    Administrează produse, module și quiz-uri.
                </p>
            </div>

            {error && (
                <div className="flex items-center gap-2 bg-danger-50 border border-danger-200 text-danger-700 rounded-md px-4 py-3 text-body font-semibold mb-4">
                    ⚠️ {error}
                    <button onClick={() => setError('')} className="ml-auto text-danger-400 hover:text-danger-600">✕</button>
                </div>
            )}

            <div className="grid grid-cols-3 gap-4">

                {/* Column 1: Products */}
                <ContentColumn
                    title="Produse"
                    onAdd={() => openModal('product', 'create')}
                    addLabel="+ Produs nou"
                >
                    {products.length === 0 ? (
                        <EmptyCol message="Niciun produs" />
                    ) : products.map(p => (
                        <ContentRow
                            key={p.id}
                            label={p.title}
                            sublabel={p.subject}
                            selected={selectedProduct?.id === p.id}
                            onClick={() => {
                                setSelectedProduct(p);
                                setSelectedModule(null);
                            }}
                            onEdit={() => openModal('product', 'edit', p)}
                            onDelete={() => handleDelete('product', p.id)}
                        />
                    ))}
                </ContentColumn>
                <ContentColumn
                    title={selectedProduct ? `Module — ${selectedProduct.title}` : 'Module'}
                    onAdd={selectedProduct ? () => openModal('module', 'create') : null}
                    addLabel="+ Modul nou"
                    disabled={!selectedProduct}
                >
                    {!selectedProduct ? (
                        <EmptyCol message="Selectează un produs" icon="←" />
                    ) : modules.length === 0 ? (
                        <EmptyCol message="Niciun modul" />
                    ) : modules.map(m => (
                        <ContentRow
                            key={m.id}
                            label={m.title}
                            sublabel={`Ordinea: ${m.orderIndex}`}
                            selected={selectedModule?.id === m.id}
                            onClick={() => setSelectedModule(m)}
                            onEdit={() => openModal('module', 'edit', m)}
                            onDelete={() => handleDelete('module', m.id)}
                        />
                    ))}
                </ContentColumn>

                <ContentColumn
                    title={selectedModule ? `Quiz-uri — ${selectedModule.title}` : 'Quiz-uri'}
                    onAdd={selectedModule ? () => openModal('quiz', 'create') : null}
                    addLabel="+ Quiz nou"
                    disabled={!selectedModule}
                >
                    {!selectedModule ? (
                        <EmptyCol message="Selectează un modul" icon="←" />
                    ) : quizzes.length === 0 ? (
                        <EmptyCol message="Niciun quiz" />
                    ) : quizzes.map(q => (
                        <ContentRow
                            key={q.id}
                            label={q.title}
                            sublabel={`${q.maxAttempts === 0 ? 'Nelimitat' : q.maxAttempts + ' încercări'}`}
                            selected={false}
                            onClick={() => {}}
                            onEdit={() => openModal('quiz', 'edit', q)}
                            onDelete={() => handleDelete('quiz', q.id)}
                            noSelect
                        />
                    ))}
                </ContentColumn>
            </div>
            {modal && (
                <ContentModal
                    modal={modal}
                    onSave={handleSave}
                    onClose={closeModal}
                />
            )}
        </div>
    );
}

function ContentColumn({ title, children, onAdd, addLabel, disabled }) {
    return (
        <div className="bg-white rounded-xl border border-neutral-200 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 bg-neutral-50">
                <span className="text-caption font-bold text-neutral-600 uppercase tracking-wide truncate">
                    {title}
                </span>
                {onAdd && (
                    <button
                        onClick={onAdd}
                        disabled={disabled}
                        className="text-caption font-bold text-primary-600 hover:text-primary-700 transition-colors whitespace-nowrap ml-2"
                    >
                        {addLabel}
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto max-h-[60vh] divide-y divide-neutral-50">
                {children}
            </div>
        </div>
    );
}

function ContentRow({ label, sublabel, selected, onClick, onEdit, onDelete, noSelect }) {
    return (
        <div
            onClick={noSelect ? undefined : onClick}
            className={cn(
                'flex items-center gap-2 px-4 py-3 transition-colors',
                !noSelect && 'cursor-pointer',
                selected
                    ? 'bg-primary-50 border-l-2 border-primary-500'
                    : !noSelect && 'hover:bg-neutral-50'
            )}
        >
            <div className="flex-1 min-w-0">
                <p className={cn(
                    'text-body font-semibold truncate',
                    selected ? 'text-primary-700' : 'text-neutral-900'
                )}>
                    {label}
                </p>
                {sublabel && (
                    <p className="text-caption text-neutral-400 truncate">{sublabel}</p>
                )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="p-1.5 rounded-md text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                    title="Editează"
                >
                    ✏️
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-1.5 rounded-md text-neutral-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
                    title="Șterge"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
}

function EmptyCol({ message, icon }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 text-neutral-400">
            {icon && <span className="text-2xl mb-2">{icon}</span>}
            <p className="text-caption font-semibold">{message}</p>
        </div>
    );
}

function ContentModal({ modal, onSave, onClose }) {
    const isProduct = modal.type === 'product';
    const isModule = modal.type === 'module';
    const isQuiz = modal.type === 'quiz';
    const isEdit = modal.mode === 'edit';

    const [form, setForm] = useState({
        title: modal.data.title || '',
        description: modal.data.description || '',
        orderIndex: modal.data.orderIndex ?? 0,
        // product fields
        coverImageUrl: modal.data.coverImageUrl || '',
        targetAgeGroup: modal.data.targetAgeGroup || '',
        subject: modal.data.subject || '',
        // quiz fields
        maxAttempts: modal.data.maxAttempts ?? 0,
        maxReplays: modal.data.maxReplays ?? 0,
    });
    const [saving, setSaving] = useState(false);

    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        setSaving(true);
        await onSave(form);
        setSaving(false);
    };

    const titles = {
        product: isEdit ? 'Editează produs' : 'Produs nou',
        module: isEdit ? 'Editează modul' : 'Modul nou',
        quiz: isEdit ? 'Editează quiz' : 'Quiz nou',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-scale-in">
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
                    <h2 className="text-h3 font-bold text-neutral-900">{titles[modal.type]}</h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-xl">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
                    <Field label="Titlu *">
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => set('title', e.target.value)}
                            required
                            placeholder="ex: Matematica - Clasa Pregătitoare"
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Descriere">
                        <textarea
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            placeholder="Descriere opțională..."
                            rows={3}
                            className={inputCls + ' resize-none'}
                        />
                    </Field>

                    <Field label="Ordine (index)">
                        <input
                            type="number"
                            value={form.orderIndex}
                            onChange={e => set('orderIndex', parseInt(e.target.value) || 0)}
                            min={0}
                            className={inputCls}
                        />
                    </Field>

                    {isProduct && (
                        <>
                            <Field label="Materie">
                                <input
                                    type="text"
                                    value={form.subject}
                                    onChange={e => set('subject', e.target.value)}
                                    placeholder="ex: Matematică"
                                    className={inputCls}
                                />
                            </Field>
                            <Field label="Grupă de vârstă">
                                <input
                                    type="text"
                                    value={form.targetAgeGroup}
                                    onChange={e => set('targetAgeGroup', e.target.value)}
                                    placeholder="ex: 5-7 ani"
                                    className={inputCls}
                                />
                            </Field>
                            <Field label="URL imagine copertă">
                                <input
                                    type="text"
                                    value={form.coverImageUrl}
                                    onChange={e => set('coverImageUrl', e.target.value)}
                                    placeholder="https://..."
                                    className={inputCls}
                                />
                            </Field>
                        </>
                    )}

                    {isQuiz && (
                        <>
                            <Field label="Număr maxim încercări (0 = nelimitat)">
                                <input
                                    type="number"
                                    value={form.maxAttempts}
                                    onChange={e => set('maxAttempts', parseInt(e.target.value) || 0)}
                                    min={0}
                                    className={inputCls}
                                />
                            </Field>
                            <Field label="Număr maxim replay-uri (0 = nelimitat)">
                                <input
                                    type="number"
                                    value={form.maxReplays}
                                    onChange={e => set('maxReplays', parseInt(e.target.value) || 0)}
                                    min={0}
                                    className={inputCls}
                                />
                            </Field>
                        </>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-neutral-200 rounded-lg text-body font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
                        >
                            Anulează
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !form.title.trim()}
                            className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-body font-bold hover:bg-primary-700 transition-colors disabled:opacity-60"
                        >
                            {saving ? 'Se salvează...' : isEdit ? 'Salvează' : 'Creează'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-caption font-bold text-neutral-600 uppercase tracking-wide">
                {label}
            </label>
            {children}
        </div>
    );
}

const inputCls = [
    'w-full px-3 py-2.5 rounded-lg border-2 border-neutral-200 bg-white',
    'text-body text-neutral-900 placeholder-neutral-400',
    'focus:outline-none focus:border-primary-400 transition-colors font-sans',
].join(' ');