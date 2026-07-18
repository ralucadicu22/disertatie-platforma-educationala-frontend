import { useRef, useEffect, useState } from 'react';
import { Group, Rect, Text } from 'react-konva';
import { Html } from 'react-konva-utils';
import { formatListText } from '../../../utils/textFormat';
export default function CanvasText({ element, isSelected, onSelect, onChange, onDragMove, onDragEnd,isLocked }) {
    const [isEditing, setIsEditing] = useState(false);
    const textRef = useRef(null);
    const groupRef = useRef(null);


    useEffect(() => {
        if (textRef.current) {
            textRef.current.getLayer()?.batchDraw();
        }
    }, [element]);

    const formattedText = formatListText(element.text, element.listStyle);

    const handleDblClick = () => {
        setIsEditing(true);
    };

    const handleEditEnd = (newText) => {
        setIsEditing(false);
        onChange({ text: newText });
    };

    return (
        <Group
            ref={groupRef}
            id={element.id}
            x={element.x}
            y={element.y}
            rotation={element.rotation || 0}
            draggable={!isLocked}
            onClick={onSelect}
            onTap={onSelect}
            onDblClick={handleDblClick}
            onDblTap={handleDblClick}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onTransformEnd={(e) =>  onChange({ x: e.target.x(), y: e.target.y() })}
            onTransformEnd={(e) => {
                const node = e.target;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();
                node.scaleX(1);
                node.scaleY(1);
                onChange({
                    x: node.x(),
                    y: node.y(),
                    width: Math.max(40, element.width * scaleX),
                    height: Math.max(20, element.height * scaleY),
                    rotation: node.rotation(),
                });
            }}
        >

            <Rect
                width={element.width}
                height={element.height}
                fill={element.bgFill !== 'transparent' ? element.bgFill : 'rgba(0,0,0,0.001)'}
                stroke={
                    isSelected && element.bgStroke === 'transparent'
                        ? '#4F6BF6'
                        : (element.bgStroke !== 'transparent' ? element.bgStroke : undefined)
                }
                strokeWidth={
                    isSelected && element.bgStroke === 'transparent'
                        ? 1
                        : element.bgStrokeWidth
                }
                dash={isSelected && element.bgStroke === 'transparent' ? [4, 4] : undefined}
                cornerRadius={element.bgCornerRadius}
            />


            {!isEditing && (
                <Text
                    ref={textRef}
                    text={formattedText}
                    width={element.width}
                    height={element.height}
                    fontSize={element.fontSize}
                    fontFamily={element.fontFamily}
                    fontStyle={element.fontStyle}
                    textDecoration={element.textDecoration}
                    fill={element.fill}
                    align={element.align}
                    verticalAlign={element.verticalAlign}
                    letterSpacing={element.letterSpacing}
                    lineHeight={element.lineHeight}
                    padding={element.padding}
                    shadowEnabled={element.shadowEnabled}
                    shadowColor={element.shadowColor}
                    shadowBlur={element.shadowBlur}
                    shadowOpacity={element.shadowOpacity}
                />
            )}


            {isEditing && (
                <Html
                    groupProps={{ x: 0, y: 0 }}
                    divProps={{ style: { pointerEvents: 'auto' } }}
                >
                    <textarea
                        autoFocus
                        defaultValue={element.text}
                        onBlur={(e) => handleEditEnd(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                setIsEditing(false);
                            }

                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                handleEditEnd(e.target.value);
                            }
                        }}
                        style={{
                            width: element.width,
                            height: element.height,
                            fontSize: element.fontSize,
                            fontFamily: element.fontFamily,
                            fontWeight: element.fontStyle?.includes('bold') ? 'bold' : 'normal',
                            fontStyle: element.fontStyle?.includes('italic') ? 'italic' : 'normal',
                            textDecoration: element.textDecoration,
                            color: element.fill,
                            textAlign: element.align,
                            lineHeight: element.lineHeight,
                            letterSpacing: `${element.letterSpacing}px`,
                            padding: element.padding,
                            border: '2px solid #4F6BF6',
                            borderRadius: 4,
                            outline: 'none',
                            resize: 'none',
                            background: 'white',
                            boxSizing: 'border-box',
                        }}
                    />
                </Html>
            )}
        </Group>
    );
}


