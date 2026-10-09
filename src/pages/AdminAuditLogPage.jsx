import { useEffect, useState } from 'react';
import { Shield, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, EmptyState, Skeleton, Badge } from '../design-system/components';
import api from '../api/axios';

const ACTION_STYLES = {
    START: { label: 'Start', cls: 'bg-warning-100 text-warning-700' },
    END:   { label: 'Sfârșit', cls: 'bg-success-100 text-success-700' },
};

const ROLE_LABELS = {
    ELEV: '🎓 Elev',
    PROFESOR: '📚 Profesor',
    PARINTE: '👨‍👩‍👧 Părinte',
    EDITOR: '✏️ Editor',
};

const formatDateTime = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('ro-RO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
};

export default function AdminAuditLogPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLogs = () => {
        setLoading(true);
        setError(null);
        api.get('/admin/impersonation/logs')
            .then(res => setLogs(res.data))
            .catch(() => setError('Nu am putut încărca logurile'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchLogs(); }, []);

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-h2 font-bold text-neutral-900 mb-1 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-warning-500" />
                        Audit Log — Impersonare
                    </h1>
                    <p className="text-body text-neutral-500">
                        Toate acțiunile de tip „View As" efectuate de administratori.
                    </p>
                </div>
                <button
                    onClick={fetchLogs}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200
                               text-caption font-bold text-neutral-600 hover:bg-neutral-50
                               transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Reîncarcă
                </button>
            </div>

            {loading && (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} variant="card" height={72} />
                    ))}
                </div>
            )}

            {error && !loading && (
                <Card>
                    <EmptyState
                        icon={AlertCircle}
                        variant="warm"
                        title="Eroare la încărcare"
                        description={error}
                    />
                </Card>
            )}

            {!loading && !error && logs.length === 0 && (
                <Card>
                    <EmptyState
                        icon={Shield}
                        variant="primary"
                        title="Nicio acțiune înregistrată"
                        description="Logurile de impersonare vor apărea aici după primul View As."
                    />
                </Card>
            )}

            {!loading && !error && logs.length > 0 && (
                <Card padding="none">
                    <div className="divide-y divide-neutral-100">
                        {logs.map((log) => {
                            const action = ACTION_STYLES[log.action] ?? { label: log.action, cls: 'bg-neutral-100 text-neutral-600' };
                            return (
                                <div key={log.id} className="px-5 py-4 flex items-start gap-4 hover:bg-neutral-50 transition-colors">
                                    <span className={`mt-0.5 flex-shrink-0 px-2.5 py-1 rounded-full text-caption font-bold ${action.cls}`}>
                                        {action.label}
                                    </span>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-body font-semibold text-neutral-900">
                                            {log.adminName}
                                            <span className="font-normal text-neutral-500 ml-1 text-caption">
                                                ({log.adminEmail})
                                            </span>
                                        </p>
                                        {log.impersonatedUserName && (
                                            <p className="text-caption text-neutral-600 mt-0.5">
                                                → {log.impersonatedUserName}
                                                <span className="text-neutral-400 ml-1">({log.impersonatedUserEmail})</span>
                                                {log.impersonatedRole && (
                                                    <span className="ml-2 font-semibold">
                                                        {ROLE_LABELS[log.impersonatedRole] ?? log.impersonatedRole}
                                                    </span>
                                                )}
                                            </p>
                                        )}
                                    </div>

                                    <time className="flex-shrink-0 text-caption text-neutral-400 whitespace-nowrap">
                                        {formatDateTime(log.timestamp)}
                                    </time>
                                </div>
                            );
                        })}
                    </div>
                    <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50 rounded-b-xl">
                        <p className="text-caption text-neutral-400">
                            Se afișează ultimele {logs.length} înregistrări
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
}