import { useEditor } from '../../store/editorStore.jsx';
import { EXERCISE_TYPE_DEFINITIONS } from '../../constants/exerciseTypes';

export default function SolutionPanel() {
    const {
        settings, updateSettings,
        solution, toggleCorrect,
        selectedElement, selectedIds, elements,
        meta, updateMeta,
    } = useEditor();

    const selectedIsCorrect = selectedElement
        ? solution.correctElementIds.includes(selectedElement.id)
        : false;

    const correctCount = solution.correctElementIds.filter(
        id => elements.some(el => el.id === id)
    ).length;

    return (
        <div style={styles.panel}>
            <div style={styles.header}>
                <span style={styles.headerBadge}>SOLUȚIE</span>
                <span style={styles.headerInfo}>
                    {correctCount} {correctCount === 1 ? 'element marcat' : 'elemente marcate'} ca răspuns corect
                </span>
            </div>

            <div style={styles.grid}>

                <Section title="Setări generale">
                    <Field label="Tip exercițiu">
                        <select
                            value={meta.type}
                            onChange={(e) => updateMeta({ type: e.target.value })}
                            style={styles.input}
                        >
                            {EXERCISE_TYPE_DEFINITIONS.map(def => (
                                <option
                                    key={def.type}
                                    value={def.type}
                                    disabled={!def.implemented && def.type !== meta.type}
                                >
                                    {def.icon} {def.label} {!def.implemented ? '(în lucru)' : ''}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Număr încercări">
                        <input
                            type="number"
                            min={1}
                            max={10}
                            value={settings.maxAttempts}
                            onChange={(e) => updateSettings({ maxAttempts: parseInt(e.target.value) || 1 })}
                            style={styles.input}
                        />
                    </Field>

                    <Field label="Mod scoring">
                        <select
                            value={settings.scoringMode}
                            onChange={(e) => updateSettings({ scoringMode: e.target.value })}
                            style={styles.input}
                        >
                            <option value="integral">Integral (tot corect sau nimic)</option>
                            <option value="partial">Parțial (pe elemente corecte)</option>
                        </select>
                    </Field>

                    <Field label="Tip feedback">
                        <select
                            value={settings.feedbackType}
                            onChange={(e) => updateSettings({ feedbackType: e.target.value })}
                            style={styles.input}
                        >
                            <option value="instant">Instant (după fiecare acțiune)</option>
                            <option value="final">Final (după submit)</option>
                        </select>
                    </Field>

                    <Field label="Comportament la eșec">
                        <select
                            value={settings.behaviorOnFail}
                            onChange={(e) => updateSettings({ behaviorOnFail: e.target.value })}
                            style={styles.input}
                        >
                            <option value="showSolution">Arată soluția</option>
                            <option value="retry">Reîncearcă</option>
                            <option value="next">Următorul exercițiu</option>
                        </select>
                    </Field>
                </Section>

                <Section title="Hint & Explicație">
                    <Field label="Hint (afișat elevului la eșec)">
                        <textarea
                            value={settings.hint || ''}
                            onChange={(e) => updateSettings({ hint: e.target.value || null })}
                            placeholder="Text ajutător pentru elev..."
                            rows={3}
                            style={{ ...styles.input, resize: 'vertical', fontFamily: 'inherit' }}
                        />
                    </Field>

                    <Field label="Explicație (după rezolvare)">
                        <textarea
                            value={settings.explanation || ''}
                            onChange={(e) => updateSettings({ explanation: e.target.value || null })}
                            placeholder="Explicația soluției..."
                            rows={3}
                            style={{ ...styles.input, resize: 'vertical', fontFamily: 'inherit' }}
                        />
                    </Field>
                </Section>

                <Section title="Marcare răspuns">
                    {!selectedElement && selectedIds.length === 0 && (
                        <p style={styles.emptyText}>
                            Selectează un element din canvas pentru a-l marca ca răspuns corect.
                        </p>
                    )}

                    {!selectedElement && selectedIds.length > 1 && (
                        <p style={styles.emptyText}>
                            Marcarea funcționează pe un singur element odată. Deselectează.
                        </p>
                    )}

                    {selectedElement && (
                        <>
                            <div style={styles.selectedInfo}>
                                <span style={styles.selectedType}>{selectedElement.type}</span>
                                <span style={styles.selectedId}>
                                    ID: {selectedElement.id.substring(0, 15)}...
                                </span>
                            </div>
                            <button
                                onClick={() => toggleCorrect(selectedElement.id)}
                                style={{
                                    ...styles.markBtn,
                                    background: selectedIsCorrect ? '#dc2626' : '#059669',
                                }}
                            >
                                {selectedIsCorrect
                                    ? '✗ Demarchează ca răspuns corect'
                                    : '✓ Marchează ca răspuns corect'}
                            </button>
                        </>
                    )}
                </Section>
            </div>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div style={styles.section}>
            <h3 style={styles.sectionTitle}>{title}</h3>
            <div style={styles.sectionContent}>{children}</div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div style={styles.field}>
            <label style={styles.fieldLabel}>{label}</label>
            {children}
        </div>
    );
}

const styles = {
    panel: {
        background: 'white',
        borderTop: '1px solid #e5e7eb',
        padding: '16px 20px',
        maxHeight: '40vh',
        overflowY: 'auto',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.03)',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
        paddingBottom: 10,
        borderBottom: '1px solid #f3f4f6',
    },
    headerBadge: {
        background: '#059669',
        color: 'white',
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: '0.7rem',
        fontWeight: 800,
        letterSpacing: '0.5px',
    },
    headerInfo: {
        fontSize: '0.85rem',
        color: '#6b7280',
        fontWeight: 600,
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 20,
    },
    section: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    },
    sectionTitle: {
        fontSize: '0.7rem',
        fontWeight: 800,
        color: '#9ca3af',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        margin: 0,
    },
    sectionContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    },
    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
    },
    fieldLabel: {
        fontSize: '0.75rem',
        fontWeight: 700,
        color: '#374151',
    },
    input: {
        padding: '8px 10px',
        border: '1.5px solid #e5e7eb',
        borderRadius: 8,
        fontSize: '0.85rem',
        outline: 'none',
        color: '#1a1d23',
        background: 'white',
        fontFamily: 'inherit',
    },
    emptyText: {
        fontSize: '0.8rem',
        color: '#9ca3af',
        fontStyle: 'italic',
        margin: 0,
        padding: '12px 0',
    },
    selectedInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '8px 10px',
        background: '#f9fafb',
        borderRadius: 8,
        border: '1px solid #f3f4f6',
    },
    selectedType: {
        fontSize: '0.75rem',
        fontWeight: 800,
        color: '#4F6BF6',
    },
    selectedId: {
        fontSize: '0.7rem',
        color: '#9ca3af',
        fontFamily: 'monospace',
    },
    markBtn: {
        color: 'white',
        border: 'none',
        padding: '10px 14px',
        borderRadius: 8,
        fontSize: '0.85rem',
        fontWeight: 800,
        cursor: 'pointer',
        transition: 'all 0.15s',
    },
};