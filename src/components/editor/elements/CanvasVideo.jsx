import { useRef, useEffect } from 'react';
import { Group, Rect, Image as KonvaImage, Text } from 'react-konva';
import useImage from 'use-image';

export default function CanvasVideo({
                                        element, isSelected, onSelect, onChange, onDragMove, onDragEnd, isLocked,
                                    }) {
    const groupRef = useRef(null);
    const [posterImage] = useImage(element.posterSrc || '', 'anonymous');

    useEffect(() => {
        if (groupRef.current) {
            groupRef.current.getLayer()?.batchDraw();
        }
    }, [element]);

    const handleSelect = (e) => {
        e.cancelBubble = true;
        if (e.evt) e.evt.stopPropagation();
        onSelect(e);
    };

    const handleMouseDown = (e) => {
        e.cancelBubble = true;
        if (e.evt) e.evt.stopPropagation();
    };

    return (
        <Group
            ref={groupRef}
            id={element.id}
            x={element.x}
            y={element.y}
            rotation={element.rotation || 0}
            draggable={!isLocked}
            onClick={handleSelect}
            onTap={handleSelect}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onTransformEnd={(e) => {
                const node = e.target;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();
                node.scaleX(1);
                node.scaleY(1);
                onChange({
                    x: node.x(),
                    y: node.y(),
                    width: Math.max(80, element.width * scaleX),
                    height: Math.max(60, element.height * scaleY),
                    rotation: node.rotation(),
                });
            }}
        >
            <Rect
                width={element.width}
                height={element.height}
                fill="#1a1d23"
                cornerRadius={element.cornerRadius || 8}
                shadowEnabled={element.shadowEnabled}
                shadowColor={element.shadowColor}
                shadowBlur={element.shadowBlur}
                shadowOpacity={element.shadowOpacity}
                listening={false}
            />

            {posterImage && (
                <KonvaImage
                    image={posterImage}
                    width={element.width}
                    height={element.height}
                    cornerRadius={element.cornerRadius || 8}
                    opacity={element.opacity ?? 1}
                    listening={false}
                />
            )}

            <Rect
                x={element.width / 2 - 30}
                y={element.height / 2 - 30}
                width={60}
                height={60}
                fill="rgba(0,0,0,0.6)"
                cornerRadius={30}
                listening={false}
            />
            <Text
                x={element.width / 2 - 12}
                y={element.height / 2 - 18}
                text="▶"
                fontSize={36}
                fill="white"
                fontStyle="bold"
                listening={false}
            />

            {/* Label jos */}
            {!element.src && (
                <Text
                    x={0}
                    y={element.height + 6}
                    width={element.width}
                    text="⚠ Fără sursă video"
                    fontSize={11}
                    align="center"
                    fill="#dc2626"
                    fontStyle="bold"
                    listening={false}
                />
            )}

            {(element.autoplay || element.loop || !element.muted) && (
                <Group x={element.width - 90} y={6}>
                    <Rect width={84} height={20} fill="rgba(0,0,0,0.6)" cornerRadius={4} listening={false} />
                    <Text
                        x={0} y={0}
                        width={84} height={20}
                        text={[
                            element.autoplay && 'AUTO',
                            element.loop && 'LOOP',
                            !element.muted && '🔊',
                        ].filter(Boolean).join(' · ')}
                        fontSize={10}
                        fill="white"
                        align="center"
                        verticalAlign="middle"
                        fontStyle="bold"
                        listening={false}
                    />
                </Group>
            )}

            <Rect
                width={element.width}
                height={element.height}
                fill="rgba(0,0,0,0.001)"
                listening={true}
            />
        </Group>
    );
}