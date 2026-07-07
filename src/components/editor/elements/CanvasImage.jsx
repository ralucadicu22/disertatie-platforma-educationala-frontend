import { useRef, useEffect, useState } from 'react';
import { Group, Rect, Image as KonvaImage, Text } from 'react-konva';
import useImage from 'use-image';

export default function CanvasImage({ element, isSelected, onSelect, onChange, onDragMove, onDragEnd,isLocked }) {
    const groupRef = useRef(null);
    const imageRef = useRef(null);
    const [image, status] = useImage(element.src || '', 'anonymous');

    useEffect(() => {
        if (imageRef.current) {
            imageRef.current.getLayer()?.batchDraw();
        }
    }, [element]);


    const getImageDimensions = () => {
        if (!image) return { width: element.width, height: element.height, x: 0, y: 0 };

        const naturalRatio = image.width / image.height;
        const boxRatio = element.width / element.height;

        if (element.fitMode === 'stretch') {
            return { width: element.width, height: element.height, x: 0, y: 0 };
        }

        if (element.fitMode === 'fill') {

            let w, h;
            if (naturalRatio > boxRatio) {
                h = element.height;
                w = h * naturalRatio;
            } else {
                w = element.width;
                h = w / naturalRatio;
            }
            return {
                width: w,
                height: h,
                x: (element.width - w) / 2,
                y: (element.height - h) / 2,
            };
        }


        let w, h;
        if (naturalRatio > boxRatio) {
            w = element.width;
            h = w / naturalRatio;
        } else {
            h = element.height;
            w = h * naturalRatio;
        }
        return {
            width: w,
            height: h,
            x: (element.width - w) / 2,
            y: (element.height - h) / 2,
        };
    };

    const imgDims = getImageDimensions();

    return (
        <Group
            ref={groupRef}
            id={element.id}
            x={element.x}
            y={element.y}
            rotation={element.rotation || 0}
            opacity={element.opacity}
            draggable={!isLocked}
            onClick={onSelect}
            onTap={onSelect}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onTransformEnd={(e) =>{
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

            <Rect
                width={element.width}
                height={element.height}
                fill={image ? undefined : '#e5e7eb'}
                stroke={
                    element.borderColor !== 'transparent'
                        ? element.borderColor
                        : (isSelected ? '#4F6BF6' : '#9ca3af')
                }
                strokeWidth={element.borderWidth || (isSelected ? 1 : 2)}
                dash={!image || (isSelected && element.borderColor === 'transparent') ? [8, 4] : undefined}
                cornerRadius={element.cornerRadius}
                shadowEnabled={element.shadowEnabled}
                shadowColor={element.shadowColor}
                shadowBlur={element.shadowBlur}
                shadowOpacity={element.shadowOpacity}
            />


            {image && status === 'loaded' && (
                <KonvaImage
                    ref={imageRef}
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


            {!image && (
                <Text
                    text="Imagine"
                    width={element.width}
                    height={element.height}
                    align="center"
                    verticalAlign="middle"
                    fontSize={14}
                    fontFamily="Nunito"
                    fontStyle="bold"
                    fill="#9ca3af"
                    listening={false}
                />
            )}


            {element.behavior !== 'static' && (
                <Text
                    text={getBehaviorIcon(element.behavior)}
                    x={4}
                    y={4}
                    fontSize={12}
                    fontFamily="Nunito"
                    fontStyle="bold"
                    fill="#4F6BF6"
                    listening={false}
                />
            )}
        </Group>
    );
}

function getBehaviorIcon(behavior) {
    switch (behavior) {
        case 'clickable': return '👆';
        case 'draggable': return '✥';
        case 'dropTarget': return '⊕';
        default: return '';
    }
}