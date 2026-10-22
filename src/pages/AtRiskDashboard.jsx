import React, { useEffect, useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import api from "../api/axios.js";
const RISK_COLOR = { HIGH: "#ef4444", MEDIUM: "#f97316", LOW: "#eab308" };
const RISK_BG    = { HIGH: "#fef2f2", MEDIUM: "#fff7ed", LOW: "#fefce8" };
const RISK_LABEL = { HIGH: "Risc mare", MEDIUM: "Risc mediu", LOW: "Risc mic" };
function RiskBadge({ level }) {
    return (
        <span style={{
            display: "inline-block",
            padding: "2px 10px",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 700,
            background: RISK_BG[level] || "#f3f4f6",
            color: RISK_COLOR[level] || "#374151",
            border: `1px solid ${RISK_COLOR[level] || "#d1d5db"}`,
        }}>
      {RISK_LABEL[level] || level}
    </span>
    );
}
function StudentCard({ student }) {
    const [open, setOpen] = useState(false);

    return (
        <div style={{
            border: `1.5px solid ${RISK_COLOR[student.riskLevel] || "#d1d5db"}`,
            borderRadius: 10,
            marginBottom: 12,
            background: "#fff",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            overflow: "hidden",
        }}>
            <div
                onClick={() => setOpen(o => !o)}
                style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", cursor: "pointer",
                    background: RISK_BG[student.riskLevel] || "#f9fafb",
                }}
            >
                <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{student.userName}</span>
                    <span style={{ color: "#6b7280", fontSize: 13, marginLeft: 8 }}>
            {student.userEmail}
          </span>
                </div>
                <RiskBadge level={student.riskLevel} />
                <span style={{ color: "#9ca3af", fontSize: 18 }}>{open ? "▲" : "▼"}</span>
            </div>

            {open && (
                <div style={{ padding: "14px 16px", borderTop: "1px solid #f3f4f6" }}>
                    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 10 }}>
                        <Stat label="Rată succes" value={`${student.successRate ?? 0}%`} />
                        <Stat label="Tentative totale" value={student.totalAttempts} />
                        <Stat label="Quiz-uri abandonate" value={student.abandonedQuizzes} />
                        <Stat label="Ultima activitate"
                              value={student.lastActivity
                                  ? new Date(student.lastActivity).toLocaleDateString("ro-RO")
                                  : "Niciodată"} />
                    </div>

                    <div style={{ marginTop: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>
              Semnale de risc:
            </span>
                        <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                            {student.riskFlags.map((flag, i) => (
                                <li key={i} style={{ fontSize: 13, color: "#6b7280", marginBottom: 3 }}>
                                    {flag}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

function Stat({ label, value }) {
    return (
        <div>
            <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {label}
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>{value}</div>
        </div>
    );
}

function RiskSummaryChart({ students }) {
    const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    students.forEach(s => { if (counts[s.riskLevel] !== undefined) counts[s.riskLevel]++; });
    const data = [
        { name: "Risc mare",  value: counts.HIGH,   color: RISK_COLOR.HIGH   },
        { name: "Risc mediu", value: counts.MEDIUM, color: RISK_COLOR.MEDIUM },
        { name: "Risc mic",   value: counts.LOW,    color: RISK_COLOR.LOW    },
    ].filter(d => d.value > 0);

    if (data.length === 0) return null;

    return (
        <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
                Distribuție risc
            </h3>
            <ResponsiveContainer width="100%" height={120}>
                <BarChart data={data} layout="vertical" margin={{ left: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 13 }} />
                    <Tooltip formatter={(v) => [`${v} studenți`, ""]} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {data.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

const FILTER_OPTIONS = [
    { value: "ALL",    label: "Toți" },
    { value: "HIGH",   label: "Risc mare" },
    { value: "MEDIUM", label: "Risc mediu" },
    { value: "LOW",    label: "Risc mic" },
];

export default function AtRiskDashboard() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState(null);
    const [filter, setFilter]     = useState("ALL");
    const [search, setSearch]     = useState("");

    useEffect(() => {
        api.get("/analytics/at-risk/students")
            .then(r => setStudents(r.data))
            .catch(() => setError("Nu s-au putut încărca datele."))
            .finally(() => setLoading(false));
    }, []);

    const visible = students
        .filter(s => filter === "ALL" || s.riskLevel === filter)
        .filter(s =>
            s.userName.toLowerCase().includes(search.toLowerCase()) ||
            s.userEmail.toLowerCase().includes(search.toLowerCase())
        );

    if (loading) return <div style={{ padding: 32, color: "#6b7280" }}>Se încarcă...</div>;
    if (error)   return <div style={{ padding: 32, color: "#ef4444" }}>{error}</div>;

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
                        Studenți la risc
                    </h2>
                    <p style={{ color: "#6b7280", fontSize: 14, margin: "4px 0 0" }}>
                        {students.length} studenți identificați
                    </p>
                </div>
            </div>

            {students.length === 0 ? (
                <div style={{
                    padding: 40, textAlign: "center", background: "#f0fdf4",
                    borderRadius: 12, border: "1px solid #bbf7d0",
                }}>
                    <div style={{ fontSize: 40 }}>✅</div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: "#166534", marginTop: 8 }}>
                        Niciun student la risc momentan!
                    </div>
                    <div style={{ color: "#4ade80", fontSize: 14, marginTop: 4 }}>
                        Toți studenții sunt activi și au performanțe bune.
                    </div>
                </div>
            ) : (
                <>
                    <RiskSummaryChart students={students} />

                    <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                        {FILTER_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setFilter(opt.value)}
                                style={{
                                    padding: "6px 14px",
                                    borderRadius: 20,
                                    border: filter === opt.value
                                        ? `2px solid ${RISK_COLOR[opt.value] || "#6366f1"}`
                                        : "1.5px solid #e5e7eb",
                                    background: filter === opt.value ? (RISK_BG[opt.value] || "#eef2ff") : "#fff",
                                    color: filter === opt.value ? (RISK_COLOR[opt.value] || "#4f46e5") : "#374151",
                                    fontWeight: filter === opt.value ? 700 : 400,
                                    cursor: "pointer",
                                    fontSize: 13,
                                    transition: "all 0.15s",
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                        <input
                            type="text"
                            placeholder="Caută după nume sau email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                flex: 1, minWidth: 200,
                                padding: "6px 12px",
                                borderRadius: 20,
                                border: "1.5px solid #e5e7eb",
                                fontSize: 13,
                                outline: "none",
                            }}
                        />
                    </div>

                    {visible.length === 0 ? (
                        <div style={{ color: "#9ca3af", textAlign: "center", padding: 32 }}>
                            Niciun student corespunde filtrului selectat.
                        </div>
                    ) : (
                        visible.map(s => <StudentCard key={s.userId} student={s} />)
                    )}
                </>
            )}
        </div>
    );
}
