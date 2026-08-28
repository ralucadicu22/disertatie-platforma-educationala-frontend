import { useRef, useEffect } from 'react';
import { Group, Rect, Text } from 'react-konva';

export default function CanvasPdf({
                                      element, isSelected, onSelect, onChange, onDragMove, onDragEnd, isLocked,
                                  }) {
    const groupRef = useRef(null);

    useEffect(() => {
        if (groupRef.current) groupRef.current.getLayer()?.batchDraw();
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

    const handleDragStart = (e) => {
        e.cancelBubble = true;
        if (e.evt) e.evt.stopPropagation();
    };

    const hasFile = !!element.src;
    const bgColor = hasFile ? '#eef2ff' : '#f9fafb';
    const borderColor = isSelected ? '#4F6BF6' : (hasFile ? '#4F6BF6' : '#e5e7eb');

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
            onDragStart={handleDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onTransformEnd={(e) => {
                const node = e.target;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();
                node.scaleX(1);
                node.scaleY(1);
                onChange({
                    x: node.x(), y: node.y(),
                    width: Math.max(120, element.width * scaleX),
                    height: Math.max(50, element.height * scaleY),
                    rotation: node.rotation(),
                });
            }}
        >
            <Rect
                width={element.width}
                height={element.height}
                fill={bgColor}
                stroke={borderColor}
                strokeWidth={isSelected ? 2 : 1.5}
                cornerRadius={element.bgCornerRadius || 12}
                shadowEnabled={element.shadowEnabled}
                shadowColor={element.shadowColor}
                shadowBlur={element.shadowBlur}
                shadowOpacity={element.shadowOpacity}
                listening={false}
            />

            <Text
                text="📄"
                x={16}
                y={0}
                width={32}
                height={element.height}
                fontSize={24}
                verticalAlign="middle"
                listening={false}
            />


            <Text
                text={hasFile
                    ? (element.originalName || element.label || 'Document PDF')
                    : '⚠ Fără fișier PDF'}
                x={52}
                y={0}
                width={element.width - 68}
                height={element.height}
                fontSize={14}
                fontFamily="Nunito"
                fontStyle="bold"
                fill={hasFile ? '#4F6BF6' : '#9ca3af'}
                verticalAlign="middle"
                wrap="none"
                ellipsis={true}
                listening={false}
            />


            {hasFile && (
                <Text
                    text="↗"
                    x={element.width - 28}
                    y={0}
                    width={24}
                    height={element.height}
                    fontSize={16}
                    fontStyle="bold"
                    fill="#4F6BF6"
                    verticalAlign="middle"
                    align="center"
                    listening={false}
                />
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