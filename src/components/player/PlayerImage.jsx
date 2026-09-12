import { useEffect, useRef } from 'react';
import { Group, Rect, Image as KonvaImage, Text } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';

export default function PlayerImage({ element, interactionState, onElementClick }) {
    const [image, status] = useImage(element.src || '', 'anonymous');
    const groupRef = useRef(null);

    const isInteractive = element.behavior && element.behavior !== 'static';
    const isFound = interactionState === 'found';
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

    const getImageDimensions = () => {
        if (!image) return { width: element.width, height: element.height, x: 0, y: 0 };
        const naturalRatio = image.width / image.height;
        const boxRatio = element.width / element.height;
        if (element.fitMode === 'stretch') {
            return { width: element.width, height: element.height, x: 0, y: 0 };
        }
        if (element.fitMode === 'fill') {
            let w, h;
            if (naturalRatio > boxRatio) { h = element.height; w = h * naturalRatio; }
            else { w = element.width; h = w / naturalRatio; }
            return { width: w, height: h, x: (element.width - w) / 2, y: (element.height - h) / 2 };
        }
        let w, h;
        if (naturalRatio > boxRatio) { w = element.width; h = w / naturalRatio; }
        else { h = element.height; w = h / naturalRatio; }
        return { width: w, height: h, x: (element.width - w) / 2, y: (element.height - h) / 2 };
    };

    const imgDims = getImageDimensions();

    return (
        <Group
            ref={groupRef}
            x={element.x}
            y={element.y}
            rotation={element.rotation || 0}
            opacity={isFound ? 0.4 : (element.opacity ?? 1)}
        >
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

            {image && status === 'loaded' && (
                <KonvaImage
                    image={image}
                    x={imgDims.x}
                    y={imgDims.y}
                    width={imgDims.width}
                    height={imgDims.height}
                    listening={false}
                    crop={
                        element.cropWidth < 1 || element.cropHeight < 1
                            ? {
                                x: element.cropX * image.width,
                                y: element.cropY * image.height,
                                width: element.cropWidth * image.width,
                                height: element.cropHeight * image.height,
                            }
                            : undefined
                    }
                />
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
        </Group>
    );
}