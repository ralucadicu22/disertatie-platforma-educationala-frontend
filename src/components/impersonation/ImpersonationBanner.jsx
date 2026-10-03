import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {impersonation} from "../../utils/impersonation.js";
import {impersonationApi} from "../../api/impersonationApi.js";


export default function ImpersonationBanner() {
    const navigate = useNavigate();
    const [leaving, setLeaving] = useState(false);

    if (!impersonation.isActive()) return null;

    const target   = impersonation.currentUser();
    const original = impersonation.originalUser();
    const role     = target?.role;

    const handleEnd = async () => {
        setLeaving(true);
        try {
            await impersonationApi.end(target?.id);
        } catch {
        }
        impersonation.end();
        navigate('/');
        window.location.reload();
    };

    return (
        <div className="fixed top-0 inset-x-0 z-[100] flex items-center justify-between px-4 py-2.5
                        bg-warning-500 text-white shadow-lg text-body font-semibold">
            <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg flex-shrink-0">👁</span>
                <span className="truncate">
                    Vizualizezi ca:{' '}
                    <strong>{target?.name}</strong>
                    {role && (
                        <span className="font-normal opacity-90 ml-1">
                            ({impersonation.roleLabel(role)})
                        </span>
                    )}
                    {original?.name && (
                        <span className="font-normal opacity-80 ml-2">
                            · conectat ca {original.name}
                        </span>
                    )}
                </span>
            </div>
            <button
                onClick={handleEnd}
                disabled={leaving}
                className="flex-shrink-0 ml-3 flex items-center gap-1.5 px-3 py-1.5 bg-white text-warning-700
                           rounded-lg text-caption font-bold hover:bg-warning-50 transition-colors
                           disabled:opacity-60"
            >
                {leaving ? 'Se revine...' : '← Revenire la Admin'}
            </button>
        </div>
    );
}
