import { useEffect, useState, useRef } from 'react';
import { assetApi } from '../../api/assetApi';

const TYPE_FILTERS = [
    { value: '', label: 'Toate' },
    { value: 'image', label: 'Imagini' },
    { value: 'video', label: 'Video' },
    { value: 'pdf', label: 'PDF' },
];

export default function AssetLibrary({ onInsert, onClose, acceptTypes = 'image,video' }) {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const fileInputRef = useRef(null);

    const acceptList = acceptTypes.split(',');
    const availableFilters = acceptList.length === 1
        ? []
        : TYPE_FILTERS.filter(f =>
            f.value === '' || acceptList.includes(f.value)
        );

    const inputAccept = [
        acceptList.includes('image') && 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml',
        acceptList.includes('video') && 'video/mp4,video/webm,video/ogg',
        acceptList.includes('pdf') && 'application/pdf',
    ].filter(Boolean).join(',');

    useEffect(() => {
        loadAssets();
    }, [typeFilter]);

    const loadAssets = async () => {
        setLoading(true);
        try {
            const res = await assetApi.list(typeFilter);
            setAssets(res.data);
        } catch (err) {
            setError('Eroare la încărcarea asset-urilor');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
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

    const handleDelete = async (asset, e) => {
        e.stopPropagation();
        if (!confirm(`Ștergi "${asset.originalName}"? Exercițiile care o folosesc vor pierde asset-ul.`)) return;
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


    const filtered = assets.filter(a => {
        const matchesSearch = a.originalName?.toLowerCase().includes(search.toLowerCase());
        const isImage = a.mimeType?.startsWith('image/');
        const isVideo = a.mimeType?.startsWith('video/');
        const isPdf = a.mimeType === 'application/pdf';
        const isAccepted =
            (isImage && acceptList.includes('image')) ||
            (isVideo && acceptList.includes('video')) ||
            (isPdf && acceptList.includes('pdf'));
        return matchesSearch && isAccepted;
    });

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.panel} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <span style={styles.title}>📁 Asset Library</span>
                    <button onClick={onClose} style={styles.closeBtn}>✕</button>
                </div>

                <div style={styles.toolbar}>
                    <input
                        type="text"
                        placeholder="Caută după nume..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={styles.searchInput}
                    />
                    {availableFilters.length > 1 && (
                        <div style={styles.filterGroup}>
                            {availableFilters.map(f => (
                                <button
                                    key={f.value}
                                    onClick={() => setTypeFilter(f.value)}
                                    style={{
                                        ...styles.filterBtn,
                                        background: typeFilter === f.value ? '#4F6BF6' : '#f9fafb',
                                        color: typeFilter === f.value ? 'white' : '#374151',
                                    }}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={inputAccept}
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        style={styles.uploadBtn}
                    >
                        {uploading ? `${uploadProgress}%` : '+ Adaugă'}
                    </button>
                </div>

                {uploading && (
                    <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: `${uploadProgress}%` }} />
                    </div>
                )}

                {error && <p style={styles.errorText}>{error}</p>}

                {loading ? (
                    <div style={styles.centered}>
                        <div style={styles.spinner} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={styles.centered}>
                        <p style={styles.emptyText}>
                            {search ? 'Niciun rezultat găsit.' : 'Nu există asset-uri disponibile încă.'}
                        </p>
                    </div>
                ) : (
                    <div style={styles.grid}>
                        {filtered.map(asset => (
                            <AssetCard
                                key={asset.id}
                                asset={asset}
                                onClick={() => onInsert(asset)}
                                onDelete={(e) => handleDelete(asset, e)}
                                formatSize={formatSize}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function AssetCard({ asset, onClick, onDelete, formatSize }) {
    const [hovered, setHovered] = useState(false);
    const videoRef = useRef(null);
    const isVideo = asset.mimeType?.startsWith('video/');
    const isImage = asset.mimeType?.startsWith('image/');
    const isPdf = asset.mimeType === 'application/pdf';

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (hovered) {
            video.play().catch(() => {});
        } else {
            video.pause();
            video.currentTime = 0;
        }
    }, [hovered]);

    return (
        <div
            style={styles.card}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            title={`${asset.originalName} (${formatSize(asset.sizeBytes)})`}
        >
            <div style={styles.thumb}>
                {isImage && (
                    <img
                        src={`http://localhost:8080${asset.url}`}
                        alt={asset.originalName}
                        style={styles.thumbImg}
                        onError={e => { e.target.style.display = 'none'; }}
                    />
                )}
                {isVideo && (
                    <>
                        <video
                            ref={videoRef}
                            src={`http://localhost:8080${asset.url}`}
                            style={styles.thumbImg}
                            muted
                            playsInline
                            preload="metadata"
                        />
                        <div style={styles.videoBadge}>▶ VIDEO</div>
                    </>
                )}
                {isPdf && (
                    <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        background: '#f9fafb', gap: 6,
                    }}>
                        <span style={{ fontSize: '2.5rem' }}>📄</span>
                        <span style={{
                            fontSize: '0.65rem', fontWeight: 800,
                            color: '#4F6BF6', letterSpacing: '0.5px',
                        }}>PDF</span>
                    </div>
                )}
            </div>
            <div style={styles.cardFooter}>
                <span style={styles.assetName}>
                    {asset.originalName?.length > 18
                        ? asset.originalName.substring(0, 16) + '...'
                        : asset.originalName}
                </span>
                <button
                    onClick={onDelete}
                    style={styles.deleteBtn}
                    title="Șterge"
                >
                    🗑
                </button>
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
        width: 780,
        maxWidth: '95vw',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    },
    header: {
        padding: '16px 20px',
        borderBottom: '1px solid #f3f4f6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    toolbar: {
        padding: '12px 20px',
        display: 'flex',
        gap: 10,
        borderBottom: '1px solid #f3f4f6',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        minWidth: 180,
        padding: '8px 12px',
        border: '1.5px solid #e5e7eb',
        borderRadius: 8,
        fontSize: '0.85rem',
        outline: 'none',
        color: '#1a1d23',
    },
    filterGroup: {
        display: 'flex',
        gap: 4,
        background: '#f3f4f6',
        padding: 3,
        borderRadius: 8,
    },
    filterBtn: {
        border: 'none',
        borderRadius: 6,
        padding: '6px 12px',
        fontSize: '0.78rem',
        fontWeight: 700,
        cursor: 'pointer',
    },
    uploadBtn: {
        background: '#4F6BF6',
        color: 'white',
        border: 'none',
        borderRadius: 8,
        padding: '8px 16px',
        fontSize: '0.85rem',
        fontWeight: 700,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        minWidth: 100,
    },
    progressBar: {
        height: 3,
        background: '#e5e7eb',
        margin: '0 20px',
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
    },
    grid: {
        flex: 1,
        overflowY: 'auto',
        padding: 20,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
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
        position: 'relative',
    },
    thumbImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    videoBadge: {
        position: 'absolute',
        bottom: 6,
        left: 6,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        fontSize: '0.65rem',
        fontWeight: 800,
        padding: '2px 6px',
        borderRadius: 4,
        letterSpacing: '0.5px',
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