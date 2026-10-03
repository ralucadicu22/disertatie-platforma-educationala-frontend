import {useEffect, useRef, useState} from 'react';


import {impersonation} from "../../utils/impersonation.js";
import {impersonationApi} from "../../api/impersonationApi.js";

const ROLES = [
    { key: 'ELEV',    label: '🎓 Elev' },
    { key: 'PROFESOR', label: '📚 Profesor' },
    { key: 'PARINTE', label: '👨‍👩‍👧 Părinte' },
    { key: 'EDITOR',  label: '✏️ Editor' },
];

export default function ViewAsDropdown({  iconOnly }) {
    const [open, setOpen]               = useState(false);
    const [stage, setStage]             = useState(1);
    const [selectedRole, setSelectedRole] = useState(null);
    const [users, setUsers]             = useState([]);
    const [search, setSearch]           = useState('');
    const [loading, setLoading]         = useState(false);

    const [rolesPanelPos, setRolesPanelPos] = useState({ top: 0, left: 0 });
    const [usersPanelPos, setUsersPanelPos] = useState({ top: 0, left: 0 });

    const btnRef        = useRef(null);
    const rolesPanelRef = useRef(null);

    const handleOpen = () => {
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setRolesPanelPos({
                top:  rect.top,
                left: rect.left,
            });
        }
        setOpen(true);
        setStage(1);
        setSearch('');
        setUsers([]);
        setSelectedRole(null);
    };
    useEffect(() => {
        if (stage === 2 && rolesPanelRef.current) {
            const rect = rolesPanelRef.current.getBoundingClientRect();
            setUsersPanelPos({
                top:  rect.top,
                left: rect.right + 8,
            });
        }
    }, [stage]);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (!e.target.closest('[data-vad]')) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleRoleSelect = async (role) => {
        setSelectedRole(role);
        setLoading(true);
        setStage(2);
        try {
            const data = await impersonationApi.listUsersByRole(role);
            setUsers(data);
        } finally {
            setLoading(false);
        }
    };

    const handleUserSelect = async (user) => {
        await impersonationApi.start(user.id);
        impersonation.start(user);
        setOpen(false);
        window.location.reload();
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    const roleLabel = ROLES.find(r => r.key === selectedRole)?.label;

    return (
        <>

            <button
                ref={btnRef}
                onClick={open ? () => setOpen(false) : handleOpen}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
                {!iconOnly && <span>Vizualizează ca...</span>}
                <span className="text-xs">{open ? '▲' : '▼'}</span>
            </button>

            {open && (
                <>
                    <div
                        ref={rolesPanelRef}
                        data-vad
                        style={{
                            position:  'fixed',
                            top:       rolesPanelPos.top,
                            left:      rolesPanelPos.left,
                            transform: 'translateY(-100%) translateY(-8px)',  // deasupra butonului
                            zIndex:    9999,
                            width:     '180px',
                        }}
                        className="bg-white border border-gray-200 rounded-xl shadow-xl py-1"
                    >
                        <p className="text-xs text-gray-400 px-3 pt-1 pb-1 font-semibold uppercase tracking-wide">
                            Alege rolul
                        </p>
                        {ROLES.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => handleRoleSelect(key)}
                                className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-blue-50 hover:text-blue-700
                  ${selectedRole === key ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {stage === 2 && (
                        <div
                            data-vad
                            style={{
                                position:  'fixed',
                                top:       usersPanelPos.top,
                                left:      usersPanelPos.left,
                                zIndex:    9999,
                                width:     '260px',
                                maxHeight: '320px',
                                display:   'flex',
                                flexDirection: 'column',
                            }}
                            className="bg-white border border-gray-200 rounded-xl shadow-xl"
                        >
                            {/* Header */}
                            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 flex-shrink-0">
                                <button
                                    onClick={() => { setStage(1); setSearch(''); }}
                                    className="text-gray-400 hover:text-gray-600 text-xs"
                                >
                                    ←
                                </button>
                                <span className="text-xs font-semibold text-gray-600">{roleLabel}</span>
                            </div>

                            {/* Search */}
                            <div className="px-2 py-2 flex-shrink-0">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Caută după nume sau email..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5
                             focus:outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </div>

                            {/* Lista */}
                            <div className="overflow-y-auto flex-1">
                                {loading ? (
                                    <p className="text-center text-sm text-gray-400 py-4">Se încarcă...</p>
                                ) : filteredUsers.length === 0 ? (
                                    <p className="text-center text-sm text-gray-400 py-4">Niciun utilizator găsit</p>
                                ) : (
                                    filteredUsers.map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => handleUserSelect(user)}
                                            className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors
                                 border-b border-gray-50 last:border-0"
                                        >
                                            <div className="text-sm font-medium text-gray-800">{user.name}</div>
                                            <div className="text-xs text-gray-400">{user.email}</div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
}