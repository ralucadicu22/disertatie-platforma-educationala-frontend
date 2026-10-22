import { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import api from "../api/axios.js";

export default function AttemptsAnalyticsDashboard() {
    const [data, setData]       = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);
    const [sortBy, setSortBy]   = useState('avgAttemptsPerStudent');

    useEffect(() => {
        setLoading(true);
        setError(null);
        api.get('/analytics/attempts/global')
            .then(res => setData(res.data))
            .catch(() => setError('Nu s-au putut încărca datele analytics.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingState />;
    if (error)   return <ErrorState message={error} />;
    if (!data.length) return <EmptyState />;

    const sorted = [...data].sort((a, b) => b[sortBy] - a[sortBy]);

    const avgOfAvg  = (data.reduce((s, d) => s + d.avgAttemptsPerStudent, 0) / data.length).toFixed(1);
    const hardest   = sorted[0];
    const easiest   = [...sorted].reverse()[0];
    const totalSub  = data.reduce((s, d) => s + d.totalStudents, 0);

    return (
        <div style={styles.container}>

            <div style={styles.kpiRow}>
                <KpiCard label="Exerciții analizate"      value={data.length} />
                <KpiCard label="Total submisii"            value={totalSub} />
                <KpiCard label="Media înc. / exercițiu"   value={avgOfAvg} unit="înc." />
                <KpiCard
                    label="Cel mai dificil"
                    value={hardest.exerciseTitle}
                    sub={`${hardest.avgAttemptsPerStudent} înc. medie`}
                    accent="#ef4444"
                />
                <KpiCard
                    label="Cel mai ușor"
                    value={easiest.exerciseTitle}
                    sub={`${easiest.avgAttemptsPerStudent} înc. medie`}
                    accent="#10b981"
                />
            </div>

            <div style={styles.controls}>
                <span style={styles.controlsLabel}>Sortare:</span>
                <SortBtn
                    active={sortBy === 'avgAttemptsPerStudent'}
                    onClick={() => setSortBy('avgAttemptsPerStudent')}
                >
                    Media încercărilor
                </SortBtn>
                <SortBtn
                    active={sortBy === 'totalStudents'}
                    onClick={() => setSortBy('totalStudents')}
                >
                    Total submisii
                </SortBtn>
            </div>

            <div style={styles.chartWrap}>
                <p style={styles.chartTitle}>
                    {sortBy === 'avgAttemptsPerStudent'
                        ? 'Media încercărilor per exercițiu (↑ = mai dificil)'
                        : 'Total submisii per exercițiu'}
                </p>
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                        data={sorted}
                        margin={{ top: 20, right: 20, left: 0, bottom: 60 }}
                        barSize={32}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="exerciseTitle"
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            angle={-35}
                            textAnchor="end"
                            interval={0}
                        />
                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey={sortBy} radius={[6, 6, 0, 0]}>
                            {sorted.map((entry, i) => (
                                <Cell
                                    key={i}
                                    fill={difficultyColor(entry.avgAttemptsPerStudent, sorted)}
                                />
                            ))}
                            <LabelList
                                dataKey={sortBy}
                                position="top"
                                style={{ fontSize: 11, fontWeight: 700, fill: '#374151' }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div style={styles.tableWrap}>
                <p style={styles.chartTitle}>Detalii per exercițiu</p>
                <table style={styles.table}>
                    <thead>
                    <tr>
                        <Th>Exercițiu</Th>
                        <Th align="right">Total submisii</Th>
                        <Th align="right">Media încercărilor</Th>
                        <Th align="right">Max. încercări</Th>
                        <Th align="center">Dificultate</Th>
                    </tr>
                    </thead>
                    <tbody>
                    {sorted.map((row, i) => (
                        <tr key={row.exerciseId} style={i % 2 === 0 ? styles.trEven : {}}>
                            <Td>
                                    <span style={{ fontWeight: 700, color: '#1a1d23' }}>
                                        {row.exerciseTitle}
                                    </span>
                            </Td>
                            <Td align="right">{row.totalStudents}</Td>
                            <Td align="right">
                                    <span style={{
                                        fontWeight: 800,
                                        color: row.avgAttemptsPerStudent >= 3 ? '#ef4444'
                                            : row.avgAttemptsPerStudent >= 2 ? '#f59e0b'
                                                : '#059669',
                                    }}>
                                        {row.avgAttemptsPerStudent}
                                    </span>
                            </Td>
                            <Td align="right">
                                {row.maxAttempts === 0 || row.maxAttempts == null
                                    ? <span style={{ color: '#9ca3af' }}>Nelimitat</span>
                                    : row.maxAttempts}
                            </Td>
                            <Td align="center">
                                <DifficultyBadge avg={row.avgAttemptsPerStudent} />
                            </Td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function KpiCard({ label, value, unit, sub, accent }) {
    return (
        <div style={styles.kpiCard}>
            <p style={styles.kpiLabel}>{label}</p>
            <p style={{ ...styles.kpiValue, color: accent || '#1a1d23' }}>
                {value}{unit ? <span style={styles.kpiUnit}> {unit}</span> : null}
            </p>
            {sub && <p style={styles.kpiSub}>{sub}</p>}
        </div>
    );
}

function SortBtn({ active, onClick, children }) {
    return (
        <button
            style={{ ...styles.sortBtn, ...(active ? styles.sortBtnActive : {}) }}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

function DifficultyBadge({ avg }) {
    const level = avg >= 3 ? 'Dificil' : avg >= 2 ? 'Mediu' : 'Ușor';
    const colors = {
        'Dificil': { bg: '#fee2e2', color: '#b91c1c' },
        'Mediu':   { bg: '#fef9c3', color: '#92400e' },
        'Ușor':    { bg: '#dcfce7', color: '#15803d' },
    };
    return <span style={{ ...styles.badge, ...colors[level] }}>{level}</span>;
}

function CustomTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div style={styles.tooltip}>
            <p style={styles.tooltipTitle}>{d.exerciseTitle}</p>
            <p style={styles.tooltipRow}>Total submisii: <strong>{d.totalStudents}</strong></p>
            <p style={styles.tooltipRow}>Media înc.: <strong>{d.avgAttemptsPerStudent}</strong></p>
            <p style={styles.tooltipRow}>
                Max înc.: <strong>
                {d.maxAttempts === 0 || d.maxAttempts == null ? 'Nelimitat' : d.maxAttempts}
            </strong>
            </p>
        </div>
    );
}

function LoadingState() {
    return (
        <div style={styles.centerBox}>
            <div style={styles.spinner} />
            <p style={styles.centerText}>Se încarcă analytics...</p>
        </div>
    );
}

function ErrorState({ message }) {
    return (
        <div style={{ ...styles.centerBox, color: '#b91c1c' }}>
            <p>⚠ {message}</p>
        </div>
    );
}

function EmptyState() {
    return (
        <div style={styles.centerBox}>
            <p style={styles.centerText}>Nu există date de afișat încă.</p>
        </div>
    );
}

function Th({ children, align = 'left' }) {
    return <th style={{ ...styles.th, textAlign: align }}>{children}</th>;
}

function Td({ children, align = 'left', style: extra }) {
    return <td style={{ ...styles.td, textAlign: align, ...extra }}>{children}</td>;
}

function difficultyColor(avg, all) {
    const max = Math.max(...all.map(d => d.avgAttemptsPerStudent));
    const ratio = max > 0 ? avg / max : 0;
    if (ratio > 0.66) return '#ef4444';
    if (ratio > 0.33) return '#f59e0b';
    return '#10b981';
}
const styles = {
    container: {
        display: 'flex', flexDirection: 'column', gap: 24,
        padding: '24px', background: '#f9fafb', borderRadius: 16,
    },
    kpiRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
    kpiCard: {
        flex: '1 1 140px', background: 'white', borderRadius: 12,
        padding: '16px 18px', border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    },
    kpiLabel: {
        fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af',
        textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px 0',
    },
    kpiValue: { fontSize: '1.4rem', fontWeight: 900, margin: '0 0 2px 0', lineHeight: 1.2 },
    kpiUnit:  { fontSize: '0.85rem', fontWeight: 600, color: '#6b7280' },
    kpiSub:   { fontSize: '0.75rem', color: '#9ca3af', margin: 0 },

    controls: { display: 'flex', alignItems: 'center', gap: 8 },
    controlsLabel: { fontSize: '0.8rem', fontWeight: 700, color: '#6b7280' },
    sortBtn: {
        padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb',
        background: 'white', color: '#374151', fontSize: '0.82rem',
        fontWeight: 600, cursor: 'pointer',
    },
    sortBtnActive: { background: '#4F6BF6', color: 'white', borderColor: '#4F6BF6' },

    chartWrap: {
        background: 'white', borderRadius: 12, padding: '20px',
        border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    },
    chartTitle: {
        fontSize: '0.78rem', fontWeight: 700, color: '#6b7280',
        textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 16px 0',
    },

    tableWrap: {
        background: 'white', borderRadius: 12, padding: '20px',
        border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        overflowX: 'auto',
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
        fontSize: '0.72rem', fontWeight: 800, color: '#9ca3af',
        textTransform: 'uppercase', letterSpacing: '0.5px',
        padding: '8px 12px', borderBottom: '2px solid #f3f4f6',
    },
    td: {
        fontSize: '0.85rem', color: '#374151',
        padding: '10px 12px', borderBottom: '1px solid #f9fafb',
    },
    trEven: { background: '#fafafa' },
    badge: {
        display: 'inline-block', padding: '3px 10px', borderRadius: 20,
        fontSize: '0.72rem', fontWeight: 800,
    },

    tooltip: {
        background: 'white', border: '1px solid #e5e7eb', borderRadius: 10,
        padding: '12px 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: 180,
    },
    tooltipTitle: { fontSize: '0.85rem', fontWeight: 800, color: '#1a1d23', margin: '0 0 8px 0' },
    tooltipRow:   { fontSize: '0.8rem', color: '#6b7280', margin: '4px 0' },

    centerBox: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '60px 20px', gap: 12,
    },
    centerText: { fontSize: '0.9rem', color: '#9ca3af' },
    spinner: {
        width: 32, height: 32, borderRadius: '50%',
        border: '3px solid #e5e7eb', borderTopColor: '#4F6BF6',
        animation: 'spin 0.8s linear infinite',
    },
};
