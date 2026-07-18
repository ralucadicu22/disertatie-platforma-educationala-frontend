import { useEffect, useRef } from 'react';
import { Group, Rect, Circle, Line, RegularPolygon, Text } from 'react-konva';
import Konva from 'konva';

export default function PlayerShape({ element, interactionState, onElementClick }) {
    const groupRef = useRef(null);
    const isInteractive = element.behavior && element.behavior !== 'static';
    const isFound = interactionState === 'found' || interactionState === 'correct';
    const isShaking = interactionState === 'shake';
    const isSelected = interactionState === 'selected';
    const isIncorrect = interactionState === 'incorrect';
    const isMissed = interactionState === 'missed';

    useEffect(() => {
        if (!isShaking || !groupRef.current) return;
        const node = groupRef.current;
        const originX = element.x;
        const tween = new Konva.Tween({
            node, duration: 0.06, x: originX + 8, yoyo: true, easing: Konva.Easings.EaseInOut,
        });
        let count = 0;
        const runShake = () => {
            if (count >= 4) { node.x(originX); return; }
            count += 1;
            tween.reset();
            tween.play();
        };
        tween.onFinish = runShake;
        runShake();
        return () => tween.destroy();
    }, [isShaking]);

    if (element.hidden) return null;

    const opacity = (isFound || isIncorrect) ? 0.4 : (element.opacity ?? 1);

    const commonProps = {
        fill: element.fill,
        stroke: element.stroke,
        strokeWidth: element.strokeWidth,
        shadowEnabled: element.shadowEnabled,
        shadowColor: element.shadowColor,
        shadowBlur: element.shadowBlur,
        shadowOpacity: element.shadowOpacity,
        opacity,
        listening: false,
    };

    const renderShape = () => {
        switch (element.shapeType) {
            case 'circle':
                return <Circle {...commonProps} x={element.width / 2} y={element.height / 2} radius={Math.min(element.width, element.height) / 2} />;
            case 'line':
                return <Line {...commonProps} points={[0, element.height / 2, element.width, element.height / 2]} fill={undefined} stroke={element.fill} strokeWidth={Math.max(element.strokeWidth, 4)} />;
            case 'polygon':
                return <RegularPolygon {...commonProps} x={element.width / 2} y={element.height / 2} sides={6} radius={Math.min(element.width, element.height) / 2} />;
            case 'rect':
            default:
                return <Rect {...commonProps} width={element.width} height={element.height} cornerRadius={element.cornerRadius} />;
        }
    };

    return (
        <Group ref={groupRef} x={element.x} y={element.y} rotation={element.rotation || 0}>
            <Rect
                width={element.width}
                height={element.height}
                fill="rgba(0,0,0,0.001)"
                listening={isInteractive}
                onClick={() => isInteractive && onElementClick(element)}
                onTap={() => isInteractive && onElementClick(element)}
            />

            {renderShape()}

            {isShaking && (
                <Rect width={element.width} height={element.height} fill="#ef4444" opacity={0.35} listening={false} />
            )}

            {isSelected && (
                <Rect width={element.width} height={element.height} stroke="#4F6BF6" strokeWidth={4} listening={false} />
            )}

            {isMissed && (
                <Rect width={element.width} height={element.height} stroke="#f59e0b" strokeWidth={3} dash={[8, 4]} listening={false} />
            )}

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

            {isIncorrect && (
                <Text
                    text="✕"
                    width={element.width}
                    height={element.height}
                    align="center"
                    verticalAlign="middle"
                    fontSize={Math.min(element.width, element.height) * 0.4}
                    fontStyle="bold"
                    fill="#dc2626"
                    listening={false}
                />
            )}
        </Group>
    );
}