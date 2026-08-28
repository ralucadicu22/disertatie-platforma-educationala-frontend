import { useEffect, useRef } from 'react';
import { Group, Rect } from 'react-konva';
import { Html } from 'react-konva-utils';

export default function PlayerVideo({ element }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && element.autoplay && element.src) {
            videoRef.current.play().catch(() => {});
        }
    }, [element.src, element.autoplay]);

    if (element.hidden) return null;

    if (!element.src) {

        return (
            <Group x={element.x} y={element.y} rotation={element.rotation || 0}>
                <Rect
                    width={element.width}
                    height={element.height}
                    fill="#1a1d23"
                    cornerRadius={element.cornerRadius || 8}
                    listening={false}
                />
            </Group>
        );
    }

    return (
        <Group x={element.x} y={element.y} rotation={element.rotation || 0}>
            <Html
                divProps={{
                    style: {
                        pointerEvents: 'auto',
                    },
                }}
            >
                <div
                    style={{
                        width: element.width + 'px',
                        height: element.height + 'px',
                        borderRadius: (element.cornerRadius || 8) + 'px',
                        overflow: 'hidden',
                        background: '#1a1d23',
                        boxShadow: element.shadowEnabled
                            ? `0 ${element.shadowBlur || 8}px ${element.shadowBlur || 8}px rgba(0,0,0,${element.shadowOpacity ?? 0.3})`
                            : 'none',
                    }}
                >
                    <video
                        ref={videoRef}
                        src={element.src}
                        poster={element.posterSrc || undefined}
                        autoPlay={element.autoplay}
                        loop={element.loop}
                        muted={element.muted}
                        controls={element.controls}
                        playsInline
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: element.opacity ?? 1,
                            display: 'block',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            </Html>
        </Group>
    );
}