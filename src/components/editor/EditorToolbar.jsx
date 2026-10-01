import { useEditor } from '../../store/editorStore.jsx';
import { ELEMENT_TYPES } from '../../constants/elementTypes';
import { useState } from 'react';
import AssetLibrary from './AssetLibrary';

export default function EditorToolbar() {
    const { addElement, addElementWithProps } = useEditor();
    const [libraryConfig, setLibraryConfig] = useState(null);

    const openLibraryFor = (targetType) => {
        const accept = targetType === ELEMENT_TYPES.VIDEO
            ? 'video'
            : targetType === ELEMENT_TYPES.PDF
                ? 'pdf'
                : 'image';
        setLibraryConfig({ accept, targetType });
    };

    const handleLibraryInsert = (asset) => {
        if (!libraryConfig) return;
        addElementWithProps(libraryConfig.targetType, {
            src: `http://localhost:8080${asset.url}`,
        });
        setLibraryConfig(null);
    };

    return (
        <div style={styles.toolbar}>
            <div style={styles.section}>
                <p style={styles.sectionTitle}>Elemente</p>

                <button onClick={() => addElement(ELEMENT_TYPES.TEXT)} style={styles.tool}>
                    <span style={styles.toolIcon}>T</span>
                    <span style={styles.toolLabel}>Text</span>
                </button>

                <button onClick={() => openLibraryFor(ELEMENT_TYPES.IMAGE)} style={styles.tool}>
                    <span style={styles.toolIcon}>🖼</span>
                    <span style={styles.toolLabel}>Imagine</span>
                </button>

                <button onClick={() => openLibraryFor(ELEMENT_TYPES.VIDEO)} style={styles.tool}>
                    <span style={styles.toolIcon}>▶</span>
                    <span style={styles.toolLabel}>Video</span>
                </button>

                <button onClick={() => addElement(ELEMENT_TYPES.SHAPE)} style={styles.tool}>
                    <span style={styles.toolIcon}>◼</span>
                    <span style={styles.toolLabel}>Formă</span>
                </button>

                <button onClick={() => addElement(ELEMENT_TYPES.HOTSPOT)} style={styles.tool}>
                    <span style={styles.toolIcon}>🎯</span>
                    <span style={styles.toolLabel}>Hotspot</span>
                </button>

                <button onClick={() => addElement(ELEMENT_TYPES.BOX)} style={styles.tool}>
                    <span style={styles.toolIcon}>▢</span>
                    <span style={styles.toolLabel}>Container</span>
                </button>

                <button onClick={() => addElement(ELEMENT_TYPES.GRID)} style={styles.tool}>
                    <span style={styles.toolIcon}>⊞</span>
                    <span style={styles.toolLabel}>Grid</span>
                </button>

                <button onClick={() => openLibraryFor(ELEMENT_TYPES.PDF)} style={styles.tool}>
                    <span style={styles.toolIcon}>📄</span>
                    <span style={styles.toolLabel}>PDF</span>
                </button>
            </div>

            {libraryConfig && (
                <AssetLibrary
                    acceptTypes={libraryConfig.accept}
                    onInsert={handleLibraryInsert}
                    onClose={() => setLibraryConfig(null)}
                />
            )}
        </div>
    );
}

const styles = {
    toolbar: {
        width: 90, background: 'white', borderRight: '1px solid #e5e7eb',
        padding: '16px 8px', display: 'flex', flexDirection: 'column',
        gap: 12, overflowY: 'auto',
    },
    section: { display: 'flex', flexDirection: 'column', gap: 6 },
    sectionTitle: {
        fontSize: '0.65rem', fontWeight: 800, color: '#9ca3af',
        letterSpacing: '1px', textTransform: 'uppercase',
        textAlign: 'center', margin: '4px 0 8px 0',
    },
    tool: {
        background: '#f9fafb', border: '1.5px solid #f3f4f6',
        borderRadius: 10, padding: '12px 6px', display: 'flex',
        flexDirection: 'column', alignItems: 'center', gap: 4,
        cursor: 'pointer', transition: 'all 0.15s',
    },
    toolIcon: { fontSize: '1.3rem', fontWeight: 800, color: '#1a1d23' },
    toolLabel: { fontSize: '0.7rem', fontWeight: 700, color: '#6b7280' },
};