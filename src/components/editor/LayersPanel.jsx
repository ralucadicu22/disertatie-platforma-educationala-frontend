import { useEditor } from '../../store/editorStore.jsx';

export default function LayersPanel() {
    const {
        elements, selectedIds, selectOne, toggleSelection,
        layersPanelOpen, setLayersPanelOpen,
        reorderElement, bringToFront, sendToBack, bringForward, sendBackward,
        toggleLock, toggleHidden, deleteElement,
    } = useEditor();

    if (!layersPanelOpen) return null;

    const orderedElements = [...elements].reverse();

    const handleDragStart = (e, index) => {
        e.dataTransfer.setData('fromIndex', index.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, toIndex) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('fromIndex'));
        if (isNaN(fromIndex) || fromIndex === toIndex) return;
        // Convertim înapoi din ordine inversă
        const realFromIndex = elements.length - 1 - fromIndex;
        const realToIndex = elements.length - 1 - toIndex;
        reorderElement(realFromIndex, realToIndex);
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

            {orderedElements.length === 0 && (
                <p style={styles.empty}>
                    Niciun element pe canvas.
                </p>
            )}

            <div style={styles.list}>
                {orderedElements.map((el, index) => {
                    const isSelected = selectedIds.includes(el.id);
                    return (
                        <div
                            key={el.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                            onClick={(e) => {
                                if (e.shiftKey) {
                                    toggleSelection(el.id);
                                } else {
                                    selectOne(el.id);
                                }
                            }}
                            style={{
                                ...styles.row,
                                ...(isSelected ? styles.rowSelected : {}),
                                ...(el.hidden ? styles.rowHidden : {}),
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
                    );
                })}
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
        default: return '?';
    }
}

function getName(el) {
    if (el.type === 'TEXT') return el.text?.slice(0, 24) || 'Text gol';
    if (el.type === 'IMAGE') return el.src ? 'Imagine' : 'Placeholder imagine';
    if (el.type === 'SHAPE') return `Formă (${el.shapeType})`;
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