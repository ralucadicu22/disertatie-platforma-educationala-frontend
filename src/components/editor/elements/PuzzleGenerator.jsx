import { useRef, useState, useCallback } from 'react';

const GRID_OPTIONS = [
    { label: '2 × 2 (4 piese)', cols: 2, rows: 2 },
    { label: '2 × 3 (6 piese)', cols: 3, rows: 2 },
    { label: '3 × 3 (9 piese)', cols: 3, rows: 3 },
    { label: '3 × 4 (12 piese)', cols: 4, rows: 3 },
    { label: '4 × 4 (16 piese)', cols: 4, rows: 4 },
    { label: '4 × 5 (20 piese)', cols: 5, rows: 4 },
];

function sliceImageToDataURLs(imgSrc, cols, rows) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const pieceW = Math.floor(img.naturalWidth / cols);
            const pieceH = Math.floor(img.naturalHeight / rows);
            const results = [];

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const canvas = document.createElement('canvas');
                    canvas.width = pieceW;
                    canvas.height = pieceH;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, c * pieceW, r * pieceH, pieceW, pieceH, 0, 0, pieceW, pieceH);
                    results.push({ dataUrl: canvas.toDataURL('image/png'), row: r, col: c });
                }
            }
            resolve(results);
        };
        img.onerror = reject;
        img.src = imgSrc;
    });
}

export default function PuzzleGenerator({ boardZone, piecesZone, elements, onGenerate }) {
    const fileRef = useRef(null);
    const [previewSrc, setPreviewSrc] = useState(null);
    const [gridOption, setGridOption] = useState(2);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [previewGrid, setPreviewGrid] = useState(false);

    const handleFile = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => setPreviewSrc(evt.target.result);
        reader.readAsDataURL(file);
        e.target.value = '';
        setError(null);
    }, []);

    const handleGenerate = async () => {
        if (!previewSrc) { setError('Alege o imagine mai întâi.'); return; }
        if (!boardZone || !piecesZone) { setError('Lipsesc zonele puzzle din canvas.'); return; }

        setLoading(true);
        setError(null);

        try {
            const { cols, rows } = GRID_OPTIONS[gridOption];
            const pieces = await sliceImageToDataURLs(previewSrc, cols, rows);
            const piecesWithUrl = pieces.map(p => ({ ...p, url: p.dataUrl }));
            onGenerate({ pieces: piecesWithUrl, cols, rows, boardZone, piecesZone });
        } catch (err) {
            setError('Eroare la generare: ' + (err.message || 'necunoscută'));
        } finally {
            setLoading(false);
        }
    };

    const option = GRID_OPTIONS[gridOption];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
                background: '#f0f7ff', border: '1.5px solid #bfdbfe',
                borderRadius: 8, padding: '10px 12px',
                fontSize: '0.75rem', color: '#1e40af', lineHeight: 1.5,
            }}>
                🧩 Generează automat piesele puzzle-ului din orice imagine.
                Platforma taie imaginea, creează piesele în <strong>Sertar</strong> și sloturile pe <strong>Tablă</strong>.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={labelStyle}>Imagine sursă</label>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
                <button onClick={() => fileRef.current?.click()} style={uploadBtnStyle}>
                    {previewSrc ? '✅ Schimbă imaginea' : '📁 Alege imaginea'}
                </button>
            </div>

            {previewSrc && (
                <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1.5px solid #e5e7eb' }}>
                    <img src={previewSrc} alt="preview" style={{ width: '100%', display: 'block', maxHeight: 200, objectFit: 'contain', background: '#f9fafb' }} />
                    {previewGrid && (
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            display: 'grid',
                            gridTemplateColumns: `repeat(${option.cols}, 1fr)`,
                            gridTemplateRows: `repeat(${option.rows}, 1fr)`,
                            pointerEvents: 'none',
                        }}>
                            {Array.from({ length: option.cols * option.rows }).map((_, i) => (
                                <div key={i} style={{ border: '2px solid rgba(79,107,246,0.7)', boxSizing: 'border-box' }} />
                            ))}
                        </div>
                    )}
                    <button
                        onClick={() => setPreviewGrid(v => !v)}
                        style={{
                            position: 'absolute', bottom: 6, right: 6,
                            background: 'rgba(255,255,255,0.9)', border: '1px solid #d1d5db',
                            borderRadius: 6, padding: '3px 8px', fontSize: '0.7rem',
                            cursor: 'pointer', fontWeight: 700, color: '#374151',
                        }}
                    >
                        {previewGrid ? 'Ascunde grid' : 'Previzualizează linii tăiere'}
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={labelStyle}>Dimensiune grid</label>
                <select
                    value={gridOption}
                    onChange={e => setGridOption(Number(e.target.value))}
                    style={selectStyle}
                >
                    {GRID_OPTIONS.map((opt, idx) => (
                        <option key={idx} value={idx}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {error && (
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 10px', fontSize: '0.75rem', color: '#b91c1c' }}>
                    ⚠ {error}
                </div>
            )}

            <button
                onClick={handleGenerate}
                disabled={loading || !previewSrc}
                style={{
                    background: loading || !previewSrc ? '#e5e7eb' : 'linear-gradient(135deg, #4F6BF6, #7c3aed)',
                    color: loading || !previewSrc ? '#9ca3af' : 'white',
                    border: 'none', borderRadius: 10,
                    padding: '10px 0', fontWeight: 800,
                    fontSize: '0.85rem', cursor: loading || !previewSrc ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                }}
            >
                {loading ? '⏳ Se generează...' : `🪄 Generează ${option.rows * option.cols} piese`}
            </button>
        </div>
    );
}

const labelStyle = {
    fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em',
};

const uploadBtnStyle = {
    background: '#f9fafb', border: '1.5px dashed #d1d5db', borderRadius: 8,
    padding: '8px 12px', fontSize: '0.8rem', fontWeight: 700, color: '#374151',
    cursor: 'pointer', textAlign: 'center',
};

const selectStyle = {
    border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 10px',
    fontSize: '0.85rem', fontWeight: 600, color: '#1a1d23',
    background: '#f9fafb', width: '100%', boxSizing: 'border-box',
};
