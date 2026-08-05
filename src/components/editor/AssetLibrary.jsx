import { useEffect, useState, useRef } from 'react';
import { assetApi } from '../../api/assetApi';

export default function AssetLibrary({ onInsert, onClose }) {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = async () => {
        setLoading(true);
        try {
            const res = await assetApi.list('image');
            setAssets(res.data);
        } catch (err) {
            setError('Eroare la încărcarea imaginilor');
        } finally {
            setLoading(false);
        }
    };

    const uploadFile = async (file) => {
        if (!file) return;
        setUploading(true);
        setError('');
        setUploadProgress(0);
        try {
            const res = await assetApi.upload(file, (progress) => {
                setUploadProgress(progress);
            });
            setAssets(prev => [res.data, ...prev]);
        } catch (err) {
            setError(err.response?.data?.message || 'Eroare la upload');
        } finally {
            setUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleFileSelect = (e) => uploadFile(e.target.files?.[0]);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            uploadFile(file);
        } else {
            setError('Doar fișiere imagine sunt acceptate (PNG, JPG, SVG, WebP, GIF)');
        }
    };

    const handleDelete = async (asset, e) => {
        e.stopPropagation();
        if (!confirm(`Ștergi "${asset.originalName}"? Exercițiile care o folosesc vor pierde imaginea.`)) return;
        try {
            await assetApi.delete(asset.id);
            setAssets(prev => prev.filter(a => a.id !== asset.id));
        } catch (err) {
            setError('Eroare la ștergere');
        }
    };

    const formatSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const filtered = assets.filter(a =>
        a.originalName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.panel} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={styles.header}>
                    <span style={styles.title}>🖼️ Imagini</span>
                    <button onClick={onClose} style={styles.closeBtn}>✕</button>
                </div>

                {/* Zona drag-and-drop upload */}
                <div
                    style={{
                        ...styles.dropZone,
                        ...(dragOver ? styles.dropZoneActive : {}),
                        ...(uploading ? styles.dropZoneUploading : {}),
                    }}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                    {uploading ? (
                        <>
                            <span style={styles.dropIcon}>⏳</span>
                            <span style={styles.dropText}>Se încarcă... {uploadProgress}%</span>
                            <div style={styles.progressBar}>
                                <div style={{ ...styles.progressFill, width: `${uploadProgress}%` }} />
                            </div>
                        </>
                    ) : dragOver ? (
                        <>
                            <span style={styles.dropIcon}>⬇️</span>
                            <span style={styles.dropText}>Lasă imaginea aici</span>
                        </>
                    ) : (
                        <>
                            <span style={styles.dropIcon}>+</span>
                            <span style={styles.dropText}>Trage o imagine aici sau <u>alege fișier</u></span>
                            <span style={styles.dropHint}>PNG, JPG, SVG, WebP, GIF</span>
                        </>
                    )}
                </div>

                {error && <p style={styles.errorText}>{error}</p>}

                {/* Search */}
                <div style={styles.searchRow}>
                    <input
                        type="text"
                        placeholder="Caută după nume..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={styles.searchInput}
                    />
                    <span style={styles.count}>
                        {filtered.length} {filtered.length === 1 ? 'imagine' : 'imagini'}
                    </span>
                </div>

                {/* Grid imagini */}
                {loading ? (
                    <div style={styles.centered}>
                        <div style={styles.spinner} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={styles.centered}>
                        <p style={styles.emptyText}>
                            {search ? 'Niciun rezultat găsit.' : 'Nu există imagini uploadate încă.'}
                        </p>
                    </div>
                ) : (
                    <div style={styles.grid}>
                        {filtered.map(asset => (
                            <div
                                key={asset.id}
                                style={styles.card}
                                onClick={() => onInsert(asset)}
                                title={`${asset.originalName} (${formatSize(asset.sizeBytes)})`}
                            >
                                <div style={styles.thumb}>
                                    <img
                                        src={`http://localhost:8080${asset.url}`}
                                        alt={asset.originalName}
                                        style={styles.thumbImg}
                                        onError={e => { e.target.style.display = 'none'; }}
                                    />
                                </div>
                                <div style={styles.cardFooter}>
                                    <span style={styles.assetName}>
                                        {asset.originalName?.length > 18
                                            ? asset.originalName.substring(0, 16) + '...'
                                            : asset.originalName}
                                    </span>
                                    <button
                                        onClick={(e) => handleDelete(asset, e)}
                                        style={styles.deleteBtn}
                                        title="Șterge"
                                    >
                                        🗑
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    panel: {
        background: 'white',
        borderRadius: 16,
        width: 720,
        maxWidth: '95vw',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        overflow: 'hidden',
    },
    header: {
        padding: '16px 20px',
        borderBottom: '1px solid #f3f4f6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
    },
    title: {
        fontSize: '1rem',
        fontWeight: 800,
        color: '#1a1d23',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: '1rem',
        cursor: 'pointer',
        color: '#9ca3af',
        padding: 4,
        borderRadius: 4,
    },
    dropZone: {
        margin: '16px 20px 0',
        border: '2px dashed #d1d5db',
        borderRadius: 12,
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        transition: 'all 0.15s',
        background: '#fafafa',
        flexShrink: 0,
    },
    dropZoneActive: {
        borderColor: '#4F6BF6',
        background: '#eef1fe',
    },
    dropZoneUploading: {
        cursor: 'default',
        background: '#f3f4f6',
    },
    dropIcon: {
        fontSize: '1.6rem',
        lineHeight: 1,
    },
    dropText: {
        fontSize: '0.85rem',
        fontWeight: 700,
        color: '#374151',
    },
    dropHint: {
        fontSize: '0.75rem',
        color: '#9ca3af',
        fontWeight: 600,
    },
    progressBar: {
        width: '100%',
        height: 4,
        background: '#e5e7eb',
        borderRadius: 2,
        marginTop: 4,
    },
    progressFill: {
        height: '100%',
        background: '#4F6BF6',
        borderRadius: 2,
        transition: 'width 0.2s',
    },
    errorText: {
        color: '#dc2626',
        fontSize: '0.82rem',
        fontWeight: 700,
        padding: '8px 20px 0',
        margin: 0,
        flexShrink: 0,
    },
    searchRow: {
        padding: '12px 20px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
    },
    searchInput: {
        flex: 1,
        padding: '8px 12px',
        border: '1.5px solid #e5e7eb',
        borderRadius: 8,
        fontSize: '0.85rem',
        outline: 'none',
        color: '#1a1d23',
    },
    count: {
        fontSize: '0.75rem',
        fontWeight: 700,
        color: '#9ca3af',
        whiteSpace: 'nowrap',
    },
    grid: {
        flex: 1,
        overflowY: 'auto',
        padding: '8px 20px 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: 12,
        alignContent: 'start',
    },
    card: {
        border: '1.5px solid #f3f4f6',
        borderRadius: 10,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.15s',
        background: '#fafafa',
    },
    thumb: {
        width: '100%',
        aspectRatio: '1',
        background: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    thumbImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    cardFooter: {
        padding: '6px 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 4,
    },
    assetName: {
        fontSize: '0.7rem',
        color: '#6b7280',
        fontWeight: 600,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    deleteBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.85rem',
        padding: 2,
        flexShrink: 0,
    },
    centered: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        color: '#9ca3af',
        fontSize: '0.85rem',
        fontWeight: 600,
    },
    spinner: {
        width: 32,
        height: 32,
        border: '3px solid #e5e7eb',
        borderTop: '3px solid #4F6BF6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
};
