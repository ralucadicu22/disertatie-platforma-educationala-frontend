import { useRef, useState } from 'react';
import { useEditor } from '../../store/editorStore.jsx';
import AssetLibrary from './AssetLibrary';

const FONT_FAMILIES = ['Nunito', 'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Comic Sans MS'];

export default function EditorPropertiesPanel() {
    const {
        selectedElement, updateElement, deleteElement, deleteSelected,
        selectedIds, alignElements, distributeElements,
        canvas, updateCanvas,elements
    } = useEditor();
    const fileInputRef = useRef(null);
    const bgFileInputRef = useRef(null);

    const [libraryConfig, setLibraryConfig] = useState(null); // { accept, onPick }

    const openLibrary = (accept, onPick) => {
        setLibraryConfig({ accept, onPick });
    };

    const handleLibraryInsert = (asset) => {
        if (libraryConfig?.onPick) libraryConfig.onPick(asset);
        setLibraryConfig(null);
    };

    const handleBgFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => updateCanvas({ backgroundImage: evt.target.result });
        reader.readAsDataURL(file);
    };


    if (selectedIds.length > 1) {
        return (
            <div style={styles.panel}>
                <div style={styles.header}>
                    <span style={styles.elementType}>{selectedIds.length} elemente selectate</span>
                    <button onClick={deleteSelected} style={styles.deleteBtn}>
                        Șterge toate
                    </button>
                </div>
                <div style={styles.tabs}>
                    <Tab title="Aliniere orizontală">
                        <AlignBtn onClick={() => alignElements('left')}>⫷ Stânga</AlignBtn>
                        <AlignBtn onClick={() => alignElements('center-h')}>⫶ Centru</AlignBtn>
                        <AlignBtn onClick={() => alignElements('right')}>Dreapta ⫸</AlignBtn>
                    </Tab>
                    <Tab title="Aliniere verticală">
                        <AlignBtn onClick={() => alignElements('top')}>⬆ Sus</AlignBtn>
                        <AlignBtn onClick={() => alignElements('middle-v')}>⬌ Mijloc</AlignBtn>
                        <AlignBtn onClick={() => alignElements('bottom')}>Jos ⬇</AlignBtn>
                    </Tab>
                    {selectedIds.length >= 3 && (
                        <Tab title="Distribuie">
                            <AlignBtn onClick={() => distributeElements('horizontal')}>Orizontal</AlignBtn>
                            <AlignBtn onClick={() => distributeElements('vertical')}>Vertical</AlignBtn>
                        </Tab>
                    )}
                </div>
            </div>
        );
    }


    if (!selectedElement) {
        return (
            <div style={styles.panel}>
                <div style={styles.header}>
                    <span style={styles.elementType}>CANVAS</span>
                </div>
                <p style={{ ...styles.emptyMsg, margin: '0 0 12px 0' }}>
                    Niciun element selectat — modifici proprietățile canvasului întreg.
                </p>
                <div style={styles.tabs}>
                    <Tab title="Dimensiuni">
                        <NumField label="Lățime" value={canvas.width} onChange={v => updateCanvas({ width: v })} />
                        <NumField label="Înălțime" value={canvas.height} onChange={v => updateCanvas({ height: v })} />
                    </Tab>

                    <Tab title="Fundal">
                        <ColorField
                            label="Culoare"
                            value={canvas.background || '#ffffff'}
                            onChange={v => updateCanvas({ background: v })}
                        />
                        <div style={styles.field}>
                            <label style={styles.fieldLabel}>Imagine</label>
                            <input
                                ref={bgFileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleBgFileSelect}
                                style={{ display: 'none' }}
                            />
                            <button onClick={() => bgFileInputRef.current?.click()} style={styles.uploadBtn}>
                                {canvas.backgroundImage ? 'Schimbă...' : 'Încarcă imagine'}
                            </button>
                        </div>
                        {canvas.backgroundImage && (
                            <button
                                onClick={() => updateCanvas({ backgroundImage: null })}
                                style={{ ...styles.deleteBtn, alignSelf: 'flex-end' }}
                            >
                                Șterge fundal
                            </button>
                        )}
                    </Tab>
                </div>
            </div>
        );
    }


    const el = selectedElement;
    const update = (key, value) => updateElement(el.id, { [key]: value });

    return (
        <div style={styles.panel}>
            <div style={styles.header}>
                <span style={styles.elementType}>{el.type}</span>
                {!((el.type === 'BOX' || el.type === 'GRID') && el.role) && (
                    <button onClick={() => deleteElement(el.id)} style={styles.deleteBtn}>
                        Șterge
                    </button>
                )}
            </div>

            <div style={styles.tabs}>
                <Tab title="Poziționare">
                    <NumField label="X" value={Math.round(el.x)} onChange={v => update('x', v)} />
                    <NumField label="Y" value={Math.round(el.y)} onChange={v => update('y', v)} />
                    <NumField label="Lățime" value={Math.round(el.width)} onChange={v => update('width', v)} />
                    <NumField label="Înălțime" value={Math.round(el.height)} onChange={v => update('height', v)} />
                    <NumField label="Rotație°" value={Math.round(el.rotation || 0)} onChange={v => update('rotation', v)} />
                </Tab>

                {el.type === 'TEXT' && <TextPropertyTabs el={el} update={update} updateElement={updateElement} />}
                {el.type === 'IMAGE' && (
                    <ImagePropertyTabs
                        el={el}
                        update={update}
                        fileInputRef={fileInputRef}
                        onOpenLibrary={openLibrary}
                        elements={elements}
                        updateElement={updateElement}
                    />
                )}
                {el.type === 'SHAPE' && <ShapePropertyTabs el={el} update={update} />}
                {el.type === 'BOX' && <BoxPropertyTabs el={el} update={update} />}
                {el.type === 'GRID' && <GridPropertyTabs el={el} update={update} />}
                {el.type === 'VIDEO' && <VideoPropertyTabs el={el} update={update} onOpenLibrary={openLibrary} />}
                {el.type === 'PDF' && <PdfPropertyTabs el={el} update={update} onOpenLibrary={openLibrary} />}
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


const HEADING_SIZES = { none: null, h1: 48, h2: 36, h3: 28 };
const TEXT_PRESETS = [
    { label: 'Titlu', fontSize: 36, fontStyle: 'bold', fontFamily: 'Nunito', fill: '#1a1d23' },
    { label: 'Subtitlu', fontSize: 24, fontStyle: 'normal', fontFamily: 'Nunito', fill: '#374151' },
    { label: 'Corp', fontSize: 18, fontStyle: 'normal', fontFamily: 'Nunito', fill: '#6b7280' },
    { label: 'Mic', fontSize: 14, fontStyle: 'normal', fontFamily: 'Nunito', fill: '#9ca3af' },
    { label: 'Enunț', fontSize: 22, fontStyle: 'bold', fontFamily: 'Nunito', fill: '#1a1d23' },
];

function TextPropertyTabs({ el, update,updateElement}) {
    const isBold = el.fontStyle?.includes('bold');
    const isItalic = el.fontStyle?.includes('italic');
    const isUnderline = el.textDecoration === 'underline';

    const toggleBold = () => {
        const parts = (el.fontStyle || 'normal').split(' ').filter(p => p !== 'bold' && p !== 'normal');
        if (!isBold) parts.unshift('bold');
        update('fontStyle', parts.length ? parts.join(' ') : 'normal');
    };

    const toggleItalic = () => {
        const parts = (el.fontStyle || 'normal').split(' ').filter(p => p !== 'italic' && p !== 'normal');
        if (!isItalic) parts.push('italic');
        update('fontStyle', parts.length ? parts.join(' ') : 'normal');
    };

    const toggleUnderline = () => update('textDecoration', isUnderline ? '' : 'underline');

    const applyHeading = (level) => {
        const sizeMap = { h1: 48, h2: 36, h3: 28 };
        if (level === 'none') {
            updateElement(el.id, { headingLevel: 'none' });
        } else {
            updateElement(el.id, {
                headingLevel: level,
                fontSize: sizeMap[level],
                fontStyle: 'bold',
            });
        }
    };

    const applyPreset = (preset) => {
        updateElement(el.id, {
            fontSize: preset.fontSize,
            fontStyle: preset.fontStyle,
            fontFamily: preset.fontFamily,
            fill: preset.fill,
        });
    };

    const insertDivider = () => {
        const current = el.text || '';
        update('text', current + '\n─────────────────\n');
    };

    return (
        <>

            <Tab title="Preset stil">
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {TEXT_PRESETS.map(p => (
                        <button
                            key={p.label}
                            onClick={() => applyPreset(p)}
                            style={{
                                background: '#f3f4f6', border: '1.5px solid #e5e7eb',
                                borderRadius: 6, padding: '5px 10px',
                                fontSize: '0.78rem', fontWeight: 700,
                                color: '#374151', cursor: 'pointer',
                            }}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </Tab>

            <Tab title="Text">
                {/* Heading level */}
                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Heading</label>
                    <div style={styles.btnGroup}>
                        {['none', 'h1', 'h2', 'h3'].map(h => (
                            <ToggleBtn
                                key={h}
                                active={(el.headingLevel || 'none') === h}
                                onClick={() => applyHeading(h)}
                            >
                                {h === 'none' ? '—' : h.toUpperCase()}
                            </ToggleBtn>
                        ))}
                    </div>
                </div>

                <SelectField label="Font" value={el.fontFamily} onChange={v => update('fontFamily', v)}
                             options={FONT_FAMILIES.map(f => ({ value: f, label: f }))} width={150} />
                <NumField label="Size" value={el.fontSize} onChange={v => update('fontSize', v)} />

                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Stil</label>
                    <div style={styles.btnGroup}>
                        <ToggleBtn active={isBold} onClick={toggleBold}>B</ToggleBtn>
                        <ToggleBtn active={isItalic} onClick={toggleItalic}>I</ToggleBtn>
                        <ToggleBtn active={isUnderline} onClick={toggleUnderline}>U</ToggleBtn>
                    </div>
                </div>

                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Aliniere</label>
                    <div style={styles.btnGroup}>
                        {['left', 'center', 'right'].map(a => (
                            <ToggleBtn key={a} active={el.align === a} onClick={() => update('align', a)}>
                                {a === 'left' ? '◧' : a === 'center' ? '☰' : '◨'}
                            </ToggleBtn>
                        ))}
                    </div>
                </div>

                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Vertical</label>
                    <div style={styles.btnGroup}>
                        {['top', 'middle', 'bottom'].map(v => (
                            <ToggleBtn key={v} active={el.verticalAlign === v} onClick={() => update('verticalAlign', v)}>
                                {v === 'top' ? '⬆' : v === 'middle' ? '⬌' : '⬇'}
                            </ToggleBtn>
                        ))}
                    </div>
                </div>

                <ColorField label="Culoare scris" value={el.fill} onChange={v => update('fill', v)} />
                <NumField label="Spațiere litere" value={el.letterSpacing} onChange={v => update('letterSpacing', v)} />
                <NumField label="Spațiere rânduri" value={el.lineHeight} onChange={v => update('lineHeight', parseFloat(v) || 1)} step={0.1} />
                <NumField label="Padding" value={el.padding} onChange={v => update('padding', v)} />

                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Indentare</label>
                    <div style={styles.btnGroup}>
                        <button
                            onClick={() => update('indent', Math.max(0, (el.indent || 0) - 1))}
                            style={{ ...styles.fieldInput, width: 32, textAlign: 'center', cursor: 'pointer', padding: '7px 4px' }}
                        >
                            ←
                        </button>
                        <div style={{ ...styles.fieldInput, width: 32, textAlign: 'center' }}>
                            {el.indent || 0}
                        </div>
                        <button
                            onClick={() => update('indent', Math.min(5, (el.indent || 0) + 1))}
                            style={{ ...styles.fieldInput, width: 32, textAlign: 'center', cursor: 'pointer', padding: '7px 4px' }}
                        >
                            →
                        </button>
                    </div>
                </div>

                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Listă</label>
                    <div style={styles.btnGroup}>
                        {[{val:'none',l:'—'},{val:'bullet',l:'•'},{val:'numbered',l:'1.'}].map(opt => (
                            <ToggleBtn key={opt.val} active={el.listStyle === opt.val} onClick={() => update('listStyle', opt.val)}>
                                {opt.l}
                            </ToggleBtn>
                        ))}
                    </div>
                </div>

                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Auto-expand</label>
                    <ToggleBtn
                        active={el.autoExpand === true}
                        onClick={() => update('autoExpand', !el.autoExpand)}
                    >
                        {el.autoExpand ? 'ON' : 'OFF'}
                    </ToggleBtn>
                </div>

                {/* Divider */}
                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Divider</label>
                    <button
                        onClick={insertDivider}
                        style={{
                            ...styles.uploadBtn,
                            background: '#f3f4f6', color: '#374151',
                            fontSize: '0.78rem', padding: '6px 10px',
                        }}
                    >
                        + Inserează linie
                    </button>
                </div>
            </Tab>

            <Tab title="Container">
                <ColorField label="Fundal" value={el.bgFill === 'transparent' ? '#ffffff' : el.bgFill}
                            onChange={v => update('bgFill', v)} allowTransparent
                            isTransparent={el.bgFill === 'transparent'}
                            onTransparent={() => update('bgFill', 'transparent')} />
                <ColorField label="Chenar" value={el.bgStroke === 'transparent' ? '#000000' : el.bgStroke}
                            onChange={v => update('bgStroke', v)} allowTransparent
                            isTransparent={el.bgStroke === 'transparent'}
                            onTransparent={() => update('bgStroke', 'transparent')} />
                <NumField label="Border w." value={el.bgStrokeWidth} onChange={v => update('bgStrokeWidth', v)} />
                <NumField label="Radius" value={el.bgCornerRadius} onChange={v => update('bgCornerRadius', v)} />
            </Tab>

            <Tab title="Umbră">
                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Activ</label>
                    <ToggleBtn active={el.shadowEnabled} onClick={() => update('shadowEnabled', !el.shadowEnabled)}>
                        {el.shadowEnabled ? 'ON' : 'OFF'}
                    </ToggleBtn>
                </div>
                <ColorField label="Culoare" value={el.shadowColor} onChange={v => update('shadowColor', v)} />
                <NumField label="Blur" value={el.shadowBlur} onChange={v => update('shadowBlur', v)} />
                <NumField label="Opacitate" value={el.shadowOpacity} onChange={v => update('shadowOpacity', parseFloat(v) || 0)} step={0.1} />
            </Tab>
        </>
    );
}


function ImagePropertyTabs({ el, update, fileInputRef, onOpenLibrary, elements, updateElement }) {
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => update('src', evt.target.result);
        reader.readAsDataURL(file);
    };

    const fillParentZone = () => {
        if (!el.parentId) return;
        const parent = elements.find(p => p.id === el.parentId);
        if (!parent) return;
        const padding = parent.padding || 0;
        updateElement(el.id, {
            x: padding,
            y: padding,
            width: parent.width - padding * 2,
            height: parent.height - padding * 2,
        });
    };

    const parentIsZone = el.parentId && elements.find(p => p.id === el.parentId)?.role;

    return (
        <>
            <Tab title="Imagine">
                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Sursă</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <button
                            onClick={() => onOpenLibrary('image', (asset) => update('src', `http://localhost:8080${asset.url}`))}
                            style={styles.uploadBtn}
                        >
                            📁 Din Library
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            style={{ ...styles.uploadBtn, background: '#e5e7eb', color: '#374151' }}
                        >
                            {el.src ? 'Fișier local...' : 'Fișier local'}
                        </button>
                    </div>
                </div>

                {parentIsZone && (
                    <div style={styles.field}>
                        <label style={styles.fieldLabel}>Umplere zonă</label>
                        <button
                            onClick={fillParentZone}
                            style={{
                                ...styles.uploadBtn,
                                background: '#f0fdf4',
                                color: '#166534',
                                border: '1.5px solid #86efac',
                            }}
                        >
                            ⛶ Umple zona părinte
                        </button>
                    </div>
                )}

                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Mod încadrare</label>
                    <div style={styles.btnGroup}>
                        {[
                            { val: 'fit', label: 'Încape' },
                            { val: 'fill', label: 'Acoperă' },
                            { val: 'stretch', label: 'Întinde' },
                        ].map(opt => (
                            <ToggleBtn key={opt.val} active={el.fitMode === opt.val} onClick={() => update('fitMode', opt.val)}>
                                {opt.label}
                            </ToggleBtn>
                        ))}
                    </div>
                </div>

                <NumField label="Opacitate" value={el.opacity} onChange={v => update('opacity', parseFloat(v) || 0)} step={0.1} />
            </Tab>

            <Tab title="Crop">
                <NumField label="Crop X (%)" value={Math.round(el.cropX * 100)} onChange={v => update('cropX', v / 100)} />
                <NumField label="Crop Y (%)" value={Math.round(el.cropY * 100)} onChange={v => update('cropY', v / 100)} />
                <NumField label="Crop W (%)" value={Math.round(el.cropWidth * 100)} onChange={v => update('cropWidth', v / 100)} />
                <NumField label="Crop H (%)" value={Math.round(el.cropHeight * 100)} onChange={v => update('cropHeight', v / 100)} />
                <button
                    onClick={() => {
                        update('cropX', 0); update('cropY', 0);
                        update('cropWidth', 1); update('cropHeight', 1);
                    }}
                    style={styles.uploadBtn}
                >
                    Reset crop
                </button>
            </Tab>

            <Tab title="Aspect">
                <ColorField label="Chenar" value={el.borderColor === 'transparent' ? '#000000' : el.borderColor}
                            onChange={v => update('borderColor', v)} allowTransparent
                            isTransparent={el.borderColor === 'transparent'}
                            onTransparent={() => update('borderColor', 'transparent')} />
                <NumField label="Border w." value={el.borderWidth} onChange={v => update('borderWidth', v)} />
                <NumField label="Radius" value={el.cornerRadius} onChange={v => update('cornerRadius', v)} />
            </Tab>

            <Tab title="Umbră">
                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Activ</label>
                    <ToggleBtn active={el.shadowEnabled} onClick={() => update('shadowEnabled', !el.shadowEnabled)}>
                        {el.shadowEnabled ? 'ON' : 'OFF'}
                    </ToggleBtn>
                </div>
                <ColorField label="Culoare" value={el.shadowColor} onChange={v => update('shadowColor', v)} />
                <NumField label="Blur" value={el.shadowBlur} onChange={v => update('shadowBlur', v)} />
                <NumField label="Opacitate" value={el.shadowOpacity} onChange={v => update('shadowOpacity', parseFloat(v) || 0)} step={0.1} />
            </Tab>

            <Tab title="Comportament">
                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Tip</label>
                    <SelectField label="" value={el.behavior} onChange={v => update('behavior', v)}
                                 options={[
                                     { value: 'static', label: 'Static (decorativ)' },
                                     { value: 'clickable', label: 'Click (selectabil)' },
                                     { value: 'draggable', label: 'Drag source' },
                                     { value: 'dropTarget', label: 'Drop target' },
                                 ]} width={180} />
                </div>
            </Tab>
        </>
    );
}


function VideoPropertyTabs({ el, update, onOpenLibrary }) {
    return (
        <>
            <Tab title="Video">
                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Sursă</label>
                    <button
                        onClick={() => onOpenLibrary('video', (asset) => update('src', `http://localhost:8080${asset.url}`))}
                        style={styles.uploadBtn}
                    >
                        {el.src ? '📁 Schimbă video' : '📁 Alege din Library'}
                    </button>
                </div>

                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Poster (thumbnail)</label>
                    <button
                        onClick={() => onOpenLibrary('image', (asset) => update('posterSrc', `http://localhost:8080${asset.url}`))}
                        style={styles.uploadBtn}
                    >
                        {el.posterSrc ? '📁 Schimbă poster' : '📁 Alege imagine'}
                    </button>
                </div>

                <NumField label="Opacitate" value={el.opacity} onChange={v => update('opacity', parseFloat(v) || 0)} step={0.1} />
                <NumField label="Radius" value={el.cornerRadius} onChange={v => update('cornerRadius', v)} />
            </Tab>

            <Tab title="Playback">
                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Autoplay</label>
                    <ToggleBtn active={el.autoplay} onClick={() => update('autoplay', !el.autoplay)}>
                        {el.autoplay ? 'ON' : 'OFF'}
                    </ToggleBtn>
                </div>
                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Loop</label>
                    <ToggleBtn active={el.loop} onClick={() => update('loop', !el.loop)}>
                        {el.loop ? 'ON' : 'OFF'}
                    </ToggleBtn>
                </div>
                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Muted</label>
                    <ToggleBtn active={el.muted} onClick={() => update('muted', !el.muted)}>
                        {el.muted ? 'ON' : 'OFF'}
                    </ToggleBtn>
                </div>
                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Controls</label>
                    <ToggleBtn active={el.controls} onClick={() => update('controls', !el.controls)}>
                        {el.controls ? 'ON' : 'OFF'}
                    </ToggleBtn>
                </div>
            </Tab>

            <Tab title="Umbră">
                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Activ</label>
                    <ToggleBtn active={el.shadowEnabled} onClick={() => update('shadowEnabled', !el.shadowEnabled)}>
                        {el.shadowEnabled ? 'ON' : 'OFF'}
                    </ToggleBtn>
                </div>
                <ColorField label="Culoare" value={el.shadowColor} onChange={v => update('shadowColor', v)} />
                <NumField label="Blur" value={el.shadowBlur} onChange={v => update('shadowBlur', v)} />
                <NumField label="Opacitate" value={el.shadowOpacity} onChange={v => update('shadowOpacity', parseFloat(v) || 0)} step={0.1} />
            </Tab>
        </>
    );
}


function ShapePropertyTabs({ el, update }) {
    return (
        <>
            <Tab title="Formă">
                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Tip</label>
                    <div style={styles.btnGroup}>
                        {[
                            { val: 'rect', label: '▭' },
                            { val: 'circle', label: '◯' },
                            { val: 'line', label: '─' },
                            { val: 'polygon', label: '⬢' },
                        ].map(opt => (
                            <ToggleBtn key={opt.val} active={el.shapeType === opt.val} onClick={() => update('shapeType', opt.val)}>
                                {opt.label}
                            </ToggleBtn>
                        ))}
                    </div>
                </div>

                <ColorField label="Fill" value={el.fill} onChange={v => update('fill', v)} />
                <ColorField label="Chenar" value={el.stroke} onChange={v => update('stroke', v)} />
                <NumField label="Border w." value={el.strokeWidth} onChange={v => update('strokeWidth', v)} />
                {el.shapeType === 'rect' && (
                    <NumField label="Radius" value={el.cornerRadius} onChange={v => update('cornerRadius', v)} />
                )}
                <NumField label="Opacitate" value={el.opacity} onChange={v => update('opacity', parseFloat(v) || 0)} step={0.1} />
            </Tab>

            <Tab title="Umbră">
                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Activ</label>
                    <ToggleBtn active={el.shadowEnabled} onClick={() => update('shadowEnabled', !el.shadowEnabled)}>
                        {el.shadowEnabled ? 'ON' : 'OFF'}
                    </ToggleBtn>
                </div>
                <ColorField label="Culoare" value={el.shadowColor} onChange={v => update('shadowColor', v)} />
                <NumField label="Blur" value={el.shadowBlur} onChange={v => update('shadowBlur', v)} />
                <NumField label="Opacitate" value={el.shadowOpacity} onChange={v => update('shadowOpacity', parseFloat(v) || 0)} step={0.1} />
            </Tab>

            <Tab title="Comportament">
                <SelectField label="Tip" value={el.behavior} onChange={v => update('behavior', v)}
                             options={[
                                 { value: 'static', label: 'Static (decorativ)' },
                                 { value: 'draggable', label: 'Drag source' },
                                 { value: 'dropTarget', label: 'Drop target' },
                                 { value: 'clickZone', label: 'Zonă de click' },
                                 { value: 'hotspot', label: 'Hotspot' },
                                 { value: 'colorZone', label: 'Zonă de colorat' },
                             ]} width={180} />
            </Tab>
        </>
    );
}


function BoxPropertyTabs({ el, update }) {
    const isRoleZone = !!el.role;
    const isLockedZone = isRoleZone && el.locked;

    return (
        <>
            {isRoleZone && (
                <Tab title="Zonă semantică">
                    <div style={styles.field}>
                        <label style={styles.fieldLabel}>Rol</label>
                        <div style={{
                            fontSize: '0.75rem', fontWeight: 700, color: '#4F6BF6',
                            padding: '6px 10px', background: '#eef2ff', borderRadius: 6,
                        }}>
                            {el.role}
                        </div>
                    </div>
                    <div style={styles.field}>
                        <label style={styles.fieldLabel}>Stare</label>
                        <button
                            onClick={() => update('locked', !el.locked)}
                            style={{
                                background: isLockedZone ? '#fef3c7' : '#dcfce7',
                                border: '1.5px solid ' + (isLockedZone ? '#fcd34d' : '#86efac'),
                                color: isLockedZone ? '#92400e' : '#166534',
                                borderRadius: 8, padding: '7px 12px',
                                fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                            }}
                        >
                            {isLockedZone ? '🔒 Deblochează zona' : '🔓 Blochează zona'}
                        </button>
                    </div>
                </Tab>
            )}

            <Tab title="Container">
                <ColorField
                    label="Fundal"
                    value={el.bgFill === 'transparent' ? '#ffffff' : el.bgFill}
                    onChange={v => update('bgFill', v)}
                    allowTransparent
                    isTransparent={el.bgFill === 'transparent'}
                    onTransparent={() => update('bgFill', 'transparent')}
                />
                <ColorField
                    label="Chenar"
                    value={el.bgStroke === 'transparent' ? '#000000' : el.bgStroke}
                    onChange={v => update('bgStroke', v)}
                    allowTransparent
                    isTransparent={el.bgStroke === 'transparent'}
                    onTransparent={() => update('bgStroke', 'transparent')}
                />
                <NumField label="Border w." value={el.bgStrokeWidth} onChange={v => update('bgStrokeWidth', v)} />
                <NumField label="Radius" value={el.bgCornerRadius} onChange={v => update('bgCornerRadius', v)} />
                <NumField label="Padding" value={el.padding} onChange={v => update('padding', v)} />
            </Tab>

            <Tab title="Umbră">
                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Activ</label>
                    <ToggleBtn active={el.shadowEnabled} onClick={() => update('shadowEnabled', !el.shadowEnabled)}>
                        {el.shadowEnabled ? 'ON' : 'OFF'}
                    </ToggleBtn>
                </div>
                <ColorField label="Culoare" value={el.shadowColor} onChange={v => update('shadowColor', v)} />
                <NumField label="Blur" value={el.shadowBlur} onChange={v => update('shadowBlur', v)} />
                <NumField label="Opacitate" value={el.shadowOpacity} onChange={v => update('shadowOpacity', parseFloat(v) || 0)} step={0.1} />
            </Tab>
        </>
    );
}


function GridPropertyTabs({ el, update }) {
    return (
        <>
            <Tab title="Grid">
                <NumField label="Rânduri" value={el.rows} onChange={v => update('rows', Math.max(1, Math.round(v)))} />
                <NumField label="Coloane" value={el.cols} onChange={v => update('cols', Math.max(1, Math.round(v)))} />
                <NumField label="Gap" value={el.gap} onChange={v => update('gap', Math.max(0, v))} />
                <NumField label="Padding" value={el.cellPadding} onChange={v => update('cellPadding', Math.max(0, v))} />
            </Tab>

            <Tab title="Fundal Grid">
                <ColorField
                    label="Fundal"
                    value={el.bgFill === 'transparent' ? '#ffffff' : el.bgFill}
                    onChange={v => update('bgFill', v)}
                    allowTransparent
                    isTransparent={el.bgFill === 'transparent'}
                    onTransparent={() => update('bgFill', 'transparent')}
                />
                <ColorField
                    label="Chenar"
                    value={el.bgStroke === 'transparent' ? '#000000' : el.bgStroke}
                    onChange={v => update('bgStroke', v)}
                    allowTransparent
                    isTransparent={el.bgStroke === 'transparent'}
                    onTransparent={() => update('bgStroke', 'transparent')}
                />
                <NumField label="Border w." value={el.bgStrokeWidth} onChange={v => update('bgStrokeWidth', v)} />
                <NumField label="Radius" value={el.bgCornerRadius} onChange={v => update('bgCornerRadius', v)} />
            </Tab>

            <Tab title="Celule">
                <ColorField
                    label="Fundal celulă"
                    value={el.cellFill === 'transparent' ? '#ffffff' : el.cellFill}
                    onChange={v => update('cellFill', v)}
                    allowTransparent
                    isTransparent={el.cellFill === 'transparent'}
                    onTransparent={() => update('cellFill', 'transparent')}
                />
                <ColorField
                    label="Chenar celulă"
                    value={el.cellStroke === 'transparent' ? '#000000' : el.cellStroke}
                    onChange={v => update('cellStroke', v)}
                    allowTransparent
                    isTransparent={el.cellStroke === 'transparent'}
                    onTransparent={() => update('cellStroke', 'transparent')}
                />
                <NumField label="Border w." value={el.cellStrokeWidth} onChange={v => update('cellStrokeWidth', v)} />
                <NumField label="Radius" value={el.cellCornerRadius} onChange={v => update('cellCornerRadius', v)} />
            </Tab>

            <Tab title="Umbră">
                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Activ</label>
                    <ToggleBtn active={el.shadowEnabled} onClick={() => update('shadowEnabled', !el.shadowEnabled)}>
                        {el.shadowEnabled ? 'ON' : 'OFF'}
                    </ToggleBtn>
                </div>
                <ColorField label="Culoare" value={el.shadowColor} onChange={v => update('shadowColor', v)} />
                <NumField label="Blur" value={el.shadowBlur} onChange={v => update('shadowBlur', v)} />
                <NumField label="Opacitate" value={el.shadowOpacity} onChange={v => update('shadowOpacity', parseFloat(v) || 0)} step={0.1} />
            </Tab>
        </>
    );
}
function PdfPropertyTabs({ el, update, onOpenLibrary }) {
    return (
        <>
            <Tab title="Document">
                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Fișier PDF</label>
                    <button
                        onClick={() => onOpenLibrary('pdf', (asset) => {
                            update('src', `http://localhost:8080${asset.url}`);
                            update('originalName', asset.originalName);
                        })}
                        style={styles.uploadBtn}
                    >
                        {el.src ? '📄 Schimbă PDF' : '📄 Alege PDF'}
                    </button>
                </div>

                {el.src && (
                    <div style={styles.field}>
                        <label style={styles.fieldLabel}>Fișier curent</label>
                        <span style={{ fontSize: '0.75rem', color: '#4F6BF6', fontWeight: 700 }}>
                            {el.originalName || 'document.pdf'}
                        </span>
                    </div>
                )}

                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Label buton</label>
                    <input
                        type="text"
                        value={el.label || ''}
                        onChange={(e) => update('label', e.target.value)}
                        placeholder="Deschide documentul"
                        style={{ ...styles.fieldInput, width: 160 }}
                    />
                </div>
            </Tab>

            <Tab title="Aspect">
                <ColorField
                    label="Fundal"
                    value={el.bgFill === 'transparent' ? '#ffffff' : el.bgFill}
                    onChange={v => update('bgFill', v)}
                    allowTransparent
                    isTransparent={el.bgFill === 'transparent'}
                    onTransparent={() => update('bgFill', 'transparent')}
                />
                <ColorField
                    label="Chenar"
                    value={el.bgStroke === 'transparent' ? '#000000' : el.bgStroke}
                    onChange={v => update('bgStroke', v)}
                    allowTransparent
                    isTransparent={el.bgStroke === 'transparent'}
                    onTransparent={() => update('bgStroke', 'transparent')}
                />
                <NumField label="Radius" value={el.bgCornerRadius} onChange={v => update('bgCornerRadius', v)} />
            </Tab>

            <Tab title="Umbră">
                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Activ</label>
                    <ToggleBtn active={el.shadowEnabled} onClick={() => update('shadowEnabled', !el.shadowEnabled)}>
                        {el.shadowEnabled ? 'ON' : 'OFF'}
                    </ToggleBtn>
                </div>
                <ColorField label="Culoare" value={el.shadowColor} onChange={v => update('shadowColor', v)} />
                <NumField label="Blur" value={el.shadowBlur} onChange={v => update('shadowBlur', v)} />
                <NumField label="Opacitate" value={el.shadowOpacity} onChange={v => update('shadowOpacity', parseFloat(v) || 0)} step={0.1} />
            </Tab>
        </>
    );
}
function HotspotPropertyTabs({ el, update }) {
    return (
        <Tab title="Hotspot">
            <div style={styles.field}>
                <label style={styles.fieldLabel}>Etichetă</label>
                <input
                    type="text"
                    value={el.label || ''}
                    onChange={e => update('label', e.target.value)}
                    placeholder="ex: Zona corectă"
                    style={{ ...styles.fieldInput, width: '100%' }}
                />
            </div>
            <ColorField
                label="Culoare zonă"
                value={el.fill || 'rgba(255, 200, 0, 0.25)'}
                onChange={v => update('fill', v)}
            />
            <ColorField
                label="Chenar"
                value={el.stroke || '#f59e0b'}
                onChange={v => update('stroke', v)}
            />
            <NumField
                label="Border w."
                value={el.strokeWidth || 2}
                onChange={v => update('strokeWidth', v)}
            />
            <NumField
                label="Radius"
                value={el.cornerRadius || 8}
                onChange={v => update('cornerRadius', v)}
            />
            <NumField
                label="Opacity"
                value={el.opacity ?? 1}
                onChange={v => update('opacity', parseFloat(v) || 1)}
                step={0.1}
            />
        </Tab>
    );
}

function Tab({ title, children }) {
    return (
        <div style={styles.tabBlock}>
            <div style={styles.tabTitle}>{title}</div>
            <div style={styles.tabContent}>{children}</div>
        </div>
    );
}

function NumField({ label, value, onChange, step = 1 }) {
    return (
        <div style={styles.field}>
            <label style={styles.fieldLabel}>{label}</label>
            <input type="number" value={value} step={step}
                   onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                   style={styles.fieldInput} />
        </div>
    );
}

function SelectField({ label, value, onChange, options, width = 100 }) {
    return (
        <div style={styles.field}>
            {label && <label style={styles.fieldLabel}>{label}</label>}
            <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...styles.fieldInput, width }}>
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );
}

function ColorField({ label, value, onChange, allowTransparent, isTransparent, onTransparent }) {
    return (
        <div style={styles.field}>
            <label style={styles.fieldLabel}>{label}</label>
            <div style={{ display: 'flex', gap: 4 }}>
                <input type="color" value={isTransparent ? '#ffffff' : value}
                       onChange={(e) => onChange(e.target.value)}
                       style={{ ...styles.fieldInput, height: 36, padding: 2, cursor: 'pointer', width: 50 }} />
                {allowTransparent && (
                    <button onClick={onTransparent}
                            style={{
                                ...styles.fieldInput, padding: '0 8px', cursor: 'pointer',
                                background: isTransparent ? '#4F6BF6' : '#f9fafb',
                                color: isTransparent ? 'white' : '#6b7280',
                                border: 'none', fontSize: '0.7rem', fontWeight: 700,
                            }} title="Transparent">⊘</button>
                )}
            </div>
        </div>
    );
}

function ToggleBtn({ active, onClick, children }) {
    return (
        <button onClick={onClick}
                style={{
                    background: active ? '#4F6BF6' : '#f9fafb',
                    color: active ? 'white' : '#1a1d23',
                    border: '1.5px solid ' + (active ? '#4F6BF6' : '#e5e7eb'),
                    borderRadius: 6, padding: '6px 10px', fontSize: '0.85rem',
                    fontWeight: 700, cursor: 'pointer', minWidth: 32,
                }}>
            {children}
        </button>
    );
}

function AlignBtn({ children, onClick }) {
    return (
        <button onClick={onClick} style={{
            background: '#f9fafb', border: '1.5px solid #e5e7eb',
            borderRadius: 8, padding: '8px 14px', fontSize: '0.85rem',
            fontWeight: 700, color: '#1a1d23', cursor: 'pointer',
        }}>
            {children}
        </button>
    );
}


const styles = {
    panel: {
        background: 'white',
        borderTop: '1px solid #e5e7eb',
        padding: '14px 20px',
        boxShadow: '0 -1px 3px rgba(0,0,0,0.04)',
        maxHeight: 300,
        overflowY: 'auto',
    },
    emptyMsg: { color: '#9ca3af', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', margin: '20px 0' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    elementType: {
        fontSize: '0.7rem', fontWeight: 800, color: '#4F6BF6',
        letterSpacing: '1px', textTransform: 'uppercase',
        background: '#eef2ff', padding: '4px 10px', borderRadius: 6,
    },
    deleteBtn: {
        background: '#fee2e2', color: '#b91c1c', border: 'none',
        padding: '6px 14px', borderRadius: 8, fontSize: '0.8rem',
        fontWeight: 700, cursor: 'pointer',
    },
    tabs: { display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' },
    tabBlock: { display: 'flex', flexDirection: 'column', gap: 8 },
    tabTitle: {
        fontSize: '0.65rem', fontWeight: 800, color: '#9ca3af',
        letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2,
    },
    tabContent: {
        display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end',
        padding: '8px 12px', background: '#fafafa', borderRadius: 10,
        border: '1px solid #f3f4f6',
    },
    field: { display: 'flex', flexDirection: 'column', gap: 4 },
    fieldLabel: {
        fontSize: '0.68rem', fontWeight: 700, color: '#6b7280',
        textTransform: 'uppercase', letterSpacing: '0.5px',
    },
    fieldInput: {
        border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 10px',
        fontSize: '0.85rem', fontWeight: 600, color: '#1a1d23',
        outline: 'none', background: '#f9fafb', width: 80,
    },
    btnGroup: { display: 'flex', gap: 4 },
    uploadBtn: {
        background: '#4F6BF6', color: 'white', border: 'none',
        padding: '8px 14px', borderRadius: 8, fontSize: '0.82rem',
        fontWeight: 700, cursor: 'pointer',
    },
};