import { useEffect, useRef } from 'react';
import { Group, Circle } from 'react-konva';
import Konva from 'konva';

const PARTICLE_COLORS = ['#4F6BF6', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#a855f7'];

export default function ParticleBurst({ x, y, onComplete }) {
    const groupRef = useRef(null);

    useEffect(() => {
        const group = groupRef.current;
        if (!group) return;

        const particles = group.getChildren();
        const tweens = particles.map((particle, i) => {
            const angle = (Math.PI * 2 * i) / particles.length;
            const distance = 36 + Math.random() * 20;
            return new Konva.Tween({
                node: particle,
                duration: 0.45,
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                opacity: 0,
                scaleX: 0.3,
                scaleY: 0.3,
                easing: Konva.Easings.EaseOut,
            });
        });

        tweens.forEach(t => t.play());
        const timeout = setTimeout(onComplete, 500);

        return () => {
            tweens.forEach(t => t.destroy());
            clearTimeout(timeout);
        };
    }, [onComplete]);

    return (
        <Group ref={groupRef} x={x} y={y} listening={false}>
            {PARTICLE_COLORS.map((color, i) => (
                <Circle key={i} x={0} y={0} radius={5} fill={color} opacity={1} />
            ))}
        </Group>
    );
}