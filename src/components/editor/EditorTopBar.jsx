import { useEditor } from '../../store/editorStore.jsx';
import ThemePicker from './ThemePicker';

export default function EditorTopBar({ exerciseName = 'Exercițiu nou', onSave }) {
    const {
        mode, setMode, undo, redo, canUndo, canRedo,
        copy, paste, duplicate, selectedIds,
        snapEnabled, setSnapEnabled,
        layersPanelOpen, setLayersPanelOpen,
        saveDraft, saveStatus, saveMessage,
        submitForReview, draftStatus,
        autoSaveEnabled, setAutoSaveEnabled,
        setFullscreenMode,
    } = useEditor();

    const canSubmitForReview = draftStatus === 'DRAFT';

    return (
        <div style={styles.topBar}>
            <div style={styles.leftGroup}>
                <input
                    type="text"
                    defaultValue={exerciseName}
                    style={styles.nameInput}
                    placeholder="Nume exercițiu"
                />
            </div>

            <div style={styles.actionGroup}>
                <IconBtn onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">↶</IconBtn>
                <IconBtn onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">↷</IconBtn>
                <Divider />
                <IconBtn onClick={copy} disabled={selectedIds.length === 0} title="Copiază (Ctrl+C)">⧉</IconBtn>
                <IconBtn onClick={paste} title="Lipește (Ctrl+V)">⎘</IconBtn>
                <IconBtn onClick={duplicate} disabled={selectedIds.length === 0} title="Duplicat (Ctrl+D)">⎌</IconBtn>
                <Divider />
                <IconBtn
                    onClick={() => setSnapEnabled(!snapEnabled)}
                    title={`Snap la grilă: ${snapEnabled ? 'ON' : 'OFF'}`}
                    style={{
                        background: snapEnabled ? '#4F6BF6' : 'transparent',
                        color: snapEnabled ? 'white' : '#1a1d23',
                    }}
                >
                    ⊞
                </IconBtn>
                <IconBtn
                    onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                    title={`Auto-save: ${autoSaveEnabled ? 'ON (la 30s)' : 'OFF'}`}
                    style={{
                        background: autoSaveEnabled ? '#4F6BF6' : 'transparent',
                        color: autoSaveEnabled ? 'white' : '#1a1d23',
                    }}
                >
                    ⟳
                </IconBtn>
                <IconBtn
                    onClick={() => setFullscreenMode(true)}
                    title="Fullscreen (F11 sau Ctrl+Shift+F)"
                >
                    ⛶
                </IconBtn>
                <Divider />
                <IconBtn
                    onClick={() => setLayersPanelOpen(!layersPanelOpen)}
                    title="Straturi"
                    style={{
                        background: layersPanelOpen ? '#4F6BF6' : 'transparent',
                        color: layersPanelOpen ? 'white' : '#1a1d23',
                    }}
                >
                    ☰
                </IconBtn>
            </div>

            {/* ThemePicker separat, intre actionGroup si modeSwitcher */}
            <ThemePicker />

            <div style={styles.modeSwitcher}>
                {['editor', 'solution', 'preview'].map(m => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        style={{
                            ...styles.modeBtn,
                            ...(mode === m ? styles.modeBtnActive : {}),
                        }}
                    >
                        {m === 'editor' && 'Editor'}
                        {m === 'solution' && 'Soluție'}
                        {m === 'preview' && 'Previzualizare'}
                    </button>
                ))}
            </div>

            {saveMessage && (
                <div style={{
                    ...styles.saveStatus,
                    color: saveStatus === 'error' ? '#dc2626' : saveStatus === 'saved' ? '#059669' : '#6b7280',
                }}>
                    {saveStatus === 'saved' && '✓ '}
                    {saveStatus === 'error' && '✗ '}
                    {saveMessage}
                </div>
            )}

            <div style={styles.rightGroup}>
                <button
                    style={{
                        ...styles.secondaryBtn,
                        opacity: saveStatus === 'saving' ? 0.6 : 1,
                        cursor: saveStatus === 'saving' ? 'wait' : 'pointer',
                    }}
                    onClick={saveDraft}
                    disabled={saveStatus === 'saving'}
                >
                    {saveStatus === 'saving' ? 'Se salveaza...' : 'Salvează draft'}
                </button>
                {canSubmitForReview && (
                    <button
                        style={{
                            ...styles.primaryBtn,
                            opacity: saveStatus === 'saving' ? 0.6 : 1,
                            cursor: saveStatus === 'saving' ? 'wait' : 'pointer',
                        }}
                        onClick={submitForReview}
                        disabled={saveStatus === 'saving'}
                        title="Trimite versiunea curentă spre aprobare"
                    >
                        Trimite spre review
                    </button>
                )}
                {draftStatus === 'PENDING_REVIEW' && (
                    <span style={styles.pendingBadge}>În review</span>
                )}
            </div>
        </div>
    );
}

function IconBtn({ children, onClick, disabled, title, style }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            style={{
                ...styles.iconBtn,
                ...style,
                opacity: disabled ? 0.35 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
            }}
        >
            {children}
        </button>
    );
}

function Divider() {
    return <div style={styles.divider} />;
}

const styles = {
    topBar: {
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        zIndex: 10,
        width: '100%',
        boxSizing: 'border-box',
        flexWrap: 'wrap',
        rowGap: '0.5rem',
    },
    leftGroup: {
        flex: '1 1 12rem',
        minWidth: 0,
    },
    nameInput: {
        border: 'none',
        outline: 'none',
        fontSize: 'clamp(0.9rem, 1.5vw, 1.1rem)',
        fontWeight: 800,
        color: '#1a1d23',
        background: 'transparent',
        padding: '0.375rem 0.5rem',
        borderRadius: 6,
        width: '100%',
        maxWidth: '20rem',
        minWidth: 0,
    },
    actionGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        background: '#f3f4f6',
        borderRadius: 10,
        padding: 4,
        flexShrink: 0,
    },
    iconBtn: {
        background: 'transparent',
        border: 'none',
        padding: '0.375rem 0.5rem',
        borderRadius: 6,
        fontSize: '1rem',
        fontWeight: 700,
        color: '#1a1d23',
        transition: 'all 0.15s',
        lineHeight: 1,
        flexShrink: 0,
        cursor: 'pointer',
    },
    divider: {
        width: 1,
        height: '1.25rem',
        background: '#d1d5db',
        margin: '0 2px',
        flexShrink: 0,
    },
    modeSwitcher: {
        display: 'flex',
        background: '#f3f4f6',
        borderRadius: 12,
        padding: 4,
        gap: 2,
        flexShrink: 0,
    },
    modeBtn: {
        background: 'transparent',
        border: 'none',
        padding: '0.5rem 0.875rem',
        borderRadius: 8,
        fontSize: '0.85rem',
        fontWeight: 700,
        color: '#6b7280',
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
        flexShrink: 0,
    },
    modeBtnActive: {
        background: 'white',
        color: '#1a1d23',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    },
    saveStatus: {
        fontSize: '0.8rem',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        padding: '0 8px',
    },
    rightGroup: {
        display: 'flex',
        gap: '0.5rem',
        marginLeft: 'auto',
        flexShrink: 0,
        alignItems: 'center',
    },
    secondaryBtn: {
        background: 'white',
        border: '1.5px solid #e5e7eb',
        color: '#374151',
        padding: '0.5rem 0.875rem',
        borderRadius: 10,
        fontSize: '0.85rem',
        fontWeight: 700,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
    },
    primaryBtn: {
        background: '#4F6BF6',
        color: 'white',
        border: 'none',
        padding: '0.5rem 1rem',
        borderRadius: 10,
        fontSize: '0.85rem',
        fontWeight: 800,
        cursor: 'pointer',
        boxShadow: '0 2px 0 #3a52c4',
        whiteSpace: 'nowrap',
    },
    pendingBadge: {
        fontSize: '0.75rem',
        fontWeight: 800,
        color: '#b45309',
        background: '#fef3c7',
        padding: '0.4rem 0.75rem',
        borderRadius: 10,
        whiteSpace: 'nowrap',
    },
};