import { useEffect, useRef } from 'react';
import { Group, Rect, Image as KonvaImage, Text } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';

export default function PlayerImage({ element, interactionState, onElementClick }) {
    const [image, status] = useImage(element.src || '', 'anonymous');
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
    const opacity = (isFound || isIncorrect) ? 0.5 : (element.opacity ?? 1);

    return (
        <Group
            ref={groupRef}
            x={element.x}
            y={element.y}
            rotation={element.rotation || 0}
            opacity={opacity}
        >
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

            {isShaking && (
                <Rect width={element.width} height={element.height} fill="#ef4444" opacity={0.35} listening={false} />
            )}

            {isSelected && (
                <Rect
                    width={element.width} height={element.height}
                    stroke="#4F6BF6" strokeWidth={4} cornerRadius={element.cornerRadius}
                    listening={false}
                />
            )}

            {isMissed && (
                <Rect
                    width={element.width} height={element.height}
                    stroke="#f59e0b" strokeWidth={3} dash={[8, 4]} cornerRadius={element.cornerRadius}
                    listening={false}
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