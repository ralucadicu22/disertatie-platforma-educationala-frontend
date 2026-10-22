import React, { useEffect, useState } from "react";
import api from "../api/axios.js";
import HintsModal from "../components/HintsModal.jsx";



const TYPE_CONFIG = {
  WARNING: {
    bg:     "#fef2f2",
    border: "#fca5a5",
    icon:   "⚠️",
    color:  "#b91c1c",
    label:  "Atenție",
  },
  INFO: {
    bg:     "#eff6ff",
    border: "#93c5fd",
    icon:   "ℹ️",
    color:  "#1d4ed8",
    label:  "Informație",
  },
  ACTION: {
    bg:     "#f0fdf4",
    border: "#86efac",
    icon:   "🎯",
    color:  "#15803d",
    label:  "Acțiune recomandată",
  },
};

function RecommendationCard({ rec, onAction }) {
  const cfg = TYPE_CONFIG[rec.type] || TYPE_CONFIG.INFO;

  return (
      <div style={{
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 12,
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
      }}>
        <span style={{ fontSize: 22, lineHeight: 1, marginTop: 2 }}>{cfg.icon}</span>

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            color: cfg.color,
            marginBottom: 3,
          }}>
            {cfg.label}
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 4 }}>
            {rec.title}
          </div>
          <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.5 }}>
            {rec.message}
          </div>
          {rec.actionLabel && (
              <button
                  onClick={() => onAction && onAction(rec)}
                  style={{
                    marginTop: 10,
                    padding: "6px 16px",
                    borderRadius: 20,
                    border: `1.5px solid ${cfg.border}`,
                    background: "#fff",
                    color: cfg.color,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
              >
                {rec.actionLabel} →
              </button>
          )}
        </div>
      </div>
  );
}

export default function RecommendationsWidget({ studentId, onNavigate }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [hintsExerciseId, setHintsExerciseId] = useState(null);

  useEffect(() => {
    if (!studentId) return;
    api.get(`/analytics/recommendations/student/${studentId}`)
        .then(r => setData(r.data))
        .catch(() => setError("Nu s-au putut încărca recomandările."))
        .finally(() => setLoading(false));
  }, [studentId]);

  const handleAction = (rec) => {
    if (rec.type === 'ACTION' && rec.actionLabel === 'Vezi indicii' && rec.targetId) {
      setHintsExerciseId(rec.targetId);
    } else if (onNavigate) {
      onNavigate(rec);
    }
  };

  if (!studentId) return null;
  if (loading) return (
      <div style={{ padding: 20, color: "#6b7280", fontSize: 14 }}>
        Se încarcă recomandările...
      </div>
  );
  if (error) return (
      <div style={{ padding: 20, color: "#ef4444", fontSize: 14 }}>{error}</div>
  );
  if (!data) return null;

  const warnings = data.recommendations.filter(r => r.type === "WARNING");
  const actions  = data.recommendations.filter(r => r.type === "ACTION");
  const infos    = data.recommendations.filter(r => r.type === "INFO");
  const ordered  = [...warnings, ...actions, ...infos];

  return (
      <>
        {hintsExerciseId && (
            <HintsModal
                exerciseId={hintsExerciseId}
                onClose={() => setHintsExerciseId(null)}
            />
        )}

        <div style={{
          background: "#fff",
          border: "1.5px solid #e5e7eb",
          borderRadius: 14,
          padding: "20px 20px 8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
          }}>
            <span style={{ fontSize: 20 }}>📋</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>
                Recomandările tale
              </div>
              {data.userName && (
                  <div style={{ fontSize: 13, color: "#6b7280" }}>
                    Bună, {data.userName}!
                  </div>
              )}
            </div>

            {warnings.length > 0 && (
                <span style={{
                  marginLeft: "auto",
                  background: "#fef2f2",
                  border: "1px solid #fca5a5",
                  color: "#b91c1c",
                  borderRadius: 12,
                  padding: "2px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                            {warnings.length} {warnings.length === 1 ? "avertisment" : "avertismente"}
                        </span>
            )}
          </div>

          <div>
            {ordered.map((rec, i) => (
                <RecommendationCard
                    key={i}
                    rec={rec}
                    onAction={handleAction}
                />
            ))}
          </div>

          <div style={{
            fontSize: 11, color: "#9ca3af", textAlign: "right",
            marginTop: 4, paddingBottom: 4,
          }}>
            Actualizat în timp real pe baza activității tale
          </div>
        </div>
      </>
  );
}
