import { useEditor } from '../../store/editorStore.jsx';
import { EXERCISE_TYPE_DEFINITIONS, EXERCISE_TYPES } from '../../constants/exerciseTypes';
import {useState} from "react";

export default function SolutionPanel() {
    const {
        settings, updateSettings,
        solution, toggleCorrect, updateSolution,
        selectedElement, selectedIds, elements,
        meta, updateMeta,
    } = useEditor();

    const isDragAndDrop = meta.type === EXERCISE_TYPES.DRAG_AND_DROP;

    const selectedIsCorrect = selectedElement
        ? solution.correctElementIds.includes(selectedElement.id)
        : false;

    const correctCount = solution.correctElementIds.filter(
        id => elements.some(el => el.id === id)
    ).length;

    const dropMapping = solution.dropMapping || {};
    const mappingCount = Object.keys(dropMapping).filter(
        draggableId => elements.some(el => el.id === draggableId)
    ).length;

    const targetElements = elements.filter(el => el.behavior === 'dropTarget');
    const draggableElements = elements.filter(el => el.behavior === 'draggable');

    const assignTarget = (draggableId, targetId) => {
        updateSolution({ dropMapping: { ...dropMapping, [draggableId]: targetId } });
    };

    const removeMapping = (draggableId) => {
        const next = { ...dropMapping };
        delete next[draggableId];
        updateSolution({ dropMapping: next });
    };

    return (
        <div style={styles.panel}>
            <div style={styles.header}>
                <span style={styles.headerBadge}>SOLUȚIE</span>
                <span style={styles.headerInfo}>
                    {isDragAndDrop
                        ? `${mappingCount} ${mappingCount === 1 ? 'pereche configurată' : 'perechi configurate'}`
                        : `${correctCount} ${correctCount === 1 ? 'element marcat' : 'elemente marcate'} ca răspuns corect`}
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

                {(meta.type === 'INPUT_TEXT' || meta.type === 'INPUT_NUMERIC' || meta.type === 'CUSTOM') && (
                    <Section title="Răspunsuri acceptate">
                        <p style={{ ...styles.emptyText, fontStyle: 'normal', color: '#374151', marginBottom: 4 }}>
                            Adaugă toate variantele de răspuns acceptate (ex: "7", "șapte", "7,0").
                        </p>
                        <AlternativeAnswers
                            answers={solution.alternativeAnswers || []}
                            onChange={(answers) => updateSolution({ alternativeAnswers: answers })}
                            type={meta.type}
                        />
                    </Section>
                )}

                <Section title="Marcare răspuns">
                    {!isDragAndDrop && (
                        <>
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
                        </>
                    )}

                    {isDragAndDrop && (
                        <DragDropMapping
                            selectedElement={selectedElement}
                            draggableElements={draggableElements}
                            targetElements={targetElements}
                            dropMapping={dropMapping}
                            onAssign={assignTarget}
                            onRemove={removeMapping}
                        />
                    )}
                </Section>
            </div>
        </div>
    );
}

function DragDropMapping({ selectedElement, draggableElements, targetElements, dropMapping, onAssign, onRemove }) {
    if (draggableElements.length === 0 || targetElements.length === 0) {
        return (
            <p style={styles.emptyText}>
                Ai nevoie de cel puțin un element cu comportament „Drag source” și unul cu „Drop target”
                (setează din Properties Panel → tab Comportament).
            </p>
        );
    }

    const isDraggableSelected = selectedElement && selectedElement.behavior === 'draggable';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!isDraggableSelected && (
                <p style={styles.emptyText}>
                    Selectează pe canvas un element „Drag source” pentru a-i alege zona corectă.
                </p>
            )}

            {isDraggableSelected && (
                <>
                    <div style={styles.selectedInfo}>
                        <span style={styles.selectedType}>DRAGGABLE</span>
                        <span style={styles.selectedId}>
                            ID: {selectedElement.id.substring(0, 15)}...
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {targetElements.map(target => {
                            const isAssigned = dropMapping[selectedElement.id] === target.id;
                            return (
                                <button
                                    key={target.id}
                                    onClick={() => onAssign(selectedElement.id, target.id)}
                                    style={{
                                        ...styles.targetOptionBtn,
                                        background: isAssigned ? '#059669' : '#f9fafb',
                                        color: isAssigned ? 'white' : '#1a1d23',
                                        borderColor: isAssigned ? '#059669' : '#e5e7eb',
                                    }}
                                >
                                    {isAssigned ? '✓ ' : ''}Zonă: {target.id.substring(0, 18)}...
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 10, marginTop: 4 }}>
                <p style={{ ...styles.fieldLabel, marginBottom: 6 }}>Perechi configurate</p>
                {Object.keys(dropMapping).length === 0 && (
                    <p style={styles.emptyText}>Nicio pereche configurată încă.</p>
                )}
                {Object.entries(dropMapping).map(([draggableId, targetId]) => (
                    <div key={draggableId} style={styles.mappingRow}>
                        <span style={styles.mappingText}>
                            {draggableId.substring(0, 10)}... → {targetId.substring(0, 10)}...
                        </span>
                        <button onClick={() => onRemove(draggableId)} style={styles.removeMappingBtn}>✕</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
function AlternativeAnswers({ answers, onChange, type }) {
    const [newAnswer, setNewAnswer] = useState('');

    const addAnswer = () => {
        const trimmed = newAnswer.trim();
        if (!trimmed || answers.includes(trimmed)) return;
        onChange([...answers, trimmed]);
        setNewAnswer('');
    };

    const removeAnswer = (index) => {
        onChange(answers.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addAnswer();
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {answers.length === 0 ? (
                <p style={styles.emptyText}>Niciun răspuns adăugat încă.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {answers.map((ans, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: 6,
                        }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534' }}>
                                {ans}
                            </span>
                            <button
                                onClick={() => removeAnswer(i)}
                                style={{
                                    background: '#fee2e2', color: '#b91c1c',
                                    border: 'none', borderRadius: 4,
                                    width: 20, height: 20, fontSize: '0.65rem',
                                    cursor: 'pointer', flexShrink: 0,
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: 'flex', gap: 6 }}>
                <input
                    type={type === 'INPUT_NUMERIC' ? 'number' : 'text'}
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={type === 'INPUT_NUMERIC' ? 'ex: 7' : 'ex: șapte'}
                    style={{ ...styles.input, flex: 1 }}
                />
                <button
                    onClick={addAnswer}
                    disabled={!newAnswer.trim()}
                    style={{
                        background: newAnswer.trim() ? '#059669' : '#d1fae5',
                        color: newAnswer.trim() ? 'white' : '#6ee7b7',
                        border: 'none', borderRadius: 8,
                        padding: '8px 12px', fontSize: '0.85rem',
                        fontWeight: 800, cursor: newAnswer.trim() ? 'pointer' : 'not-allowed',
                    }}
                >
                    + Adaugă
                </button>
            </div>
            <p style={{ ...styles.emptyText, marginTop: 2 }}>
                Apasă Enter sau butonul + pentru a adăuga. Primul răspuns e cel principal.
            </p>
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
    targetOptionBtn: {
        border: '1.5px solid',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: '0.78rem',
        fontWeight: 700,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'monospace',
    },
    mappingRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 10px',
        background: '#f9fafb',
        borderRadius: 6,
        marginBottom: 4,
    },
    mappingText: {
        fontSize: '0.72rem',
        color: '#374151',
        fontFamily: 'monospace',
    },
    removeMappingBtn: {
        background: '#fee2e2',
        color: '#b91c1c',
        border: 'none',
        borderRadius: 6,
        width: 22,
        height: 22,
        fontSize: '0.7rem',
        cursor: 'pointer',
        flexShrink: 0,
    },
};