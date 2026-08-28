import { useRef, useEffect } from 'react';
import { Group, Rect, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

export default function CanvasImage({ element, isSelected, onSelect, onChange, onDragMove, onDragEnd, isLocked }) {
    const [image, status] = useImage(element.src || '', 'anonymous');
    const groupRef = useRef(null);

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

    const getImageDimensions = () => {
        if (!image) return { width: element.width, height: element.height, x: 0, y: 0 };
        const naturalRatio = image.width / image.height;
        const boxRatio = element.width / element.height;
        if (element.fitMode === 'stretch') return { width: element.width, height: element.height, x: 0, y: 0 };
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
            id={element.id}
            x={element.x}
            y={element.y}
            rotation={element.rotation || 0}
            draggable={!isLocked}
            opacity={element.opacity ?? 1}
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
                    width: Math.max(20, element.width * scaleX),
                    height: Math.max(20, element.height * scaleY),
                    rotation: node.rotation(),
                });
            }}
        >
            {(element.borderColor !== 'transparent' && element.borderWidth > 0) && (
                <Rect
                    width={element.width}
                    height={element.height}
                    stroke={element.borderColor}
                    strokeWidth={element.borderWidth}
                    cornerRadius={element.cornerRadius}
                    shadowEnabled={element.shadowEnabled}
                    shadowColor={element.shadowColor}
                    shadowBlur={element.shadowBlur}
                    shadowOpacity={element.shadowOpacity}
                    listening={false}
                />
            )}

            {image && status === 'loaded' && (
                <KonvaImage
                    image={image}
                    x={imgDims.x}
                    y={imgDims.y}
                    width={imgDims.width}
                    height={imgDims.height}
                    cornerRadius={element.cornerRadius}
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

            {(!image || status !== 'loaded') && (
                <Rect
                    width={element.width}
                    height={element.height}
                    fill={isSelected ? '#eef2ff' : '#f3f4f6'}
                    stroke={isSelected ? '#4F6BF6' : '#d1d5db'}
                    strokeWidth={2}
                    dash={[6, 4]}
                    cornerRadius={element.cornerRadius}
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