import { useState } from 'react';
import { useEditor } from '../../store/editorStore.jsx';

export default function GridTableProperties({ element }) {
    const { updateElement } = useEditor();
    const [selectedCell, setSelectedCell] = useState(null);

    const cellContent = element.cellContent || {};
    const cellTypes = element.cellTypes || {};
    const cellInputTypes = element.cellInputTypes || {};

    const gap = element.gap || 0;
    const totalGapW = gap * (element.cols - 1);
    const totalGapH = gap * (element.rows - 1);
    const cellW = Math.floor((element.width - totalGapW) / element.cols);
    const cellH = Math.floor((element.height - totalGapH) / element.rows);

    const PREVIEW_MAX = 420;
    const previewScale = Math.min(1, PREVIEW_MAX / element.width);
    const previewCellW = cellW * previewScale;
    const previewCellH = cellH * previewScale;
    const previewGap = gap * previewScale;

    const handleCellClick = (key) => {
        setSelectedCell(selectedCell === key ? null : key);
    };

    const setCellContent = (key, text) => {
        updateElement(element.id, {
            cellContent: { ...cellContent, [key]: text },
        });
    };

    const setCellType = (key, type) => {
        const next = { ...cellTypes };
        if (type === 'static') delete next[key];
        else next[key] = type;
        updateElement(element.id, { cellTypes: next });
    };

    const setCellInputType = (key, inputType) => {
        const next = { ...cellInputTypes };
        if (inputType === 'text') delete next[key];
        else next[key] = inputType;
        updateElement(element.id, { cellInputTypes: next });
    };

    const addRow = () => updateElement(element.id, { rows: element.rows + 1 });
    const removeRow = () => { if (element.rows > 1) updateElement(element.id, { rows: element.rows - 1 }); };
    const addCol = () => updateElement(element.id, { cols: element.cols + 1 });
    const removeCol = () => { if (element.cols > 1) updateElement(element.id, { cols: element.cols - 1 }); };

    const sel = selectedCell;
    const selIsInput = sel && cellTypes[sel] === 'input';
    const selInputType = sel ? (cellInputTypes[sel] || 'text') : 'text';
    const selText = sel ? (cellContent[sel] || '') : '';

    return (
        <div style={styles.wrap}>
            <p style={styles.sectionLabel}>STRUCTURĂ TABEL</p>

            <div style={styles.dimRow}>
                <div style={styles.dimGroup}>
                    <span style={styles.dimLabel}>Rânduri</span>
                    <div style={styles.dimControls}>
                        <button onClick={removeRow} style={styles.dimBtn} disabled={element.rows <= 1}>−</button>
                        <span style={styles.dimValue}>{element.rows}</span>
                        <button onClick={addRow} style={styles.dimBtn}>+</button>
                    </div>
                </div>
                <div style={styles.dimGroup}>
                    <span style={styles.dimLabel}>Coloane</span>
                    <div style={styles.dimControls}>
                        <button onClick={removeCol} style={styles.dimBtn} disabled={element.cols <= 1}>−</button>
                        <span style={styles.dimValue}>{element.cols}</span>
                        <button onClick={addCol} style={styles.dimBtn}>+</button>
                    </div>
                </div>
            </div>

            <p style={{ ...styles.sectionLabel, marginTop: 12 }}>CELULE</p>
            <p style={styles.hint}>Click pe o celulă pentru a-i edita conținutul sau tipul.</p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${element.cols}, ${previewCellW}px)`,
                gap: `${previewGap}px`,
                width: element.cols * previewCellW + (element.cols - 1) * previewGap,
                maxWidth: '100%',
                overflowX: 'auto',
                margin: '8px 0',
            }}>
                {Array.from({ length: element.rows }, (_, r) =>
                    Array.from({ length: element.cols }, (_, c) => {
                        const key = `${r}_${c}`;
                        const isInput = cellTypes[key] === 'input';
                        const text = cellContent[key] || '';
                        const isHeader = r === 0 || c === 0;
                        const isSel = selectedCell === key;
                        return (
                            <div
                                key={key}
                                onClick={() => handleCellClick(key)}
                                title={`Celulă (${r + 1}, ${c + 1})`}
                                style={{
                                    width: previewCellW,
                                    height: previewCellH,
                                    background: isSel ? '#ddd6fe' : isInput ? '#eff6ff' : isHeader ? '#e0e7ff' : '#ffffff',
                                    border: isSel ? '2px solid #7c3aed' : '1.5px solid #c7d2fe',
                                    borderRadius: 3,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: Math.max(8, 11 * previewScale),
                                    fontWeight: isHeader ? 700 : 400,
                                    color: isInput ? '#818cf8' : '#1e1b4b',
                                    overflow: 'hidden',
                                    userSelect: 'none',
                                    boxSizing: 'border-box',
                                    padding: 2,
                                    textAlign: 'center',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {isInput ? '[ ? ]' : (text || '—')}
                            </div>
                        );
                    })
                )}
            </div>

            {sel && (
                <div style={styles.cellEditor}>
                    <p style={styles.cellEditorTitle}>
                        Celulă ({parseInt(sel.split('_')[0]) + 1}, {parseInt(sel.split('_')[1]) + 1})
                    </p>

                    <div style={styles.field}>
                        <label style={styles.label}>Tip celulă</label>
                        <div style={styles.typeToggle}>
                            <button
                                onClick={() => setCellType(sel, 'static')}
                                style={{
                                    ...styles.typeBtn,
                                    background: !selIsInput ? '#4f46e5' : '#f3f4f6',
                                    color: !selIsInput ? 'white' : '#374151',
                                }}
                            >
                                Static (text fix)
                            </button>
                            <button
                                onClick={() => setCellType(sel, 'input')}
                                style={{
                                    ...styles.typeBtn,
                                    background: selIsInput ? '#818cf8' : '#f3f4f6',
                                    color: selIsInput ? 'white' : '#374151',
                                }}
                            >
                                Input (de completat)
                            </button>
                        </div>
                    </div>

                    {!selIsInput && (
                        <div style={styles.field}>
                            <label style={styles.label}>Text celulă</label>
                            <input
                                type="text"
                                value={selText}
                                onChange={e => setCellContent(sel, e.target.value)}
                                placeholder="ex: Luni, Produse, 42..."
                                style={styles.input}
                            />
                        </div>
                    )}

                    {selIsInput && (
                        <div style={styles.field}>
                            <label style={styles.label}>Tip input</label>
                            <select
                                value={selInputType}
                                onChange={e => setCellInputType(sel, e.target.value)}
                                style={styles.input}
                            >
                                <option value="text">Text</option>
                                <option value="numeric">Numeric</option>
                            </select>
                        </div>
                    )}
                </div>
            )}

            {!sel && (
                <div style={styles.legend}>
                    <div style={styles.legendItem}>
                        <div style={{ ...styles.legendSwatch, background: '#e0e7ff' }} />
                        <span>Antet (rând/coloană 1)</span>
                    </div>
                    <div style={styles.legendItem}>
                        <div style={{ ...styles.legendSwatch, background: '#ffffff', border: '1.5px solid #c7d2fe' }} />
                        <span>Static</span>
                    </div>
                    <div style={styles.legendItem}>
                        <div style={{ ...styles.legendSwatch, background: '#eff6ff' }} />
                        <span>Input (elev completează)</span>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    wrap: { display: 'flex', flexDirection: 'column', gap: 6 },
    sectionLabel: { fontSize: '0.65rem', fontWeight: 800, color: '#9ca3af', letterSpacing: '0.8px', textTransform: 'uppercase', margin: 0 },
    hint: { fontSize: '0.75rem', color: '#6b7280', margin: 0 },
    dimRow: { display: 'flex', gap: 12 },
    dimGroup: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
    dimLabel: { fontSize: '0.75rem', fontWeight: 700, color: '#374151' },
    dimControls: { display: 'flex', alignItems: 'center', gap: 8 },
    dimBtn: {
        width: 28, height: 28, border: '1.5px solid #e5e7eb', borderRadius: 6,
        background: 'white', cursor: 'pointer', fontSize: '1rem', fontWeight: 800,
        color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center',
        lineHeight: 1,
    },
    dimValue: { fontSize: '0.9rem', fontWeight: 800, color: '#1a1d23', minWidth: 20, textAlign: 'center' },
    cellEditor: {
        background: '#faf5ff', border: '1.5px solid #d8b4fe', borderRadius: 10,
        padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8,
    },
    cellEditorTitle: { fontSize: '0.75rem', fontWeight: 800, color: '#6d28d9', margin: 0 },
    field: { display: 'flex', flexDirection: 'column', gap: 4 },
    label: { fontSize: '0.72rem', fontWeight: 700, color: '#374151' },
    input: {
        padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: 7,
        fontSize: '0.83rem', color: '#1a1d23', fontFamily: 'inherit', outline: 'none',
        background: 'white',
    },
    typeToggle: { display: 'flex', gap: 4 },
    typeBtn: {
        flex: 1, padding: '6px 8px', border: 'none', borderRadius: 7,
        fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
    },
    legend: { display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 },
    legendItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.73rem', color: '#6b7280' },
    legendSwatch: { width: 14, height: 14, borderRadius: 3, flexShrink: 0 },
};
