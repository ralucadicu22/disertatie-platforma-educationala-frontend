import { useRef, useEffect, useState } from 'react';
import { Group, Rect, Text } from 'react-konva';
import { Html } from 'react-konva-utils';
import { formatListText } from '../../../utils/textFormat';

export default function CanvasText({ element, isSelected, onSelect, onChange, onDragMove, onDragEnd, isLocked }) {
    const [isEditing, setIsEditing] = useState(false);
    const textRef = useRef(null);
    const groupRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        if (element.autoExpand && textRef.current) {
            const textNode = textRef.current;
            const textHeight = textNode.getSelfRect().height;
            if (textHeight > 0 && Math.abs(textHeight + (element.padding || 0) * 2 - element.height) > 2) {
                onChange({ height: textHeight + (element.padding || 0) * 2 + 8 });
            }
        }
    }, [element.text, element.fontSize, element.lineHeight, element.autoExpand]);

    useEffect(() => {
        if (textRef.current) {
            textRef.current.getLayer()?.batchDraw();
        }
    }, [element]);

    const getIndentedText = (text) => {
        if (!element.indent || element.indent === 0) return text;
        const indent = '    '.repeat(element.indent); // 4 spații per nivel
        return text.split('\n').map(line => line ? indent + line : line).join('\n');
    };

    const formattedText = getIndentedText(formatListText(element.text, element.listStyle));

    const handleDblClick = () => setIsEditing(true);

    const handleEditEnd = (newText) => {
        setIsEditing(false);
        const updates = { text: newText };
        if (element.autoExpand && textareaRef.current) {
            const scrollH = textareaRef.current.scrollHeight;
            updates.height = Math.max(element.height, scrollH + 8);
        }
        onChange(updates);
    };
    const handleTextareaInput = (e) => {
        if (element.autoExpand) {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
        }
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
                    height: element.autoExpand ? element.height : Math.max(20, element.height * scaleY),
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
                        ref={textareaRef}
                        autoFocus
                        defaultValue={element.text}
                        onInput={handleTextareaInput}
                        onBlur={(e) => handleEditEnd(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') setIsEditing(false);
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                handleEditEnd(e.target.value);
                            }
                        }}
                        style={{
                            width: element.width,
                            height: element.autoExpand ? 'auto' : element.height,
                            minHeight: element.autoExpand ? element.height : undefined,
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
                            resize: element.autoExpand ? 'none' : 'none',
                            background: 'white',
                            boxSizing: 'border-box',
                            overflow: element.autoExpand ? 'hidden' : 'auto',
                        }}
                    />
                </Html>
            )}
        </Group>
    );
}