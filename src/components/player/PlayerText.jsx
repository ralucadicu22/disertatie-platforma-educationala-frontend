import { Group, Rect, Text } from 'react-konva';
import { formatListText } from '../../utils/textFormat';

export default function PlayerText({ element }) {
    if (element.hidden) return null;

    const formattedText = formatListText(element.text, element.listStyle);

    return (
        <Group x={element.x} y={element.y} rotation={element.rotation || 0} listening={false}>
            <Rect
                width={element.width}
                height={element.height}
                fill={element.bgFill !== 'transparent' ? element.bgFill : undefined}
                stroke={element.bgStroke !== 'transparent' ? element.bgStroke : undefined}
                strokeWidth={element.bgStrokeWidth}
                cornerRadius={element.bgCornerRadius}
            />
            <Text
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
        </Group>
    );
}