import { useEditor } from '../../store/editorStore.jsx';
import { EXERCISE_TYPE_DEFINITIONS, EXERCISE_TYPES, typeHasTargets } from '../../constants/exerciseTypes';
import { useState, useRef } from 'react';
import AssetLibrary from "./AssetLibrary.jsx";


const BASE_URL = 'http://localhost:8080';

export default function SolutionPanel() {
    const {
        settings, updateSettings,
        solution, toggleCorrect, updateSolution,
        selectedElement, selectedIds, elements,
        meta, updateMeta,
        addTarget, updateTarget, removeTarget, reorderTargets, linkElementToTarget,
        addHint, updateHint, removeHint, reorderHints,
    } = useEditor();

    const isDragAndDrop = meta.type === EXERCISE_TYPES.DRAG_AND_DROP;
    const isFindAndSelect = typeHasTargets(meta.type);

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

    const targets = solution.targets || [];

    return (
        <div style={styles.panel}>
            <div style={styles.header}>
                <span style={styles.headerBadge}>SOLUȚIE</span>
                <span style={styles.headerInfo}>
                    {isDragAndDrop
                        ? `${mappingCount} ${mappingCount === 1 ? 'pereche configurată' : 'perechi configurate'}`
                        : isFindAndSelect
                            ? `${targets.length} ${targets.length === 1 ? 'țintă definită' : 'ținte definite'} · ${correctCount} element${correctCount !== 1 ? 'e' : ''} marcat${correctCount !== 1 ? 'e' : ''}`
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
                        <AttemptsInput
                            value={settings.maxAttempts}
                            onChange={(v) => updateSettings({ maxAttempts: v })}
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
                            <option value="showHints">Arată hints</option>
                            <option value="retry">Reîncearcă</option>
                            <option value="next">Următorul exercițiu</option>
                        </select>
                    </Field>
                </Section>

                <Field label="Afișează media grupei">
                    <select
                        value={settings.showGroupAverage ? 'true' : 'false'}
                        onChange={(e) => updateSettings({ showGroupAverage: e.target.value === 'true' })}
                        style={styles.input}
                    >
                        <option value="false">Nu (privat)</option>
                        <option value="true">Da (elevul vede comparația)</option>
                    </select>
                </Field>

                <Section title="Hint-uri structurate">
                    <HintsList
                        hints={settings.hints || []}
                        elements={elements.filter(el => ['HOTSPOT', 'IMAGE', 'SHAPE'].includes(el.type))}
                        onAdd={addHint}
                        onUpdate={updateHint}
                        onRemove={removeHint}
                        onReorder={reorderHints}
                    />
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
                            Adaugă toate variantele de răspuns acceptate.
                        </p>
                        <AlternativeAnswers
                            answers={solution.alternativeAnswers || []}
                            onChange={(answers) => updateSolution({ alternativeAnswers: answers })}
                            type={meta.type}
                        />
                    </Section>
                )}

                {isFindAndSelect && (
                    <Section title="Zona de soluții — Obiecte țintă">
                        <TargetsList
                            targets={targets}
                            elements={elements}
                            solution={solution}
                            selectedElement={selectedElement}
                            onAdd={addTarget}
                            onUpdate={updateTarget}
                            onRemove={removeTarget}
                            onReorder={reorderTargets}
                            onLink={linkElementToTarget}
                            onToggleCorrect={toggleCorrect}
                        />
                    </Section>
                )}

                <Section title="Marcare răspuns">
                    {!isDragAndDrop && !isFindAndSelect && (
                        <>
                            {!selectedElement && selectedIds.length === 0 && (
                                <p style={styles.emptyText}>
                                    Selectează un element din canvas pentru a-l marca ca răspuns corect.
                                </p>
                            )}
                            {!selectedElement && selectedIds.length > 1 && (
                                <p style={styles.emptyText}>
                                    Marcarea funcționează pe un singur element odată.
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
                                        {selectedIsCorrect ? '✗ Demarchează' : '✓ Marchează ca răspuns corect'}
                                    </button>
                                </>
                            )}
                        </>
                    )}

                    {isFindAndSelect && (
                        <div style={styles.infoBox}>
                            <p style={styles.infoText}>
                                💡 Selectează un Hotspot/Image/Shape de pe canvas, apoi apasă
                                <strong> 🎯 Leagă</strong> pe ținta dorită din stânga.
                            </p>
                        </div>
                    )}

                    {isDragAndDrop && (
                        <DragDropMapping
                            selectedElement={selectedElement}
                            draggableElements={draggableElements}
                            targetElements={targetElements}
                            dropMapping={dropMapping}
                            onAssign={assignTarget}
                            onRemove={removeMapping}
                            elements={elements}
                        />
                    )}
                </Section>
            </div>
        </div>
    );
}

function AttemptsInput({ value, onChange }) {
    const isUnlimited = value === null || value === undefined || value === 0;

    return (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <select
                value={isUnlimited ? 'unlimited' : 'custom'}
                onChange={(e) => {
                    if (e.target.value === 'unlimited') {
                        onChange(null);
                    } else {
                        onChange(3);
                    }
                }}
                style={{ ...styles.input, flex: 1 }}
            >
                <option value="unlimited">Nelimitat</option>
                <option value="custom">Limitat</option>
            </select>
            {!isUnlimited && (
                <input
                    type="number"
                    min={1}
                    max={10}
                    value={value}
                    onChange={(e) => {
                        const parsed = parseInt(e.target.value);
                        if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
                            onChange(parsed);
                        }
                    }}
                    style={{ ...styles.input, width: 60, textAlign: 'center' }}
                />
            )}
        </div>
    );
}

function HintsList({ hints, elements, onAdd, onUpdate, onRemove, onReorder }) {
    const dragIndexRef = useRef(null);

    const handleDragStart = (i) => { dragIndexRef.current = i; };
    const handleDragOver = (e, i) => {
        e.preventDefault();
        if (dragIndexRef.current === null || dragIndexRef.current === i) return;
        onReorder(dragIndexRef.current, i);
        dragIndexRef.current = i;
    };
    const handleDragEnd = () => { dragIndexRef.current = null; };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {hints.length === 0 && (
                <div style={styles.emptyTargets}>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#9ca3af', fontStyle: 'italic' }}>
                        Niciun hint. Hint-urile se afișează după 3 clickuri greșite.
                    </p>
                </div>
            )}

            {hints.map((hint, i) => (
                <HintRow
                    key={hint.id}
                    hint={hint}
                    index={i}
                    elements={elements}
                    onUpdate={onUpdate}
                    onRemove={onRemove}
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDragEnd={handleDragEnd}
                />
            ))}

            <button onClick={onAdd} style={styles.addHintBtn}>
                + Adaugă hint
            </button>
        </div>
    );
}

function HintRow({ hint, index, elements, onUpdate, onRemove, onDragStart, onDragOver, onDragEnd }) {
    const needsTarget = hint.type === 'HIGHLIGHT' || hint.type === 'ANIMATION';

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            style={styles.hintRow}
        >
            <div style={styles.hintRowTop}>
                <span style={styles.dragHandle}>⠿</span>
                <span style={styles.targetIndex}>{index + 1}</span>

                <select
                    value={hint.type}
                    onChange={(e) => onUpdate(hint.id, { type: e.target.value, targetElementId: null })}
                    style={styles.hintTypeSelect}
                    onClick={(e) => e.stopPropagation()}
                >
                    <option value="TEXT">💡 Text</option>
                    <option value="HIGHLIGHT">🔦 Evidențiază</option>
                    <option value="ANIMATION">✨ Animație</option>
                </select>

                {needsTarget && (
                    <select
                        value={hint.targetElementId || ''}
                        onChange={(e) => onUpdate(hint.id, { targetElementId: e.target.value || null })}
                        style={styles.hintTargetSelect}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="">— Alege element —</option>
                        {elements.map(el => (
                            <option key={el.id} value={el.id}>
                                {el.type} · {el.id.substring(0, 12)}...
                            </option>
                        ))}
                    </select>
                )}

                <button
                    onClick={() => onRemove(hint.id)}
                    style={styles.removeTargetBtn}
                    title="Șterge hint"
                >✕</button>
            </div>

            <input
                type="text"
                value={hint.text || ''}
                onChange={(e) => onUpdate(hint.id, { text: e.target.value })}
                placeholder={
                    hint.type === 'TEXT' ? 'Text ajutător (ex: Caută pe masă)'
                        : hint.type === 'HIGHLIGHT' ? 'Mesaj opțional (ex: Uită-te la elementul evidențiat)'
                            : 'Mesaj opțional (ex: Vezi ce se mișcă)'
                }
                style={styles.hintTextInput}
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}
function TargetsList({ targets, elements, solution, selectedElement, onAdd, onUpdate, onRemove, onReorder, onLink, onToggleCorrect }) {
    const dragIndexRef = useRef(null);

    const handleDragStart = (i) => { dragIndexRef.current = i; };
    const handleDragOver = (e, i) => {
        e.preventDefault();
        if (dragIndexRef.current === null || dragIndexRef.current === i) return;
        onReorder(dragIndexRef.current, i);
        dragIndexRef.current = i;
    };
    const handleDragEnd = () => { dragIndexRef.current = null; };

    const linkableElements = elements.filter(el =>
        ['HOTSPOT', 'IMAGE', 'SHAPE'].includes(el.type)
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {targets.length === 0 && (
                <div style={styles.emptyTargets}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic' }}>
                        Nicio țintă. Apasă „+ Adaugă țintă".
                    </p>
                </div>
            )}

            {targets.map((target, i) => (
                <TargetRow
                    key={target.id}
                    target={target}
                    index={i}
                    elements={linkableElements}
                    solution={solution}
                    selectedElement={selectedElement}
                    onUpdate={onUpdate}
                    onRemove={onRemove}
                    onLink={onLink}
                    onToggleCorrect={onToggleCorrect}
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDragEnd={handleDragEnd}
                />
            ))}

            <button onClick={onAdd} style={styles.addTargetBtn}>
                + Adaugă țintă
            </button>

            {targets.length > 0 && (
                <p style={{ ...styles.emptyText, marginTop: 4, fontStyle: 'normal' }}>
                    Total elemente corecte legate: {solution.correctElementIds.length}
                </p>
            )}
        </div>
    );
}

function TargetRow({ target, index, elements, solution, selectedElement, onUpdate, onRemove, onLink, onToggleCorrect, onDragStart, onDragOver, onDragEnd }) {
    const [expanded, setExpanded] = useState(false);
    const [assetLibOpen, setAssetLibOpen] = useState(false);

    const linkedCount = target.linkedElementIds?.length || 0;
    const canLinkSelected = selectedElement &&
        ['HOTSPOT', 'IMAGE', 'SHAPE'].includes(selectedElement.type);

    const handleImageSelect = (asset) => {
        onUpdate(target.id, { image: asset.url });
        setAssetLibOpen(false);
    };

    return (
        <>
            <div
                draggable
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
                style={styles.targetRow}
            >

                <div style={styles.targetRowHeader}>
                    <span style={styles.dragHandle} title="Trage pentru reordonare">⠿</span>
                    <span style={styles.targetIndex}>{index + 1}</span>


                    <div
                        onClick={() => setAssetLibOpen(true)}
                        style={styles.imgThumb}
                        title="Click pentru a alege imaginea obiectului"
                    >
                        {target.image ? (
                            <img
                                src={`${BASE_URL}${target.image}`}
                                alt="obiect"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }}
                            />
                        ) : (
                            <span style={styles.imgThumbPlaceholder}>🖼</span>
                        )}
                    </div>


                    <input
                        value={target.label}
                        onChange={(e) => onUpdate(target.id, { label: e.target.value })}
                        placeholder="Nume obiect (ex: Copac)"
                        style={styles.targetLabelInput}
                        onClick={(e) => e.stopPropagation()}
                    />


                    <div style={styles.countBox}>
                        <label style={styles.countLabel}>×</label>
                        <input
                            type="number" min={1} max={99}
                            value={target.count}
                            onChange={(e) => onUpdate(target.id, { count: Math.max(1, parseInt(e.target.value) || 1) })}
                            style={styles.countInput}
                            title="Numărul corect de obiecte"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>


                    <span
                        style={{
                            ...styles.linkedBadge,
                            background: linkedCount > 0 ? '#dbeafe' : '#f3f4f6',
                            color: linkedCount > 0 ? '#1d4ed8' : '#9ca3af',
                        }}
                        title="Elemente canvas legate"
                    >
                        🎯 {linkedCount}
                    </span>

                    <button onClick={() => setExpanded(p => !p)} style={styles.expandBtn}>
                        {expanded ? '▲' : '▼'}
                    </button>
                    <button onClick={() => onRemove(target.id)} style={styles.removeTargetBtn} title="Șterge">
                        ✕
                    </button>
                </div>


                {expanded && (
                    <div style={styles.targetExpandedPanel}>
                        <p style={styles.expandedTitle}>
                            Asociază elemente de pe canvas cu această țintă:
                        </p>

                        {canLinkSelected ? (
                            <button
                                onClick={() => onLink(target.id, selectedElement.id)}
                                style={{
                                    ...styles.linkSelectedBtn,
                                    background: target.linkedElementIds?.includes(selectedElement.id)
                                        ? '#fee2e2' : '#dbeafe',
                                    color: target.linkedElementIds?.includes(selectedElement.id)
                                        ? '#b91c1c' : '#1d4ed8',
                                    borderColor: target.linkedElementIds?.includes(selectedElement.id)
                                        ? '#fca5a5' : '#93c5fd',
                                }}
                            >
                                {target.linkedElementIds?.includes(selectedElement.id)
                                    ? `✕ Dezleagă (${selectedElement.type})`
                                    : `🎯 Leagă elementul selectat (${selectedElement.type})`}
                            </button>
                        ) : (
                            <p style={styles.emptyText}>
                                Selectează un Hotspot, Image sau Shape de pe canvas.
                            </p>
                        )}

                        {(target.linkedElementIds || []).length > 0 && (
                            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <p style={{ ...styles.expandedTitle, marginBottom: 2 }}>Legate:</p>
                                {(target.linkedElementIds || []).map(elId => {
                                    const el = elements.find(e => e.id === elId);
                                    const isCorrect = solution.correctElementIds.includes(elId);
                                    return (
                                        <div key={elId} style={styles.linkedElRow}>
                                            <span style={styles.linkedElType}>
                                                {el ? el.type : 'ȘTERS'}
                                            </span>
                                            <span style={styles.linkedElId}>
                                                {elId.substring(0, 18)}...
                                            </span>
                                            <span style={{
                                                ...styles.correctBadge,
                                                background: isCorrect ? '#dcfce7' : '#fef9c3',
                                                color: isCorrect ? '#15803d' : '#92400e',
                                            }}>
                                                {isCorrect ? '✓ corect' : '— nemarchat'}
                                            </span>
                                            <button
                                                onClick={() => onLink(target.id, elId)}
                                                style={styles.unlinkBtn}
                                                title="Dezleagă"
                                            >✕</button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>


            {assetLibOpen && (
                <AssetLibrary
                    acceptTypes="image"
                    onInsert={handleImageSelect}
                    onClose={() => setAssetLibOpen(false)}
                />
            )}
        </>
    );
}


function DragDropMapping({ selectedElement, draggableElements, targetElements, dropMapping, onAssign, onRemove, elements }) {
    if (draggableElements.length === 0 && targetElements.length === 0) {
        return (
            <div style={styles.infoBox}>
                <p style={styles.infoText}>
                    💡 Setează comportamentul elementelor din canvas:<br />
                    <strong>Properties Panel → tab Comportament</strong><br />
                    → <strong>Drag source</strong> = elementele pe care le trage elevul<br />
                    → <strong>Drop target</strong> = zonele unde le plasează
                </p>
            </div>
        );
    }

    if (draggableElements.length === 0) {
        return <p style={styles.emptyText}>Niciun element „Drag source" pe canvas. Setează comportamentul din Properties Panel.</p>;
    }

    if (targetElements.length === 0) {
        return <p style={styles.emptyText}>Nicio zonă „Drop target" pe canvas. Setează comportamentul din Properties Panel.</p>;
    }

    const getLabel = (el) => {
        if (el.text) return `"${el.text.substring(0, 20)}"`;
        if (el.label) return el.label;
        return `${el.type} (${el.id.substring(3, 10)})`;
    };

    const isDraggableSelected = selectedElement?.behavior === 'draggable';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <div style={styles.infoBox}>
                <p style={{ ...styles.infoText, marginBottom: 0 }}>
                    Selectează un <strong>Drag source</strong> pe canvas, apoi alege zona corectă de mai jos.
                </p>
            </div>

            {isDraggableSelected && (
                <div style={{
                    background: '#f0fdf4', border: '1.5px solid #86efac',
                    borderRadius: 10, padding: '10px 12px',
                }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 800, color: '#15803d', margin: '0 0 8px 0' }}>
                        🖱 Element selectat: <span style={{ fontFamily: 'monospace' }}>{getLabel(selectedElement)}</span>
                    </p>
                    <p style={{ fontSize: '0.72rem', color: '#6b7280', margin: '0 0 8px 0' }}>
                        Alege zona corectă:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                                        textAlign: 'left',
                                        display: 'flex', alignItems: 'center', gap: 8,
                                    }}
                                >
                                    <span style={{
                                        fontSize: '0.65rem', fontWeight: 800,
                                        background: isAssigned ? 'rgba(255,255,255,0.3)' : '#f3f4f6',
                                        color: isAssigned ? 'white' : '#6b7280',
                                        padding: '2px 6px', borderRadius: 4,
                                    }}>
                                        DROP TARGET
                                    </span>
                                    {getLabel(target)}
                                    {isAssigned && <span style={{ marginLeft: 'auto' }}>✓</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {!isDraggableSelected && (
                <p style={{ ...styles.emptyText, padding: '8px 0' }}>
                    Selectează un element „Drag source" pe canvas pentru a-i aloca zona corectă.
                </p>
            )}

            <div>
                <p style={{ ...styles.fieldLabel, marginBottom: 8 }}>
                    Perechi configurate ({Object.keys(dropMapping).length}/{draggableElements.length})
                </p>
                {Object.keys(dropMapping).length === 0 ? (
                    <p style={styles.emptyText}>Nicio pereche configurată încă.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {draggableElements.map(draggable => {
                            const assignedTargetId = dropMapping[draggable.id];
                            const assignedTarget = targetElements.find(t => t.id === assignedTargetId);
                            const isConfigured = !!assignedTargetId;
                            return (
                                <div key={draggable.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '7px 10px',
                                    background: isConfigured ? '#f0fdf4' : '#fef9c3',
                                    border: `1.5px solid ${isConfigured ? '#bbf7d0' : '#fde68a'}`,
                                    borderRadius: 8,
                                }}>
                                    <span style={{
                                        fontSize: '0.7rem', fontWeight: 700,
                                        color: isConfigured ? '#15803d' : '#92400e',
                                        flexShrink: 0,
                                    }}>
                                        {isConfigured ? '✓' : '○'}
                                    </span>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1a1d23', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {getLabel(draggable)}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', flexShrink: 0 }}>→</span>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isConfigured ? '#15803d' : '#9ca3af', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {assignedTarget ? getLabel(assignedTarget) : '(nealocat)'}
                                    </span>
                                    {isConfigured && (
                                        <button
                                            onClick={() => onRemove(draggable.id)}
                                            style={styles.unlinkBtn}
                                            title="Șterge alocarea"
                                        >✕</button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
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

    const removeAnswer = (index) => onChange(answers.filter((_, i) => i !== index));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {answers.length === 0 ? (
                <p style={styles.emptyText}>Niciun răspuns adăugat încă.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {answers.map((ans, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '6px 10px', background: '#f0fdf4',
                            border: '1px solid #bbf7d0', borderRadius: 6,
                        }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534' }}>{ans}</span>
                            <button
                                onClick={() => removeAnswer(i)}
                                style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 4, width: 20, height: 20, fontSize: '0.65rem', cursor: 'pointer' }}
                            >✕</button>
                        </div>
                    ))}
                </div>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
                <input
                    type={type === 'INPUT_NUMERIC' ? 'number' : 'text'}
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAnswer(); } }}
                    placeholder={type === 'INPUT_NUMERIC' ? 'ex: 7' : 'ex: șapte'}
                    style={{ ...styles.input, flex: 1 }}
                />
                <button
                    onClick={addAnswer}
                    disabled={!newAnswer.trim()}
                    style={{
                        background: newAnswer.trim() ? '#059669' : '#d1fae5',
                        color: newAnswer.trim() ? 'white' : '#6ee7b7',
                        border: 'none', borderRadius: 8, padding: '8px 12px',
                        fontSize: '0.85rem', fontWeight: 800,
                        cursor: newAnswer.trim() ? 'pointer' : 'not-allowed',
                    }}
                >+ Adaugă</button>
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
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f3f4f6',
    },
    headerBadge: {
        background: '#059669', color: 'white', padding: '4px 10px',
        borderRadius: 6, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.5px',
    },
    headerInfo: { fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 20,
    },
    section: { display: 'flex', flexDirection: 'column', gap: 10 },
    sectionTitle: {
        fontSize: '0.7rem', fontWeight: 800, color: '#9ca3af',
        letterSpacing: '1px', textTransform: 'uppercase', margin: 0,
    },
    sectionContent: { display: 'flex', flexDirection: 'column', gap: 10 },
    field: { display: 'flex', flexDirection: 'column', gap: 4 },
    fieldLabel: { fontSize: '0.75rem', fontWeight: 700, color: '#374151' },
    input: {
        padding: '8px 10px', border: '1.5px solid #e5e7eb', borderRadius: 8,
        fontSize: '0.85rem', outline: 'none', color: '#1a1d23',
        background: 'white', fontFamily: 'inherit',
    },
    emptyText: { fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic', margin: 0, padding: '12px 0' },


    emptyTargets: {
        border: '1.5px dashed #e5e7eb', borderRadius: 10, padding: '16px', textAlign: 'center',
    },
    targetRow: {
        border: '1.5px solid #e5e7eb', borderRadius: 10,
        background: '#fafafa', overflow: 'hidden', cursor: 'grab',
    },
    targetRowHeader: {
        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px',
    },
    dragHandle: {
        fontSize: '1rem', color: '#d1d5db', cursor: 'grab', flexShrink: 0, userSelect: 'none',
    },
    targetIndex: {
        fontSize: '0.7rem', fontWeight: 900, color: '#9ca3af',
        minWidth: 16, textAlign: 'center', flexShrink: 0,
    },


    imgThumb: {
        width: 40, height: 40, flexShrink: 0,
        border: '1.5px dashed #a5b4fc', borderRadius: 8,
        background: '#eef2ff', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        transition: 'border-color 0.15s',
    },
    imgThumbPlaceholder: {
        fontSize: '1.2rem', userSelect: 'none',
    },

    targetLabelInput: {
        flex: 1, border: '1.5px solid #e5e7eb', borderRadius: 6,
        padding: '5px 8px', fontSize: '0.82rem', fontFamily: 'inherit',
        color: '#1a1d23', background: 'white', outline: 'none', minWidth: 0,
    },
    countBox: { display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 },
    countLabel: { fontSize: '0.75rem', color: '#6b7280', fontWeight: 700 },
    countInput: {
        width: 42, border: '1.5px solid #e5e7eb', borderRadius: 6,
        padding: '5px 4px', fontSize: '0.82rem', textAlign: 'center',
        fontFamily: 'inherit', color: '#1a1d23', outline: 'none',
    },
    linkedBadge: {
        fontSize: '0.7rem', fontWeight: 800, padding: '3px 7px',
        borderRadius: 20, flexShrink: 0, whiteSpace: 'nowrap',
    },
    expandBtn: {
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#9ca3af', fontSize: '0.65rem', padding: '2px 4px', flexShrink: 0,
    },
    removeTargetBtn: {
        background: '#fee2e2', color: '#b91c1c', border: 'none',
        borderRadius: 6, width: 22, height: 22, fontSize: '0.7rem',
        cursor: 'pointer', flexShrink: 0,
    },


    targetExpandedPanel: {
        borderTop: '1px solid #f3f4f6', padding: '10px 12px',
        background: 'white', display: 'flex', flexDirection: 'column', gap: 8,
    },
    expandedTitle: { fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', margin: 0 },
    linkSelectedBtn: {
        border: '1.5px solid', borderRadius: 8,
        padding: '7px 12px', fontSize: '0.78rem', fontWeight: 700,
        cursor: 'pointer', textAlign: 'left',
    },
    linkedElRow: {
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 8px', background: '#f9fafb',
        borderRadius: 6, border: '1px solid #f3f4f6',
    },
    linkedElType: {
        fontSize: '0.68rem', fontWeight: 800, color: '#4F6BF6',
        background: '#eef2ff', padding: '2px 5px', borderRadius: 4, flexShrink: 0,
    },
    linkedElId: {
        fontSize: '0.68rem', color: '#9ca3af', fontFamily: 'monospace', flex: 1, minWidth: 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    },
    correctBadge: {
        fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px',
        borderRadius: 10, flexShrink: 0,
    },
    unlinkBtn: {
        background: '#fee2e2', color: '#b91c1c', border: 'none',
        borderRadius: 4, width: 18, height: 18, fontSize: '0.6rem',
        cursor: 'pointer', flexShrink: 0,
    },


    infoBox: {
        background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 8, padding: '10px 12px',
    },
    infoText: { fontSize: '0.78rem', color: '#1d4ed8', margin: 0, lineHeight: 1.5 },


    addTargetBtn: {
        background: '#f0fdf4', border: '1.5px dashed #86efac',
        borderRadius: 8, padding: '8px 14px',
        fontSize: '0.82rem', fontWeight: 700, color: '#15803d',
        cursor: 'pointer', textAlign: 'center',
    },
    selectedInfo: {
        display: 'flex', flexDirection: 'column', gap: 4,
        padding: '8px 10px', background: '#f9fafb',
        borderRadius: 8, border: '1px solid #f3f4f6',
    },
    selectedType: { fontSize: '0.75rem', fontWeight: 800, color: '#4F6BF6' },
    selectedId: { fontSize: '0.7rem', color: '#9ca3af', fontFamily: 'monospace' },
    markBtn: {
        color: 'white', border: 'none', padding: '10px 14px',
        borderRadius: 8, fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer',
    },
    targetOptionBtn: {
        border: '1.5px solid', borderRadius: 8, padding: '8px 12px',
        fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
        textAlign: 'left', fontFamily: 'monospace',
    },
    mappingRow: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 10px', background: '#f9fafb', borderRadius: 6, marginBottom: 4,
    },
    mappingText: { fontSize: '0.72rem', color: '#374151', fontFamily: 'monospace' },
    removeMappingBtn: {
        background: '#fee2e2', color: '#b91c1c', border: 'none',
        borderRadius: 6, width: 22, height: 22, fontSize: '0.7rem', cursor: 'pointer', flexShrink: 0,
    },

    hintRow: {
        border: '1.5px solid #e5e7eb', borderRadius: 10,
        background: '#fafafa', padding: 8, cursor: 'grab',
        display: 'flex', flexDirection: 'column', gap: 6,
    },
    hintRowTop: {
        display: 'flex', alignItems: 'center', gap: 6,
    },
    hintTypeSelect: {
        border: '1.5px solid #e5e7eb', borderRadius: 6,
        padding: '5px 8px', fontSize: '0.78rem', fontWeight: 700,
        color: '#1a1d23', background: 'white', outline: 'none',
        flexShrink: 0,
    },
    hintTargetSelect: {
        flex: 1, border: '1.5px solid #e5e7eb', borderRadius: 6,
        padding: '5px 8px', fontSize: '0.76rem', color: '#1a1d23',
        background: 'white', outline: 'none', minWidth: 0,
        fontFamily: 'monospace',
    },
    hintTextInput: {
        border: '1.5px solid #e5e7eb', borderRadius: 6,
        padding: '5px 8px', fontSize: '0.8rem', fontFamily: 'inherit',
        color: '#1a1d23', background: 'white', outline: 'none',
    },
    addHintBtn: {
        background: '#fffbeb', border: '1.5px dashed #fbbf24',
        borderRadius: 8, padding: '8px 14px',
        fontSize: '0.82rem', fontWeight: 700, color: '#92400e',
        cursor: 'pointer', textAlign: 'center',
    },
};
