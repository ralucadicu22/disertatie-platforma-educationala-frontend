import { useEffect, useRef } from 'react';
import { Group, Rect, Text } from 'react-konva';
import Konva from 'konva';

export default function PlayerHotspot({ element, interactionState, onElementClick }) {
    const groupRef = useRef(null);

    const isFound = interactionState === 'found';
    const isWrong = interactionState === 'wrong';
    const isShaking = interactionState === 'shake';
    const isHighlighted = interactionState === 'highlight';

    useEffect(() => {
        if (!isShaking || !groupRef.current) return;
        const node = groupRef.current;
        const originX = element.x;
        const tween = new Konva.Tween({
            node, duration: 0.06, x: originX + 8, yoyo: true,
            easing: Konva.Easings.EaseInOut,
        });
        let count = 0;
        const run = () => {
            if (count >= 4) { node.x(originX); return; }
            count++;
            tween.reset();
            tween.play();
        };
        tween.onFinish = run;
        run();
        return () => tween.destroy();
    }, [isShaking]);

    useEffect(() => {
        if (!isHighlighted || !groupRef.current) return;
        const node = groupRef.current;
        const tween = new Konva.Tween({
            node, duration: 0.5, scaleX: 1.08, scaleY: 1.08,
            easing: Konva.Easings.EaseInOut, yoyo: true,
            onFinish: () => { node.scaleX(1); node.scaleY(1); },
        });
        tween.play();
        return () => tween.destroy();
    }, [isHighlighted]);

    if (element.hidden) return null;

    const getFill = () => {
        if (isFound) return 'rgba(34, 197, 94, 0.4)';
        if (isWrong || isShaking) return 'rgba(239, 68, 68, 0.35)';
        if (isHighlighted) return 'rgba(245, 158, 11, 0.3)';
        return 'rgba(0, 0, 0, 0.001)';
    };

    const getStroke = () => {
        if (isFound) return '#16a34a';
        if (isWrong || isShaking) return '#ef4444';
        if (isHighlighted) return '#f59e0b';
        return 'transparent';
    };

    return (
        <Group
            ref={groupRef}
            x={element.x}
            y={element.y}
            rotation={element.rotation || 0}
            onClick={(e) => { e.cancelBubble = true; onElementClick(element); }}
            onTap={(e) => { e.cancelBubble = true; onElementClick(element); }}
        >
            <Rect
                width={element.width}
                height={element.height}
                fill={getFill()}
                stroke={getStroke()}
                strokeWidth={2}
                cornerRadius={element.cornerRadius || 8}
                listening={true}
            />
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

            {(isShaking || isWrong) && (
                <Text
                    text="✗"
                    width={element.width}
                    height={element.height}
                    align="center"
                    verticalAlign="middle"
                    fontSize={Math.min(element.width, element.height) * 0.4}
                    fontStyle="bold"
                    fill="#ef4444"
                    listening={false}
                />
            )}
        </Group>
    );
}
