import { useState, useRef, useEffect } from 'react';
import { THEMES } from '../../constants/themes';
import { useEditor } from '../../store/editorStore.jsx';

export default function ThemePicker() {
    const { meta, updateMeta, updateCanvas } = useEditor();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const currentThemeId = meta.themeId || 'formal';
    const currentTheme = THEMES[currentThemeId];

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (themeId) => {
        const theme = THEMES[themeId];
        updateMeta({ themeId });
        updateCanvas({ background: theme.canvas.background });
        setOpen(false);
    };

    return (
        <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
            <button
                onClick={() => setOpen(prev => !prev)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#f3f4f6',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: 8,
                    padding: '5px 10px',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#374151',
                }}
            >
                <Swatches theme={currentTheme} />
                {currentTheme.label}
                <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>▼</span>
            </button>

            {open && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    background: 'white',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    padding: 6,
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    minWidth: 140,
                }}>
                    {Object.values(THEMES).map(theme => (
                        <button
                            key={theme.id}
                            onClick={() => handleSelect(theme.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '7px 10px',
                                borderRadius: 7,
                                border: 'none',
                                background: currentThemeId === theme.id ? '#eef2ff' : 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                color: currentThemeId === theme.id ? '#4F6BF6' : '#374151',
                                textAlign: 'left',
                                width: '100%',
                            }}
                        >
                            <Swatches theme={theme} />
                            {theme.label}
                            {currentThemeId === theme.id && (
                                <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>✓</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function Swatches({ theme }) {
    return (
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: theme.canvas.background, border: '1px solid #e5e7eb' }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, background: theme.colors.primary }} />
            <div style={{ width: 10, height: 10, borderRadius: 3, background: theme.colors.accent }} />
        </div>
    );
}