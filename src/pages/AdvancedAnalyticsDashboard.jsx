import { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell, LabelList,
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import api from "../api/axios.js";

export default function AdvancedAnalyticsDashboard() {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);
    const [tab, setTab]         = useState('scores'); // 'scores' | 'errors'

    useEffect(() => {
        setLoading(true);
        api.get('/analytics/attempts/advanced')
            .then(res => setData(res.data))
            .catch(() => setError('Nu s-au putut încărca datele.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingState />;
    if (error)   return <ErrorState message={error} />;
    if (!data || (!data.exerciseScores?.length && !data.studentPatterns?.length)) {
        return <EmptyState />;
    }

    return (
        <div style={S.container}>

            <div style={S.tabRow}>
                <TabBtn active={tab === 'scores'} onClick={() => setTab('scores')}>
                    📊 Scoruri per exercițiu
                </TabBtn>
                <TabBtn active={tab === 'errors'} onClick={() => setTab('errors')}>
                    ⚠️ Tipare de erori
                </TabBtn>
            </div>

            {tab === 'scores' && <ScoresTab rows={data.exerciseScores} />}
            {tab === 'errors' && <ErrorsTab rows={data.studentPatterns} />}
        </div>
    );
}

function ScoresTab({ rows }) {
    const [metric, setMetric] = useState('avgScore'); // 'avgScore' | 'errorRate' | 'successRate'

    if (!rows?.length) return <EmptyState />;

    const sorted = [...rows].sort((a, b) => b[metric] - a[metric]);

    const globalAvg   = (rows.reduce((s, r) => s + r.avgScore,    0) / rows.length).toFixed(1);
    const globalErr   = (rows.reduce((s, r) => s + r.errorRate,   0) / rows.length).toFixed(1);
    const globalSucc  = (rows.reduce((s, r) => s + r.successRate, 0) / rows.length).toFixed(1);
    const hardest     = [...rows].sort((a, b) => a.successRate - b.successRate)[0];
    const easiest     = [...rows].sort((a, b) => b.successRate - a.successRate)[0];

    const METRIC_LABELS = {
        avgScore:    'Scor mediu',
        errorRate:   'Rată erori (%)',
        successRate: 'Rată succes (%)',
    };

    return (
        <>
            <div style={S.kpiRow}>
                <KpiCard label="Scor mediu global"   value={globalAvg}  unit="pct" />
                <KpiCard label="Rată succes medie"   value={globalSucc} unit="%" accent="#10b981" />
                <KpiCard label="Rată erori medie"    value={globalErr}  unit="%" accent="#ef4444" />
                <KpiCard label="Cel mai greoi"       value={hardest.exerciseLabel}
                         sub={`${hardest.successRate}% succes`} accent="#ef4444" />
                <KpiCard label="Cel mai accesibil"   value={easiest.exerciseLabel}
                         sub={`${easiest.successRate}% succes`} accent="#10b981" />
            </div>


            <div style={S.controls}>
                <span style={S.controlsLabel}>Afișează:</span>
                {Object.entries(METRIC_LABELS).map(([key, label]) => (
                    <SortBtn key={key} active={metric === key} onClick={() => setMetric(key)}>
                        {label}
                    </SortBtn>
                ))}
            </div>

            <div style={S.chartWrap}>
                <p style={S.chartTitle}>{METRIC_LABELS[metric]} per exercițiu</p>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                        data={sorted}
                        margin={{ top: 20, right: 20, left: 0, bottom: 60 }}
                        barSize={28}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="exerciseLabel"
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            angle={-35}
                            textAnchor="end"
                            interval={0}
                        />
                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }}
                               domain={metric !== 'avgScore' ? [0, 100] : undefined} />
                        <Tooltip content={<ScoreTooltip />} />
                        <Bar dataKey={metric} radius={[6, 6, 0, 0]}>
                            {sorted.map((entry, i) => (
                                <Cell key={i} fill={scoreColor(entry, metric)} />
                            ))}
                            <LabelList
                                dataKey={metric}
                                position="top"
                                formatter={v => metric === 'avgScore' ? v : `${v}%`}
                                style={{ fontSize: 11, fontWeight: 700, fill: '#374151' }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Table */}
            <div style={S.tableWrap}>
                <p style={S.chartTitle}>Detalii scoruri per exercițiu</p>
                <table style={S.table}>
                    <thead>
                    <tr>
                        <Th>Exercițiu</Th>
                        <Th align="right">Scor mediu</Th>
                        <Th align="right">Scor max</Th>
                        <Th align="right">Scor min</Th>
                        <Th align="right">Submisii</Th>
                        <Th align="right">Studenți</Th>
                        <Th align="center">Rată succes</Th>
                        <Th align="center">Dificultate</Th>
                    </tr>
                    </thead>
                    <tbody>
                    {sorted.map((row, i) => (
                        <tr key={row.exerciseId} style={i % 2 === 0 ? S.trEven : {}}>
                            <Td><span style={{ fontWeight: 700, color: '#1a1d23' }}>{row.exerciseLabel}</span></Td>
                            <Td align="right">
                                    <span style={{ fontWeight: 800, color: scoreTextColor(row.avgScore, sorted, 'avgScore') }}>
                                        {row.avgScore}
                                    </span>
                            </Td>
                            <Td align="right">{row.maxScore}</Td>
                            <Td align="right">{row.minScore}</Td>
                            <Td align="right">{row.totalAttempts}</Td>
                            <Td align="right">{row.uniqueStudents}</Td>
                            <Td align="center">
                                <SuccessRateBadge rate={row.successRate} />
                            </Td>
                            <Td align="center">
                                <DifficultyBadge rate={row.successRate} />
                            </Td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

function ErrorsTab({ rows }) {
    if (!rows?.length) return <EmptyState />;

    const sorted = [...rows].sort((a, b) => a.overallSuccessRate - b.overallSuccessRate);
    const topStruggling = sorted.slice(0, 5);

    const avgSuccess = (rows.reduce((s, r) => s + r.overallSuccessRate, 0) / rows.length).toFixed(1);
    const avgAttempts = (rows.reduce((s, r) => s + r.avgAttemptsPerExercise, 0) / rows.length).toFixed(1);

    return (
        <>
            <div style={S.kpiRow}>
                <KpiCard label="Studenți analizați"      value={rows.length} />
                <KpiCard label="Rată succes medie"        value={avgSuccess}  unit="%" accent="#6366f1" />
                <KpiCard label="Media înc. / exercițiu"  value={avgAttempts} unit="înc." />
            </div>

            <div style={S.chartWrap}>
                <p style={S.chartTitle}>Top studenți cu dificultăți (rată succes ↓)</p>
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                        data={topStruggling}
                        margin={{ top: 20, right: 20, left: 0, bottom: 40 }}
                        barSize={32}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="userName"
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            angle={-20}
                            textAnchor="end"
                            interval={0}
                        />
                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} domain={[0, 100]} />
                        <Tooltip content={<StudentTooltip />} />
                        <Bar dataKey="overallSuccessRate" radius={[6, 6, 0, 0]}>
                            {topStruggling.map((_, i) => (
                                <Cell key={i} fill={['#ef4444','#f97316','#f59e0b','#eab308','#84cc16'][i] || '#ef4444'} />
                            ))}
                            <LabelList
                                dataKey="overallSuccessRate"
                                position="top"
                                formatter={v => `${v}%`}
                                style={{ fontSize: 11, fontWeight: 700, fill: '#374151' }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div style={S.tableWrap}>
                <p style={S.chartTitle}>Tipare erori per student</p>
                <table style={S.table}>
                    <thead>
                    <tr>
                        <Th>#</Th>
                        <Th>Student</Th>
                        <Th align="right">Submisii totale</Th>
                        <Th align="right">Greșeli</Th>
                        <Th align="right">Ex. încercate</Th>
                        <Th align="right">Ex. rezolvate</Th>
                        <Th align="right">Media înc./ex.</Th>
                        <Th align="center">Rată succes</Th>
                    </tr>
                    </thead>
                    <tbody>
                    {sorted.map((row, i) => (
                        <tr key={row.userId} style={i % 2 === 0 ? S.trEven : {}}>
                            <Td>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af' }}>
                                        {i + 1}
                                    </span>
                            </Td>
                            <Td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={S.avatar}>
                                        {row.userName?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <span style={{ fontWeight: 700, color: '#1a1d23' }}>{row.userName}</span>
                                </div>
                            </Td>
                            <Td align="right">{row.totalAttempts}</Td>
                            <Td align="right">
                                    <span style={{ fontWeight: 800, color: row.failedAttempts > 5 ? '#ef4444' : '#374151' }}>
                                        {row.failedAttempts}
                                    </span>
                            </Td>
                            <Td align="right">{row.exercisesTried}</Td>
                            <Td align="right">{row.exercisesSolved}</Td>
                            <Td align="right">
                                    <span style={{ fontWeight: 700 }}>
                                        {row.avgAttemptsPerExercise}
                                    </span>
                            </Td>
                            <Td align="center">
                                <SuccessRateBadge rate={row.overallSuccessRate} />
                            </Td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
function TabBtn({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            style={{
                ...S.tabBtn,
                ...(active ? S.tabBtnActive : {}),
            }}
        >
            {children}
        </button>
    );
}

function KpiCard({ label, value, unit, sub, accent }) {
    return (
        <div style={S.kpiCard}>
            <p style={S.kpiLabel}>{label}</p>
            <p style={{ ...S.kpiValue, color: accent || '#1a1d23' }}>
                {value}{unit ? <span style={S.kpiUnit}> {unit}</span> : null}
            </p>
            {sub && <p style={S.kpiSub}>{sub}</p>}
        </div>
    );
}

function SortBtn({ active, onClick, children }) {
    return (
        <button
            style={{ ...S.sortBtn, ...(active ? S.sortBtnActive : {}) }}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

function SuccessRateBadge({ rate }) {
    const color = rate >= 70 ? '#15803d' : rate >= 40 ? '#92400e' : '#b91c1c';
    const bg    = rate >= 70 ? '#dcfce7'  : rate >= 40 ? '#fef9c3'  : '#fee2e2';
    return (
        <span style={{ ...S.badge, background: bg, color }}>
            {rate}%
        </span>
    );
}

function DifficultyBadge({ rate }) {
    const level  = rate >= 70 ? 'Ușor' : rate >= 40 ? 'Mediu' : 'Dificil';
    const colors = {
        'Dificil': { bg: '#fee2e2', color: '#b91c1c' },
        'Mediu':   { bg: '#fef9c3', color: '#92400e' },
        'Ușor':    { bg: '#dcfce7', color: '#15803d' },
    };
    return <span style={{ ...S.badge, ...colors[level] }}>{level}</span>;
}

function ScoreTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div style={S.tooltip}>
            <p style={S.tooltipTitle}>{d.exerciseLabel}</p>
            <p style={S.tooltipRow}>Scor mediu: <strong>{d.avgScore}</strong></p>
            <p style={S.tooltipRow}>Scor max: <strong>{d.maxScore}</strong></p>
            <p style={S.tooltipRow}>Scor min: <strong>{d.minScore}</strong></p>
            <p style={S.tooltipRow}>Submisii: <strong>{d.totalAttempts}</strong></p>
            <p style={S.tooltipRow}>Rată succes: <strong>{d.successRate}%</strong></p>
            <p style={S.tooltipRow}>Rată erori: <strong>{d.errorRate}%</strong></p>
        </div>
    );
}

function StudentTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div style={S.tooltip}>
            <p style={S.tooltipTitle}>{d.userName}</p>
            <p style={S.tooltipRow}>Submisii totale: <strong>{d.totalAttempts}</strong></p>
            <p style={S.tooltipRow}>Greșeli: <strong>{d.failedAttempts}</strong></p>
            <p style={S.tooltipRow}>Ex. rezolvate: <strong>{d.exercisesSolved} / {d.exercisesTried}</strong></p>
            <p style={S.tooltipRow}>Rată succes: <strong>{d.overallSuccessRate}%</strong></p>
            <p style={S.tooltipRow}>Media înc./ex.: <strong>{d.avgAttemptsPerExercise}</strong></p>
        </div>
    );
}

function Th({ children, align = 'left' }) {
    return <th style={{ ...S.th, textAlign: align }}>{children}</th>;
}

function Td({ children, align = 'left' }) {
    return <td style={{ ...S.td, textAlign: align }}>{children}</td>;
}

function LoadingState() {
    return (
        <div style={S.centerBox}>
            <div style={S.spinner} />
            <p style={S.centerText}>Se încarcă analytics avansate...</p>
        </div>
    );
}

function ErrorState({ message }) {
    return <div style={{ ...S.centerBox, color: '#b91c1c' }}><p>⚠ {message}</p></div>;
}

function EmptyState() {
    return <div style={S.centerBox}><p style={S.centerText}>Nu există date de afișat.</p></div>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreColor(row, metric) {
    if (metric === 'errorRate')   return row.errorRate  >= 60 ? '#ef4444' : row.errorRate  >= 30 ? '#f59e0b' : '#10b981';
    if (metric === 'successRate') return row.successRate >= 70 ? '#10b981' : row.successRate >= 40 ? '#f59e0b' : '#ef4444';
    // avgScore — relative coloring
    return '#6366f1';
}

function scoreTextColor(val, all, key) {
    const vals = all.map(r => r[key]);
    const max  = Math.max(...vals);
    const min  = Math.min(...vals);
    const range = max - min || 1;
    const ratio = (val - min) / range;
    if (ratio > 0.66) return '#059669';
    if (ratio > 0.33) return '#f59e0b';
    return '#ef4444';
}

// ─── Stiluri ─────────────────────────────────────────────────────────────────
const S = {
    container: { display: 'flex', flexDirection: 'column', gap: 24, padding: '24px', background: '#f9fafb', borderRadius: 16 },

    tabRow: { display: 'flex', gap: 8, padding: '4px', background: '#e5e7eb', borderRadius: 12, width: 'fit-content' },
    tabBtn: {
        padding: '8px 18px', borderRadius: 9, border: 'none', background: 'transparent',
        color: '#6b7280', fontSize: '0.83rem', fontWeight: 700, cursor: 'pointer',
    },
    tabBtnActive: { background: 'white', color: '#1a1d23', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },

    kpiRow:  { display: 'flex', gap: 12, flexWrap: 'wrap' },
    kpiCard: {
        flex: '1 1 140px', background: 'white', borderRadius: 12,
        padding: '16px 18px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    },
    kpiLabel: { fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px 0' },
    kpiValue: { fontSize: '1.35rem', fontWeight: 900, margin: '0 0 2px 0', lineHeight: 1.2 },
    kpiUnit:  { fontSize: '0.83rem', fontWeight: 600, color: '#6b7280' },
    kpiSub:   { fontSize: '0.75rem', color: '#9ca3af', margin: 0 },

    controls:      { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    controlsLabel: { fontSize: '0.8rem', fontWeight: 700, color: '#6b7280' },
    sortBtn: {
        padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb',
        background: 'white', color: '#374151', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
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
        border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflowX: 'auto',
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
        fontSize: '0.72rem', fontWeight: 800, color: '#9ca3af',
        textTransform: 'uppercase', letterSpacing: '0.5px',
        padding: '8px 12px', borderBottom: '2px solid #f3f4f6',
    },
    td: { fontSize: '0.85rem', color: '#374151', padding: '10px 12px', borderBottom: '1px solid #f9fafb' },
    trEven: { background: '#fafafa' },
    badge: {
        display: 'inline-block', padding: '3px 10px', borderRadius: 20,
        fontSize: '0.72rem', fontWeight: 800,
    },

    avatar: {
        width: 30, height: 30, borderRadius: '50%',
        background: 'linear-gradient(135deg, #4F6BF6, #7c3aed)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0,
    },

    tooltip: {
        background: 'white', border: '1px solid #e5e7eb', borderRadius: 10,
        padding: '12px 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: 190,
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
