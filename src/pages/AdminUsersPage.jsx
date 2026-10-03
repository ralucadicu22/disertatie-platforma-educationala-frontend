import { useEffect, useState } from 'react';
import { adminUsersApi } from '../api/adminUsersApi';
import { cn } from '../design-system/cn';
import BulkImportModal from "../components/BulkImportModal.jsx";

const ROLES = ['ELEV', 'PROFESOR', 'EDITOR', 'ADMIN', 'PARINTE'];
const ROLE_COLORS = {
    ELEV:     'bg-success-100 text-success-700',
    PROFESOR: 'bg-primary-100 text-primary-700',
    EDITOR:   'bg-accent-100 text-accent-700',
    ADMIN:    'bg-danger-100 text-danger-700',
    PARINTE:  'bg-warning-100 text-warning-700',
};

export default function AdminUsersPage() {

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterRole, setFilterRole] = useState('');
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [actioningId, setActioningId] = useState(null);
    const [resetModal, setResetModal] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [roleModal, setRoleModal] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [createModal, setCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'ELEV' });
    const [creating, setCreating] = useState(false);


    const [activeTab, setActiveTab] = useState('users');
    const [bulkImportOpen, setBulkImportOpen] = useState(false);
    const [importHistory, setImportHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);


    const load = () => {
        setLoading(true);
        adminUsersApi.getAll(filterRole || undefined)
            .then(setUsers)
            .catch(() => setError('Eroare la încărcarea utilizatorilor'))
            .finally(() => setLoading(false));
    };

    const loadHistory = () => {
        setHistoryLoading(true);
        bulkImportApi.getHistory()
            .then(setImportHistory)
            .catch(() => setError('Eroare la încărcarea istoricului'))
            .finally(() => setHistoryLoading(false));
    };

    useEffect(() => { load(); }, [filterRole]);
    useEffect(() => { if (activeTab === 'history') loadHistory(); }, [activeTab]);

    const filtered = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    const handleToggleActive = async (user) => {
        setActioningId(user.id);
        try {
            const updated = await adminUsersApi.toggleActive(user.id);
            setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
        } catch { setError('Eroare la modificarea statusului'); }
        finally { setActioningId(null); }
    };

    const handleUpdateRole = async () => {
        if (!roleModal || !selectedRole) return;
        setActioningId(roleModal.id);
        try {
            const updated = await adminUsersApi.updateRole(roleModal.id, selectedRole);
            setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
            setRoleModal(null);
        } catch { setError('Eroare la schimbarea rolului'); }
        finally { setActioningId(null); }
    };

    const handleResetPassword = async () => {
        if (!resetModal || !newPassword.trim()) return;
        setActioningId(resetModal.id);
        try {
            await adminUsersApi.resetPassword(resetModal.id, newPassword.trim());
            setResetModal(null);
            setNewPassword('');
        } catch { setError('Eroare la resetarea parolei'); }
        finally { setActioningId(null); }
    };

    const handleCreate = async () => {
        if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) return;
        setCreating(true);
        try {
            const created = await adminUsersApi.createUser(createForm);
            setUsers(prev => [created, ...prev]);
            setCreateModal(false);
            setCreateForm({ name: '', email: '', password: '', role: 'ELEV' });
        } catch { setError('Eroare la crearea utilizatorului'); }
        finally { setCreating(false); }
    };

    const handleDelete = async (user) => {
        if (!window.confirm(`Ștergi definitiv contul lui ${user.name}?`)) return;
        setActioningId(user.id);
        try {
            await adminUsersApi.deleteUser(user.id);
            setUsers(prev => prev.filter(u => u.id !== user.id));
        } catch { setError('Eroare la ștergerea utilizatorului'); }
        finally { setActioningId(null); }
    };

    const formatDate = (d) => {
        if (!d) return '—';
        const date = Array.isArray(d)
            ? new Date(d[0], d[1] - 1, d[2], d[3] || 0, d[4] || 0)
            : new Date(d);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('ro-RO', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <h1 className="text-h2 font-bold text-neutral-900 mb-1">Gestionare utilizatori</h1>
                <p className="text-body text-neutral-500">{users.length} utilizatori înregistrați</p>
            </div>

            {error && (
                <div className="flex items-center gap-2 bg-danger-50 border border-danger-200 text-danger-700
                                rounded-md px-4 py-3 text-body font-semibold mb-4">
                    ⚠️ {error}
                    <button onClick={() => setError('')} className="ml-auto">✕</button>
                </div>
            )}

            <div className="flex gap-1 mb-6 border-b border-neutral-200">
                {[
                    { key: 'users',   label: '👥 Utilizatori' },
                    { key: 'history', label: '📋 Istoric import' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            'px-4 py-2.5 text-body font-semibold border-b-2 transition-colors -mb-px',
                            activeTab === tab.key
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>


            {activeTab === 'users' && (
                <>

                    <div className="flex gap-3 mb-6 flex-wrap">
                        <input
                            type="text"
                            placeholder="Caută după nume sau email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="flex-1 min-w-48 px-4 py-2.5 rounded-lg border-2 border-neutral-200 text-body focus:outline-none focus:border-primary-400 transition-colors"
                        />
                        <select
                            value={filterRole}
                            onChange={e => setFilterRole(e.target.value)}
                            className="px-4 py-2.5 rounded-lg border-2 border-neutral-200 text-body focus:outline-none focus:border-primary-400 transition-colors bg-white"
                        >
                            <option value="">Toate rolurile</option>
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <button
                            onClick={() => setCreateModal(true)}
                            className="px-4 py-2.5 bg-success-600 text-white rounded-lg text-body font-bold hover:bg-success-700 transition-colors"
                        >
                            + Utilizator nou
                        </button>

                        <button
                            onClick={() => setBulkImportOpen(true)}
                            className="px-4 py-2.5 bg-accent-600 text-white rounded-lg text-body font-bold hover:bg-accent-700 transition-colors"
                        >
                            ⬆ Import CSV / Excel
                        </button>
                        <button
                            onClick={load}
                            className="px-4 py-2.5 bg-primary-600 text-white rounded-lg text-body font-bold hover:bg-primary-700 transition-colors"
                        >
                            🔄 Reîncarcă
                        </button>
                    </div>


                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="bg-white rounded-xl border-2 border-dashed border-neutral-200 p-12 text-center">
                            <div className="text-4xl mb-3">👥</div>
                            <p className="text-body text-neutral-500">Niciun utilizator găsit.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                                {['Utilizator', 'Rol', 'Status', 'Creat', 'Ultima activitate', 'Acțiuni'].map((h, i) => (
                                    <div key={h} className={cn(
                                        'text-micro text-neutral-400 font-bold uppercase tracking-wide',
                                        i === 0 ? 'col-span-3' : i === 1 ? 'col-span-2' : i === 2 ? 'col-span-1'
                                            : i === 3 ? 'col-span-2' : i === 4 ? 'col-span-2' : 'col-span-2 text-right'
                                    )}>
                                        {h}
                                    </div>
                                ))}
                            </div>

                            {filtered.map(user => (
                                <div
                                    key={user.id}
                                    className={cn(
                                        'grid grid-cols-12 gap-2 items-center px-4 py-3.5 border-b border-neutral-100 last:border-0 transition-colors',
                                        !user.active && 'opacity-50 bg-neutral-50',
                                        user.active && 'hover:bg-neutral-50'
                                    )}
                                >
                                    <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-caption font-bold flex-shrink-0">
                                            {user.name?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-body font-semibold text-neutral-900 truncate">{user.name}</p>
                                            <p className="text-caption text-neutral-400 truncate">{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <span className={cn('px-2.5 py-1 rounded-full text-micro font-bold',
                                            ROLE_COLORS[user.role] || 'bg-neutral-100 text-neutral-600')}>
                                            {user.role}
                                        </span>
                                    </div>

                                    <div className="col-span-1">
                                        <span className={cn('px-2 py-1 rounded-full text-micro font-bold',
                                            user.active ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700')}>
                                            {user.active ? 'Activ' : 'Inactiv'}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-caption text-neutral-500">{formatDate(user.createdAt)}</div>
                                    <div className="col-span-2 text-caption text-neutral-500">{formatDate(user.lastActivity)}</div>

                                    <div className="col-span-2 flex items-center justify-end gap-1">
                                        <button onClick={() => handleToggleActive(user)} disabled={actioningId === user.id}
                                                title={user.active ? 'Dezactivează' : 'Activează'}
                                                className={cn('p-1.5 rounded-md text-caption transition-colors',
                                                    user.active ? 'text-warning-600 hover:bg-warning-50' : 'text-success-600 hover:bg-success-50')}>
                                            {user.active ? '🔒' : '🔓'}
                                        </button>
                                        <button onClick={() => { setRoleModal(user); setSelectedRole(user.role); }}
                                                disabled={actioningId === user.id} title="Schimbă rolul"
                                                className="p-1.5 rounded-md text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                                            ✏️
                                        </button>
                                        <button onClick={() => { setResetModal(user); setNewPassword(''); }}
                                                disabled={actioningId === user.id} title="Resetează parola"
                                                className="p-1.5 rounded-md text-neutral-400 hover:text-warning-600 hover:bg-warning-50 transition-colors">
                                            🔑
                                        </button>
                                        <button onClick={() => handleDelete(user)} disabled={actioningId === user.id}
                                                title="Șterge contul"
                                                className="p-1.5 rounded-md text-neutral-400 hover:text-danger-600 hover:bg-danger-50 transition-colors">
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'history' && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-body text-neutral-500">Ultimele 20 importuri</p>
                        <button onClick={loadHistory}
                                className="px-3 py-2 bg-primary-600 text-white rounded-lg text-caption font-bold hover:bg-primary-700 transition-colors">
                            🔄 Reîncarcă
                        </button>
                    </div>

                    {historyLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : importHistory.length === 0 ? (
                        <div className="bg-white rounded-xl border-2 border-dashed border-neutral-200 p-12 text-center">
                            <div className="text-4xl mb-3">📋</div>
                            <p className="text-body text-neutral-500">Niciun import efectuat încă.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                                {['Data', 'Admin', 'Fișier', 'Total', 'Create', 'Erori', 'Duplicate'].map((h, i) => (
                                    <div key={h} className={cn(
                                        'text-micro text-neutral-400 font-bold uppercase tracking-wide',
                                        i === 0 ? 'col-span-2' : i === 1 ? 'col-span-2' : i === 2 ? 'col-span-3'
                                            : 'col-span-1 text-center'
                                    )}>{h}</div>
                                ))}
                            </div>
                            {importHistory.map(h => (
                                <div key={h.id}
                                     className="grid grid-cols-12 gap-2 items-center px-4 py-3.5 border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                                    <div className="col-span-2 text-caption text-neutral-500">{formatDate(h.importedAt)}</div>
                                    <div className="col-span-2">
                                        <p className="text-body font-semibold text-neutral-900 truncate">{h.adminName}</p>
                                        <p className="text-caption text-neutral-400 truncate">{h.adminEmail}</p>
                                    </div>
                                    <div className="col-span-3 text-caption text-neutral-600 truncate" title={h.fileName}>
                                        📄 {h.fileName || '—'}
                                    </div>
                                    <div className="col-span-1 text-center text-body font-bold text-neutral-700">{h.totalRows}</div>
                                    <div className="col-span-1 text-center">
                                        <span className="px-2 py-0.5 rounded-full text-caption font-bold bg-success-100 text-success-700">
                                            {h.successCount}
                                        </span>
                                    </div>
                                    <div className="col-span-1 text-center">
                                        <span className={cn(
                                            'px-2 py-0.5 rounded-full text-caption font-bold',
                                            h.errorCount > 0 ? 'bg-danger-100 text-danger-700' : 'bg-neutral-100 text-neutral-400'
                                        )}>
                                            {h.errorCount}
                                        </span>
                                    </div>
                                    <div className="col-span-1 text-center">
                                        <span className={cn(
                                            'px-2 py-0.5 rounded-full text-caption font-bold',
                                            h.skippedCount > 0 ? 'bg-warning-100 text-warning-700' : 'bg-neutral-100 text-neutral-400'
                                        )}>
                                            {h.skippedCount}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {roleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <h2 className="text-h3 font-bold text-neutral-900 mb-4">
                            Schimbă rolul pentru {roleModal.name}
                        </h2>
                        <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border-2 border-neutral-200 text-body mb-4 focus:outline-none focus:border-primary-400">
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <div className="flex gap-3">
                            <button onClick={() => setRoleModal(null)}
                                    className="flex-1 py-2.5 border border-neutral-200 rounded-lg text-body font-semibold text-neutral-600 hover:bg-neutral-50">
                                Anulează
                            </button>
                            <button onClick={handleUpdateRole} disabled={actioningId === roleModal.id}
                                    className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-body font-bold hover:bg-primary-700 disabled:opacity-60">
                                Salvează
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {resetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <h2 className="text-h3 font-bold text-neutral-900 mb-1">Resetează parola</h2>
                        <p className="text-caption text-neutral-500 mb-4">{resetModal.name} · {resetModal.email}</p>
                        <input type="password" value={newPassword}
                               onChange={e => setNewPassword(e.target.value)}
                               placeholder="Parolă nouă..."
                               className="w-full px-4 py-2.5 rounded-lg border-2 border-neutral-200 text-body mb-4 focus:outline-none focus:border-primary-400"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setResetModal(null)}
                                    className="flex-1 py-2.5 border border-neutral-200 rounded-lg text-body font-semibold text-neutral-600 hover:bg-neutral-50">
                                Anulează
                            </button>
                            <button onClick={handleResetPassword}
                                    disabled={!newPassword.trim() || actioningId === resetModal.id}
                                    className="flex-1 py-2.5 bg-warning-600 text-white rounded-lg text-body font-bold hover:bg-warning-700 disabled:opacity-60">
                                Resetează
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {createModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <h2 className="text-h3 font-bold text-neutral-900 mb-4">Utilizator nou</h2>
                        <div className="flex flex-col gap-3 mb-5">
                            <input type="text" value={createForm.name}
                                   onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                                   placeholder="Nume complet *"
                                   className="w-full px-4 py-2.5 rounded-lg border-2 border-neutral-200 text-body focus:outline-none focus:border-primary-400"
                            />
                            <input type="email" value={createForm.email}
                                   onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                                   placeholder="Email *"
                                   className="w-full px-4 py-2.5 rounded-lg border-2 border-neutral-200 text-body focus:outline-none focus:border-primary-400"
                            />
                            <input type="password" value={createForm.password}
                                   onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))}
                                   placeholder="Parolă *"
                                   className="w-full px-4 py-2.5 rounded-lg border-2 border-neutral-200 text-body focus:outline-none focus:border-primary-400"
                            />
                            <select value={createForm.role}
                                    onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border-2 border-neutral-200 text-body focus:outline-none focus:border-primary-400 bg-white">
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setCreateModal(false); setCreateForm({ name: '', email: '', password: '', role: 'ELEV' }); }}
                                className="flex-1 py-2.5 border border-neutral-200 rounded-lg text-body font-semibold text-neutral-600 hover:bg-neutral-50">
                                Anulează
                            </button>
                            <button onClick={handleCreate}
                                    disabled={creating || !createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()}
                                    className="flex-1 py-2.5 bg-success-600 text-white rounded-lg text-body font-bold hover:bg-success-700 disabled:opacity-60">
                                {creating ? 'Se creează...' : 'Creează'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {bulkImportOpen && (
                <BulkImportModal
                    onClose={() => setBulkImportOpen(false)}
                    onImported={() => {
                        load();

                    }}
                />
            )}
        </div>
    );

}