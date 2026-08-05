import { useEditor } from '../../store/editorStore.jsx';
import { ELEMENT_DEFINITIONS } from '../../constants/elementTypes';
import { useState } from 'react';
import AssetLibrary from './AssetLibrary';

export default function EditorToolbar() {
    const { addElement, updateElement } = useEditor();
    const [showLibrary, setShowLibrary] = useState(false);

    const handleInsertAsset = (asset) => {
        addElement('IMAGE', undefined, undefined, {
            src: `http://localhost:8080${asset.url}`
        });
        setShowLibrary(false);
    };

    return (
        <div style={styles.toolbar}>
            <div style={styles.section}>
                <p style={styles.sectionTitle}>Elemente</p>

                {/* Text, Formă, Container — generate direct pe canvas */}
                {ELEMENT_DEFINITIONS.map(tool => (
                    <button
                        key={tool.type}
                        onClick={() => addElement(tool.type)}
                        style={styles.tool}
                    >
                        <span style={styles.toolIcon}>{tool.icon}</span>
                        <span style={styles.toolLabel}>{tool.label}</span>
                    </button>
                ))}

                {/* Imagine — singurul flux pentru fișiere media, prin Asset Library */}
                <button
                    onClick={() => setShowLibrary(true)}
                    style={styles.tool}
                >
                    <span style={styles.toolIcon}>🖼️</span>
                    <span style={styles.toolLabel}>Imagine</span>
                </button>
            </div>

            {showLibrary && (
                <AssetLibrary
                    onInsert={handleInsertAsset}
                    onClose={() => setShowLibrary(false)}
                />
            )}
        </div>
    );
}

const styles = {
    toolbar: {
        width: 90,
        background: 'white',
        borderRight: '1px solid #e5e7eb',
        padding: '16px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        overflowY: 'auto',
    },
    section: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
    },
    sectionTitle: {
        fontSize: '0.65rem',
        fontWeight: 800,
        color: '#9ca3af',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        textAlign: 'center',
        margin: '4px 0 8px 0',
    },
    tool: {
        background: '#f9fafb',
        border: '1.5px solid #f3f4f6',
        borderRadius: 10,
        padding: '12px 6px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        cursor: 'pointer',
        transition: 'all 0.15s',
    },
    toolIcon: {
        fontSize: '1.3rem',
        fontWeight: 800,
        color: '#1a1d23',
    },
    toolLabel: {
        fontSize: '0.7rem',
        fontWeight: 700,
        color: '#6b7280',
    },
};
