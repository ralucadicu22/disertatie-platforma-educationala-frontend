import { useState, useEffect, useMemo } from 'react';
import { UserPlus, Search } from 'lucide-react';
import { Modal, Button, Input, Avatar, EmptyState, Skeleton } from '../../design-system/components';
import { userApi } from '../../api/userApi';
import { notify } from '../../design-system/toast';

const AddMemberModal = ({ open, onClose, role, excludeIds = [], onAdd }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [addingId, setAddingId] = useState(null);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        userApi.getByRole(role)
            .then((data) => { setUsers(data || []); setLoading(false); })
            .catch(() => { notify.error('Nu am putut incarca utilizatorii'); setLoading(false); });
    }, [open, role]);

    const filtered = useMemo(() => {
        const excluded = new Set(excludeIds);
        return users
            .filter((u) => !excluded.has(u.id))
            .filter((u) => {
                if (!search.trim()) return true;
                const q = search.trim().toLowerCase();
                return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
            });
    }, [users, excludeIds, search]);

    const handleAdd = async (userId) => {
        setAddingId(userId);
        try { await onAdd(userId); } finally { setAddingId(null); }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={role === 'PROFESOR' ? 'Adauga profesor' : 'Adauga elev'}
            size="md"
        >
            <div className="space-y-4">
                <Input
                    placeholder="Cauta dupa nume sau email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    icon={Search}
                    autoFocus
                />
                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => <Skeleton key={i} variant="card" height={64} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={UserPlus}
                        variant="neutral"
                        title={role === 'PROFESOR' ? 'Nu am gasit profesori' : 'Nu am gasit elevi'}
                        description={search ? 'Incearca alt termen.' : 'Toti sunt deja in clasa.'}
                        size="sm"
                    />
                ) : (
                    <div className="max-h-80 overflow-y-auto space-y-1">
                        {filtered.map((user) => (
                            <div key={user.id} className="flex items-center gap-3 p-3 rounded-md hover:bg-neutral-50 transition-colors">
                                <Avatar name={user.name} size="md" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-body font-semibold text-neutral-900 truncate">{user.name}</div>
                                    <div className="text-caption text-neutral-500 truncate">{user.email}</div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleAdd(user.id)}
                                    loading={addingId === user.id}
                                    disabled={addingId != null && addingId !== user.id}
                                >
                                    Adauga
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AddMemberModal;