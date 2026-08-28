export default function PlayerPdf({ element }) {
    if (element.hidden) return null;

    const handleOpen = () => {
        if (element.src) window.open(element.src, '_blank', 'noopener,noreferrer');
    };

    return (
        <div
            style={{
                position: 'absolute',
                left: element.x + 'px',
                top: element.y + 'px',
                width: element.width + 'px',
                height: element.height + 'px',
            }}
        >
            <button
                onClick={handleOpen}
                disabled={!element.src}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: element.src ? '#eef2ff' : '#f9fafb',
                    border: `2px solid ${element.src ? '#4F6BF6' : '#e5e7eb'}`,
                    borderRadius: (element.bgCornerRadius || 12) + 'px',
                    padding: '0 16px',
                    cursor: element.src ? 'pointer' : 'not-allowed',
                    fontFamily: 'Nunito, sans-serif',
                    boxShadow: element.shadowEnabled
                        ? `0 4px 12px rgba(0,0,0,${element.shadowOpacity || 0.15})`
                        : 'none',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                    if (element.src) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(79,107,246,0.25)';
                    }
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = element.shadowEnabled
                        ? `0 4px 12px rgba(0,0,0,${element.shadowOpacity || 0.15})`
                        : 'none';
                }}
            >
                <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>📄</span>
                <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                    <div style={{
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        color: element.src ? '#4F6BF6' : '#9ca3af',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {element.label || element.originalName || 'Deschide documentul'}
                    </div>
                    {element.originalName && element.label && (
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600 }}>
                            {element.originalName}
                        </div>
                    )}
                </div>
                {element.src && (
                    <span style={{ fontSize: '1rem', color: '#4F6BF6', flexShrink: 0 }}>↗</span>
                )}
            </button>
        </div>
    );
}