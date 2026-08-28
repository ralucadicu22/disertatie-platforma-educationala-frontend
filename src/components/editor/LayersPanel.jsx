import { useState } from 'react';
import { useEditor } from '../../store/editorStore.jsx';

export default function LayersPanel() {
    const {
        elements, selectedIds, selectOne, toggleSelection,
        layersPanelOpen, setLayersPanelOpen,
        bringToFront, sendToBack, bringForward, sendBackward,
        toggleLock, toggleHidden,
        reparentElement,
    } = useEditor();

    const [dragOverId, setDragOverId] = useState(null);
    const [dragOverZone, setDragOverZone] = useState(null); // 'before' | 'inside' | 'after'

    if (!layersPanelOpen) return null;

    const getChildrenReversed = (parentId) =>
        elements
            .filter(el => (el.parentId || null) === parentId)
            .reverse();

    const handleDragStart = (e, elementId) => {
        e.dataTransfer.setData('elementId', elementId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOverRow = (e, targetEl) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';

        const rect = e.currentTarget.getBoundingClientRect();
        const relY = e.clientY - rect.top;
        const height = rect.height;

        setDragOverId(targetEl.id);

        const isBox = targetEl.type === 'BOX';
        if (isBox) {
            if (relY < height * 0.3) setDragOverZone('before');
            else if (relY > height * 0.7) setDragOverZone('after');
            else setDragOverZone('inside');
        } else {
            if (relY < height * 0.5) setDragOverZone('before');
            else setDragOverZone('after');
        }
    };

    const handleDragLeaveRow = () => {
        setDragOverId(null);
        setDragOverZone(null);
    };

    const handleDropRow = (e, targetEl) => {
        e.preventDefault();
        e.stopPropagation();
        const draggedId = e.dataTransfer.getData('elementId');
        if (!draggedId || draggedId === targetEl.id) {
            setDragOverId(null);
            setDragOverZone(null);
            return;
        }

        const zone = dragOverZone;
        setDragOverId(null);
        setDragOverZone(null);

        if (zone === 'inside' && targetEl.type === 'BOX') {

            reparentElement(draggedId, targetEl.id);
        } else {

            reparentElement(draggedId, targetEl.parentId || null, targetEl.id);
        }
    };

    const handleDropTopLevel = (e) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('elementId');
        setDragOverId(null);
        setDragOverZone(null);
        if (!draggedId) return;
        reparentElement(draggedId, null);
    };

    const renderRows = (parentId, depth) => {
        const children = getChildrenReversed(parentId);
        return children.map(el => {
            const isSelected = selectedIds.includes(el.id);
            const isBox = el.type === 'BOX';
            const isDragOver = dragOverId === el.id;

            let dropIndicator = null;
            if (isDragOver) {
                if (dragOverZone === 'before') {
                    dropIndicator = { top: 0 };
                } else if (dragOverZone === 'after') {
                    dropIndicator = { bottom: 0 };
                }
            }

            return (
                <div key={el.id} style={{ position: 'relative' }}>
                    {dropIndicator && (
                        <div style={{
                            position: 'absolute',
                            left: 10 + depth * 16,
                            right: 10,
                            height: 2,
                            background: '#4F6BF6',
                            borderRadius: 2,
                            zIndex: 2,
                            ...dropIndicator,
                        }} />
                    )}

                    <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, el.id)}
                        onDragOver={(e) => handleDragOverRow(e, el)}
                        onDragLeave={handleDragLeaveRow}
                        onDrop={(e) => handleDropRow(e, el)}
                        onClick={(e) => {
                            if (e.shiftKey) {
                                toggleSelection(el.id);
                            } else {
                                selectOne(el.id);
                            }
                        }}
                        style={{
                            ...styles.row,
                            paddingLeft: 10 + depth * 16,
                            ...(isSelected ? styles.rowSelected : {}),
                            ...(el.hidden ? styles.rowHidden : {}),
                            ...(isDragOver && dragOverZone === 'inside' ? styles.rowDropInside : {}),
                        }}
                    >
                        <span style={styles.dragHandle}>⋮⋮</span>
                        <span style={styles.icon}>{getIcon(el)}</span>
                        <span style={styles.name}>{getName(el)}</span>

                        <div style={styles.actions}>
                            <IconBtn
                                onClick={(e) => { e.stopPropagation(); toggleHidden(el.id); }}
                                title={el.hidden ? 'Afișează' : 'Ascunde'}
                                active={el.hidden}
                            >
                                {el.hidden ? '⊘' : '◉'}
                            </IconBtn>
                            <IconBtn
                                onClick={(e) => { e.stopPropagation(); toggleLock(el.id); }}
                                title={el.locked ? 'Deblochează' : 'Blochează'}
                                active={el.locked}
                            >
                                {el.locked ? '🔒' : '🔓'}
                            </IconBtn>
                        </div>
                    </div>

                    {isBox && renderRows(el.id, depth + 1)}
                </div>
            );
        });
    };

    return (
        <div style={styles.panel}>
            <div style={styles.header}>
                <span style={styles.title}>Straturi</span>
                <button
                    onClick={() => setLayersPanelOpen(false)}
                    style={styles.closeBtn}
                    title="Închide"
                >
                    ✕
                </button>
            </div>

            {elements.length === 0 && (
                <p style={styles.empty}>
                    Niciun element pe canvas.
                </p>
            )}

            <div
                style={styles.list}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropTopLevel}
            >
                {renderRows(null, 0)}
                {/* Spatiu jos in care poti da drop ca sa scoti un element din Box */}
                <div style={styles.dropZoneBottom}>
                    Trage aici ca să scoți din container
                </div>
            </div>

            {selectedIds.length === 1 && (
                <div style={styles.footer}>
                    <button style={styles.footerBtn} onClick={() => bringToFront(selectedIds[0])}>
                        Adu în față
                    </button>
                    <button style={styles.footerBtn} onClick={() => bringForward(selectedIds[0])}>
                        Un pas în față
                    </button>
                    <button style={styles.footerBtn} onClick={() => sendBackward(selectedIds[0])}>
                        Un pas în spate
                    </button>
                    <button style={styles.footerBtn} onClick={() => sendToBack(selectedIds[0])}>
                        Trimite în spate
                    </button>
                </div>
            )}
        </div>
    );
}

function IconBtn({ children, onClick, title, active }) {
    return (
        <button
            onClick={onClick}
            title={title}
            style={{
                background: active ? '#eef2ff' : 'transparent',
                border: 'none',
                width: 26,
                height: 26,
                borderRadius: 6,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: active ? '#4F6BF6' : '#6b7280',
            }}
        >
            {children}
        </button>
    );
}

function getIcon(el) {
    switch (el.type) {
        case 'TEXT': return 'T';
        case 'IMAGE': return '🖼';
        case 'SHAPE':
            switch (el.shapeType) {
                case 'circle': return '◯';
                case 'line': return '─';
                case 'polygon': return '⬢';
                default: return '▭';
            }
        case 'BOX': return '▢';
        default: return '?';
    }
}

function getName(el) {
    if (el.type === 'TEXT') return el.text?.slice(0, 24) || 'Text gol';
    if (el.type === 'IMAGE') return el.src ? 'Imagine' : 'Placeholder imagine';
    if (el.type === 'SHAPE') return `Formă (${el.shapeType})`;
    if (el.type === 'BOX') return el.role ? `Zonă: ${el.role}` : 'Container';
    return el.type;
}

const styles = {
    panel: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 280,
        background: 'white',
        borderLeft: '1px solid #e5e7eb',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
        animation: 'slideIn 0.2s ease',
    },
    header: {
        padding: '14px 18px',
        borderBottom: '1px solid #f3f4f6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: '0.85rem',
        fontWeight: 800,
        color: '#1a1d23',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
    },
    closeBtn: {
        background: 'transparent',
        border: 'none',
        fontSize: '1rem',
        cursor: 'pointer',
        color: '#9ca3af',
        padding: 4,
        borderRadius: 4,
    },
    list: {
        flex: 1,
        overflowY: 'auto',
        padding: '8px 8px',
    },
    empty: {
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: '0.8rem',
        padding: 20,
        margin: 0,
    },
    row: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        borderRadius: 8,
        cursor: 'pointer',
        transition: 'background 0.15s',
    },
    rowSelected: {
        background: '#eef2ff',
        border: '1px solid #4F6BF6',
    },
    rowHidden: {
        opacity: 0.4,
    },
    rowDropInside: {
        background: '#dbeafe',
        outline: '2px dashed #4F6BF6',
        outlineOffset: -2,
    },
    dragHandle: {
        color: '#d1d5db',
        cursor: 'grab',
        fontSize: '0.85rem',
        userSelect: 'none',
    },
    icon: {
        width: 22,
        height: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: '0.85rem',
        color: '#1a1d23',
    },
    name: {
        flex: 1,
        fontSize: '0.82rem',
        fontWeight: 600,
        color: '#1a1d23',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    actions: {
        display: 'flex',
        gap: 2,
    },
    dropZoneBottom: {
        marginTop: 12,
        padding: '14px 10px',
        border: '1.5px dashed #e5e7eb',
        borderRadius: 8,
        textAlign: 'center',
        fontSize: '0.72rem',
        color: '#9ca3af',
        fontWeight: 600,
        fontStyle: 'italic',
    },
    footer: {
        borderTop: '1px solid #f3f4f6',
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
    },
    footerBtn: {
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        padding: '7px 12px',
        fontSize: '0.8rem',
        fontWeight: 700,
        color: '#1a1d23',
        cursor: 'pointer',
        textAlign: 'left',
    },
};