import { useEffect, useRef } from 'react';
import { Group, Rect, Circle, Line, RegularPolygon, Text } from 'react-konva';
import Konva from 'konva';

export default function PlayerShape({ element, interactionState, onElementClick }) {
    const groupRef = useRef(null);

    const isInteractive = element.behavior && element.behavior !== 'static';
    const isFound = interactionState === 'found';
    const isWrong = interactionState === 'wrong';
    const isShaking = interactionState === 'shake';
    const isHighlighted = interactionState === 'highlight';
    const isAnimating = interactionState === 'animate';

    useEffect(() => {
        if (!isShaking || !groupRef.current) return;
        const node = groupRef.current;
        const originX = element.x;
        const tween = new Konva.Tween({
            node, duration: 0.06, x: originX + 8, yoyo: true,
            easing: Konva.Easings.EaseInOut,
        });
        let count = 0;
        const runShake = () => {
            if (count >= 4) { node.x(originX); return; }
            count++;
            tween.reset();
            tween.play();
        };
        tween.onFinish = runShake;
        runShake();
        return () => tween.destroy();
    }, [isShaking]);

    useEffect(() => {
        if (!isHighlighted || !groupRef.current) return;
        const node = groupRef.current;
        const tween = new Konva.Tween({
            node, duration: 0.5,
            scaleX: 1.08, scaleY: 1.08,
            easing: Konva.Easings.EaseInOut,
            yoyo: true,
            onFinish: () => { node.scaleX(1); node.scaleY(1); },
        });
        tween.play();
        return () => tween.destroy();
    }, [isHighlighted]);

    useEffect(() => {
        if (!isAnimating || !groupRef.current) return;
        const node = groupRef.current;
        const originY = element.y;
        const tween = new Konva.Tween({
            node, duration: 0.3,
            y: originY - 20,
            easing: Konva.Easings.EaseOut,
            yoyo: true,
            onFinish: () => { node.y(originY); },
        });
        tween.play();
        return () => tween.destroy();
    }, [isAnimating]);

    if (element.hidden) return null;

    const commonProps = {
        fill: element.fill,
        stroke: element.stroke,
        strokeWidth: element.strokeWidth,
        shadowEnabled: element.shadowEnabled,
        shadowColor: element.shadowColor,
        shadowBlur: element.shadowBlur,
        shadowOpacity: element.shadowOpacity,
        opacity: isFound ? 0.35 : (element.opacity ?? 1),
        listening: false,
    };

    const renderShape = () => {
        switch (element.shapeType) {
            case 'circle':
                return (
                    <Circle
                        {...commonProps}
                        x={element.width / 2}
                        y={element.height / 2}
                        radius={Math.min(element.width, element.height) / 2}
                    />
                );
            case 'line':
                return (
                    <Line
                        {...commonProps}
                        points={[0, element.height / 2, element.width, element.height / 2]}
                        fill={undefined}
                        stroke={element.fill}
                        strokeWidth={Math.max(element.strokeWidth, 4)}
                    />
                );
            case 'polygon':
                return (
                    <RegularPolygon
                        {...commonProps}
                        x={element.width / 2}
                        y={element.height / 2}
                        sides={6}
                        radius={Math.min(element.width, element.height) / 2}
                    />
                );
            case 'rect':
            default:
                return (
                    <Rect
                        {...commonProps}
                        width={element.width}
                        height={element.height}
                        cornerRadius={element.cornerRadius}
                    />
                );
        }
    };

    return (
        <Group
            ref={groupRef}
            x={element.x}
            y={element.y}
            rotation={element.rotation || 0}
        >
            {isWrong && (
                <Rect
                    x={-4} y={-4}
                    width={element.width + 8}
                    height={element.height + 8}
                    fill="rgba(239, 68, 68, 0.18)"
                    stroke="#ef4444"
                    strokeWidth={3}
                    cornerRadius={6}
                    listening={false}
                />
            )}

            {isHighlighted && (
                <Rect
                    x={-6} y={-6}
                    width={element.width + 12}
                    height={element.height + 12}
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth={4}
                    cornerRadius={8}
                    dash={[8, 4]}
                    listening={false}
                />
            )}

            {isAnimating && (
                <Rect
                    x={-4} y={-4}
                    width={element.width + 8}
                    height={element.height + 8}
                    fill="rgba(139, 92, 246, 0.15)"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    cornerRadius={6}
                    listening={false}
                />
            )}

            <Rect
                width={element.width}
                height={element.height}
                fill="rgba(0,0,0,0.001)"
                listening={isInteractive}
                onClick={() => isInteractive && onElementClick(element)}
                onTap={() => isInteractive && onElementClick(element)}
            />

            {renderShape()}

            {isFound && (
                <Text
                    text="✓"
                    width={element.width}
                    height={element.height}
                    align="center"
                    verticalAlign="middle"
                    fontSize={Math.min(element.width, element.height) * 0.4}
                    fontStyle="bold"
                    fill="#16a34a"
                    listening={false}
                />
            )}
        </Group>
    );
}
