import { useRef } from 'react';
import { useEditor } from '../../store/editorStore.jsx';

const FONT_FAMILIES = ['Nunito', 'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Comic Sans MS'];

export default function EditorPropertiesPanel() {
    const {
        selectedElement, updateElement, deleteElement, deleteSelected,
        selectedIds, alignElements, distributeElements,
        canvas, updateCanvas,
    } = useEditor();
    const fileInputRef = useRef(null);
    const bgFileInputRef = useRef(null);

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

                {el.type === 'TEXT' && <TextPropertyTabs el={el} update={update} />}
                {el.type === 'IMAGE' && (
                    <ImagePropertyTabs el={el} update={update} fileInputRef={fileInputRef} />
                )}
                {el.type === 'SHAPE' && <ShapePropertyTabs el={el} update={update} />}
                {el.type === 'BOX' && <BoxPropertyTabs el={el} update={update} />}
                {el.type === 'GRID' && <GridPropertyTabs el={el} update={update} />}
            </div>
        </div>
    );
}


function TextPropertyTabs({ el, update }) {
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

    return (
        <>
            <Tab title="Text">
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
                    <label style={styles.fieldLabel}>Listă</label>
                    <div style={styles.btnGroup}>
                        {[{val:'none',l:'—'},{val:'bullet',l:'•'},{val:'numbered',l:'1.'}].map(opt => (
                            <ToggleBtn key={opt.val} active={el.listStyle === opt.val} onClick={() => update('listStyle', opt.val)}>
                                {opt.l}
                            </ToggleBtn>
                        ))}
                    </div>
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

function ImagePropertyTabs({ el, update, fileInputRef }) {
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => update('src', evt.target.result);
        reader.readAsDataURL(file);
    };

    return (
        <>
            <Tab title="Imagine">
                <div style={styles.field}>
                    <label style={styles.fieldLabel}>Sursă</label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        style={styles.uploadBtn}
                    >
                        {el.src ? 'Schimbă...' : 'Încarcă imagine'}
                    </button>
                </div>

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
function BoxPropertyTabs({ el, update }) {
    return (
        <>
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

            {el.role && (
                <Tab title="Rol semantic">
                    <div style={styles.field}>
                        <label style={styles.fieldLabel}>Zonă</label>
                        <div style={{
                            fontSize: '0.75rem', fontWeight: 700, color: '#4F6BF6',
                            padding: '6px 10px', background: '#eef2ff', borderRadius: 6,
                        }}>
                            {el.role}
                        </div>
                    </div>
                </Tab>
            )}
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