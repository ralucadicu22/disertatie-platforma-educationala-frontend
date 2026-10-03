import { useState } from 'react';
import { useNavigate } from 'react-router-dom';


import {impersonation} from "../../utils/impersonation.js";
import {impersonationApi} from "../../api/impersonationApi.js";
import {cn} from "../../design-system/cn.js";

const ROLES = [
    { value: 'ELEV',     label: 'Elev',     icon: '🎒' },
    { value: 'PROFESOR', label: 'Profesor',  icon: '👨‍🏫' },
    { value: 'PARINTE',  label: 'Părinte',   icon: '👪' },
    { value: 'EDITOR',   label: 'Editor',    icon: '✏️' },
];


export default function ViewAsDropdown({ compact = false, iconOnly = false }) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');


    if (impersonation.isActive()) return null;

    const handleSelectRole = async (role) => {
        setLoading(true);
        setError('');
        try {
            await impersonationApi.logStart(role);
            impersonation.start(role);
            setOpen(false);
            navigate('/');
            window.location.reload();
        } catch (err) {
            setError(err.response?.data?.message || 'Eroare la pornirea impersonării');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                disabled={loading}
                title={iconOnly ? 'Vizualizează ca...' : undefined}
                className={cn(
                    'flex items-center gap-2 rounded-lg font-semibold transition-colors',
                    'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100',
                    open && 'bg-neutral-100 text-neutral-900',
                    iconOnly
                        ? 'p-2 justify-center'
                        : compact
                            ? 'px-3 py-2 text-caption w-full'
                            : 'px-3 py-2 text-body w-full'
                )}
            >
                <span>👁</span>
                {!iconOnly && <span className="truncate">Vizualizează ca...</span>}
                {!iconOnly && (
                    <span className={cn('text-xs transition-transform ml-auto', open && 'rotate-180')}>▼</span>
                )}
            </button>

            {open && (

                <div className="absolute left-0 bottom-full mb-1 w-44 bg-white rounded-xl border border-neutral-200 shadow-lg z-[200] py-1">
                    {error && (
                        <p className="px-3 py-1.5 text-caption text-danger-600 font-semibold">{error}</p>
                    )}
                    {ROLES.map(r => (
                        <button
                            key={r.value}
                            onClick={() => handleSelectRole(r.value)}
                            disabled={loading}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left
                                       text-body text-neutral-700 hover:bg-neutral-50 transition-colors
                                       font-semibold disabled:opacity-60"
                        >
                            <span>{r.icon}</span>
                            <span>{r.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
