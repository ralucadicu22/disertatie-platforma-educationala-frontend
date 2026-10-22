import React, { useState } from "react";
import AdvancedAnalyticsDashboard from "./AdvancedAnalyticsDashboard";
import AtRiskDashboard from "./AtRiskDashboard";

const TABS = [
    { key: "analytics", label: "📊 Analytics"        },
    { key: "atrisk",    label: "🚨 Studenți la risc" },
];

export default function TeacherDashboard() {
    const [activeTab, setActiveTab] = useState("analytics");

    return (
        <div style={{ fontFamily: "Inter, system-ui, sans-serif", minHeight: "100vh", background: "#f9fafb" }}>

            <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 24px" }}>
                <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", padding: "20px 0 0", margin: 0 }}>
                        Dashboard Profesor
                    </h1>

                    <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    padding: "10px 18px",
                                    border: "none",
                                    background: "none",
                                    borderBottom: activeTab === tab.key ? "2.5px solid #6366f1" : "2.5px solid transparent",
                                    color: activeTab === tab.key ? "#6366f1" : "#6b7280",
                                    fontWeight: activeTab === tab.key ? 700 : 400,
                                    fontSize: 14,
                                    cursor: "pointer",
                                    transition: "all 0.15s",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
                {activeTab === "analytics" && <AdvancedAnalyticsDashboard />}
                {activeTab === "atrisk"    && <AtRiskDashboard />}
            </div>
        </div>
    );
}
