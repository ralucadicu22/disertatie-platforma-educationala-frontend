import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, UserPlus, UserMinus, ChevronDown, ChevronUp,
    AlertCircle, Search, Link2,
} from 'lucide-react';
import {
    Card, Button, Badge, Avatar, EmptyState,
    Skeleton, Input, Modal, Select,
} from '../design-system/components';
import { parentChildApi } from '../api/parentChildApi';
import { userApi } from '../api/userApi';
import { notify } from '../design-system/toast';
import { cn } from '../design-system/cn';

const ParentChildAdminPage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [parents, setParents] = useState([]);
    const [expanded, setExpanded] = useState(new Set());
    const [search, setSearch] = useState('');
    const [linkModal, setLinkModal] = useState(false);
    const [removingKey, setRemovingKey] = useState(null);

    const user = JSON.parse(localStorage.getItem('user') || 'null');

    const load = () => {
        setLoading(true);
        setError(null);
        parentChildApi.getAll()
            .then((data) => { setParents(data || []); setLoading(false); })
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

    const handleUnlink = async (parentId, childId, childName) => {
        const key = `${parentId}-${childId}`;
        setRemovingKey(key);
        try {
            await parentChildApi.unlink(parentId, childId);
            notify.success(`Asocierea cu "${childName}" a fost eliminată`);
            setParents((prev) =>
                prev.map((p) =>
                    p.parentId === parentId
                        ? { ...p, children: p.children.filter((c) => c.id !== childId) }
                        : p
                )
            );
        } catch (err) {
            notify.error(err?.response?.data?.message || 'Nu am putut elimina asocierea');
        } finally {
            setRemovingKey(null);
        }
    };

    const filtered = useMemo(() => {
        if (!search.trim()) return parents;
        const q = search.trim().toLowerCase();
        return parents.filter((p) =>
            p.parentName?.toLowerCase().includes(q) ||
            p.parentEmail?.toLowerCase().includes(q) ||
            p.children?.some((c) => c.name?.toLowerCase().includes(q))
        );
    }, [parents, search]);

    return (
        <div user={user} title="Asocieri părinte-copil">
            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <h1 className="text-h1 text-neutral-900">Asocieri părinte-copil</h1>
                    <p className="text-body-lg text-neutral-600 mt-1">
                        Gestionează legăturile dintre conturi de parinte și elevi.
                    </p>
                </div>
                <Button variant="primary" icon={Link2} onClick={() => setLinkModal(true)}>
                    Asociază parinte-copil
                </Button>
            </div>


            {!loading && !error && parents.length > 0 && (
                <div className="mb-4">
                    <Input
                        placeholder="Caută după parinte sau elev..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        icon={Search}
                    />
                </div>
            )}


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
                        action={<Button variant="primary" onClick={load}>Reincarca</Button>}
                    />
                </Card>
            )}


            {!loading && !error && parents.length === 0 && (
                <Card>
                    <EmptyState
                        icon={Users}
                        variant="primary"
                        title="Nu exista asocieri inca"
                        description="Adauga prima asociere parinte-copil folosind butonul de mai sus."
                        action={
                            <Button variant="primary" icon={Link2} onClick={() => setLinkModal(true)}>
                                Asociaza parinte-copil
                            </Button>
                        }
                    />
                </Card>
            )}

            {!loading && !error && filtered.length > 0 && (
                <div className="space-y-3">
                    {filtered.map((parent, index) => {
                        const isExpanded = expanded.has(parent.parentId);
                        const childCount = parent.children?.length ?? 0;

                        return (
                            <motion.div
                                key={parent.parentId}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                            >
                                <Card padding="none">

                                    <div className="p-4 flex items-center gap-4">
                                        <Avatar name={parent.parentName} size="md" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-body font-semibold text-neutral-900 truncate">
                                                    {parent.parentName}
                                                </span>
                                                <Badge variant="accent" size="sm">PARINTE</Badge>
                                                <Badge
                                                    variant={childCount > 0 ? 'success' : 'neutral'}
                                                    size="sm"
                                                >
                                                    {childCount} {childCount === 1 ? 'copil' : 'copii'}
                                                </Badge>
                                            </div>
                                            <div className="text-caption text-neutral-500 mt-0.5">
                                                {parent.parentEmail}
                                            </div>
                                        </div>
                                        {childCount > 0 && (
                                            <button
                                                onClick={() => toggleExpand(parent.parentId)}
                                                className="p-2 rounded-md hover:bg-neutral-100 transition-colors text-neutral-500"
                                            >
                                                {isExpanded
                                                    ? <ChevronUp className="w-5 h-5" />
                                                    : <ChevronDown className="w-5 h-5" />
                                                }
                                            </button>
                                        )}
                                    </div>

                                    <AnimatePresence>
                                        {isExpanded && childCount > 0 && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden border-t border-neutral-100"
                                            >
                                                <div className="divide-y divide-neutral-100">
                                                    {parent.children.map((child) => {
                                                        const key = `${parent.parentId}-${child.id}`;
                                                        const isRemoving = removingKey === key;

                                                        return (
                                                            <div
                                                                key={child.id}
                                                                className="px-4 py-3 flex items-center gap-3 hover:bg-neutral-50 transition-colors"
                                                            >
                                                                <Avatar name={child.name} size="sm" />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-body font-semibold text-neutral-900 truncate">
                                                                        {child.name}
                                                                    </div>
                                                                    <div className="text-caption text-neutral-500 truncate">
                                                                        {child.email}
                                                                    </div>
                                                                </div>
                                                                <Badge variant="primary" size="sm">ELEV</Badge>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    icon={UserMinus}
                                                                    loading={isRemoving}
                                                                    disabled={removingKey != null && !isRemoving}
                                                                    onClick={() => handleUnlink(
                                                                        parent.parentId,
                                                                        child.id,
                                                                        child.name
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

                                    {childCount === 0 && (
                                        <div className="px-4 pb-4 pt-1">
                                            <p className="text-caption text-neutral-400 italic">
                                                Niciun copil asociat încă.
                                            </p>
                                        </div>
                                    )}
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {!loading && !error && parents.length > 0 && filtered.length === 0 && (
                <Card>
                    <EmptyState
                        icon={Search}
                        variant="neutral"
                        title="Niciun rezultat"
                        description="Incearcă alt termen de căutare."
                        size="sm"
                    />
                </Card>
            )}

            <LinkParentChildModal
                open={linkModal}
                onClose={() => setLinkModal(false)}
                onLinked={load}
            />
        </div>
    );
};


const LinkParentChildModal = ({ open, onClose, onLinked }) => {
    const [parents, setParents] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedParent, setSelectedParent] = useState('');
    const [selectedChild, setSelectedChild] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!open) return;
        setSelectedParent('');
        setSelectedChild('');
        setErrors({});
        setLoading(true);

        Promise.all([
            userApi.getByRole('PARINTE'),
            userApi.getByRole('ELEV'),
        ])
            .then(([p, s]) => {
                setParents(p || []);
                setStudents(s || []);
                setLoading(false);
            })
            .catch(() => {
                notify.error('Nu am putut încărca utilizatorii');
                setLoading(false);
            });
    }, [open]);

    const validate = () => {
        const e = {};
        if (!selectedParent) e.parent = 'Selectează un parinte';
        if (!selectedChild) e.child = 'Selectează un elev';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            await parentChildApi.link(
                Number(selectedParent),
                Number(selectedChild)
            );
            const parentName = parents.find((p) => p.id === Number(selectedParent))?.name;
            const childName = students.find((s) => s.id === Number(selectedChild))?.name;
            notify.success(`"${parentName}" asociat cu "${childName}"`);
            onLinked?.();
            onClose();
        } catch (err) {
            notify.error(err?.response?.data?.message || 'Nu am putut crea asocierea');
        } finally {
            setSaving(false);
        }
    };

    const parentOptions = parents.map((p) => ({ value: String(p.id), label: p.name }));
    const studentOptions = students.map((s) => ({ value: String(s.id), label: s.name }));

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Asociază părinte-copil"
            description="Creează o legatură între un părinte și copilul/copiii său/săi."
            size="sm"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={saving}>
                        Anulează
                    </Button>
                    <Button
                        variant="primary"
                        icon={UserPlus}
                        onClick={handleSubmit}
                        loading={saving}
                    >
                        Asociază
                    </Button>
                </>
            }
        >
            {loading ? (
                <div className="space-y-3">
                    <Skeleton variant="card" height={56} />
                    <Skeleton variant="card" height={56} />
                </div>
            ) : (
                <div className="space-y-4">
                    <Select
                        label="Părinte"
                        placeholder="Selectează părintele"
                        value={selectedParent}
                        onChange={(e) => setSelectedParent(e.target.value)}
                        options={parentOptions}
                        error={errors.parent}
                    />
                    <Select
                        label="Elev"
                        placeholder="Selectează elevul"
                        value={selectedChild}
                        onChange={(e) => setSelectedChild(e.target.value)}
                        options={studentOptions}
                        error={errors.child}
                    />
                </div>
            )}
        </Modal>
    );
};

export default ParentChildAdminPage;