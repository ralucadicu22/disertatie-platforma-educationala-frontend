import { useState, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, AlertCircle, Download } from 'lucide-react';
import api from '../api/axios.js';

const formatDateTime = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('ro-RO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
};

const ROLES = ['STUDENT', 'PROFESSOR', 'ADMIN'];

export default function AdminActivityLogPage() {
    const [logs, setLogs] = useState([]);
    const [availableActions, setAvailableActions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [filters, setFilters] = useState({
        action: '', role: '', fromDate: '', toDate: ''
    });

    const fetchLogs = useCallback(async (p = 0) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page: p, size: 50 });
            if (filters.action) params.append('action', filters.action);
            if (filters.role) params.append('role', filters.role);
            if (filters.fromDate) params.append('fromDate', new Date(filters.fromDate).toISOString());
            if (filters.toDate) params.append('toDate', new Date(filters.toDate).toISOString());

            const res = await api.get(`/admin/activity-logs?${params}`);
            setLogs(res.data.content);
            setTotalPages(res.data.totalPages);
            setTotalElements(res.data.totalElements);
            setPage(p);
        } catch (e) {
            setError('Nu s-au putut încărca logurile.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        api.get('/admin/activity-logs/actions')
            .then(r => setAvailableActions(r.data))
            .catch(() => {});
    }, []);

    useEffect(() => { fetchLogs(0); }, [fetchLogs]);

    const exportCSV = async () => {
        try {
            const params = new URLSearchParams({ page: 0, size: 10000 });
            if (filters.action) params.append('action', filters.action);
            if (filters.role) params.append('role', filters.role);
            if (filters.fromDate) params.append('fromDate', new Date(filters.fromDate).toISOString());
            if (filters.toDate) params.append('toDate', new Date(filters.toDate).toISOString());

            const res = await api.get(`/admin/activity-logs?${params}`);
            const allLogs = res.data.content;
            if (!allLogs.length) return;

            const headers = ['Timestamp', 'Utilizator', 'Email', 'Rol', 'Acțiune', 'Descriere', 'Metodă', 'Endpoint', 'Status', 'Durată (ms)'];
            const esc = (v) => {
                if (v == null) return '';
                const s = String(v);
                return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
            };
            const rows = allLogs.map(l => [
                formatDateTime(l.timestamp), l.userName ?? '', l.userEmail ?? '',
                l.userRole ?? '', l.action ?? '', l.description ?? '',
                l.httpMethod ?? '', l.endpoint ?? '', l.responseStatus ?? '', l.durationMs ?? ''
            ].map(esc).join(','));

            const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `activity-log-${new Date().toISOString().slice(0,10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            setError('Export eșuat.');
        }
    };

    const statusBadge = (status) => {
        if (!status) return null;
        const color = status < 300 ? 'bg-green-100 text-green-700'
            : status < 400 ? 'bg-blue-100 text-blue-700'
                : status < 500 ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700';
        return <span className={`px-1.5 py-0.5 rounded text-xs font-mono font-semibold ${color}`}>{status}</span>;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Activity className="w-6 h-6 text-primary-600" />
                    <div>
                        <h1 className="text-xl font-bold text-neutral-900">Activity Log</h1>
                        <p className="text-sm text-neutral-500">{totalElements} înregistrări</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => fetchLogs(0)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 text-sm hover:bg-neutral-50">
                        <RefreshCw className="w-4 h-4" /> Reîncarcă
                    </button>
                    <button onClick={exportCSV}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Filtre */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <select value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
                        className="border border-neutral-200 rounded-lg px-3 py-2 text-sm">
                    <option value="">Toate acțiunile</option>
                    {availableActions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={filters.role} onChange={e => setFilters(f => ({ ...f, role: e.target.value }))}
                        className="border border-neutral-200 rounded-lg px-3 py-2 text-sm">
                    <option value="">Toate rolurile</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <input type="datetime-local" value={filters.fromDate}
                       onChange={e => setFilters(f => ({ ...f, fromDate: e.target.value }))}
                       className="border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                       placeholder="De la" />
                <input type="datetime-local" value={filters.toDate}
                       onChange={e => setFilters(f => ({ ...f, toDate: e.target.value }))}
                       className="border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                       placeholder="Până la" />
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg mb-4 text-sm">
                    <AlertCircle className="w-4 h-4" /> {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-neutral-500">Se încarcă...</div>
            ) : (
                <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                            <tr>
                                {['Timestamp', 'Utilizator', 'Acțiune', 'Endpoint', 'Status', 'Durată'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-neutral-600 uppercase tracking-wide">{h}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                            {logs.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-12 text-neutral-400">Nicio înregistrare</td></tr>
                            ) : logs.map(log => (
                                <tr key={log.id} className="hover:bg-neutral-50">
                                    <td className="px-4 py-3 font-mono text-xs text-neutral-500 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-neutral-900">{log.userName ?? '—'}</div>
                                        <div className="text-xs text-neutral-500">{log.userEmail}</div>
                                        {log.userRole && (
                                            <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded text-xs">{log.userRole}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-neutral-800">{log.action}</div>
                                        <div className="text-xs text-neutral-500">{log.description}</div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                                        <span className="text-neutral-400">{log.httpMethod}</span> {log.endpoint}
                                    </td>
                                    <td className="px-4 py-3">{statusBadge(log.responseStatus)}</td>
                                    <td className="px-4 py-3 text-xs text-neutral-500">{log.durationMs != null ? `${log.durationMs}ms` : '—'}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
                            <span className="text-sm text-neutral-500">Pagina {page + 1} din {totalPages}</span>
                            <div className="flex gap-2">
                                <button onClick={() => fetchLogs(page - 1)} disabled={page === 0}
                                        className="px-3 py-1.5 rounded border text-sm disabled:opacity-40 hover:bg-neutral-50">
                                    ← Anterior
                                </button>
                                <button onClick={() => fetchLogs(page + 1)} disabled={page >= totalPages - 1}
                                        className="px-3 py-1.5 rounded border text-sm disabled:opacity-40 hover:bg-neutral-50">
                                    Următor →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}