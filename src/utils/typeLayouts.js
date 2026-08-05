import { ELEMENT_TYPES } from '../constants/elementTypes';
import { DEFAULT_CANVAS } from '../constants/canvas';

const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

function makeBox({ id, x, y, width, height, role, bgFill = '#ffffff', bgStroke = '#e5e7eb', bgStrokeWidth = 2, bgCornerRadius = 16 }) {
    return {
        id, type: ELEMENT_TYPES.BOX,
        x, y, width, height, rotation: 0,
        bgFill, bgStroke, bgStrokeWidth, bgCornerRadius, padding: 16,
        shadowEnabled: false, shadowColor: '#000000', shadowBlur: 8, shadowOpacity: 0.15,
        parentId: null,
        role,
        locked: false, hidden: false,
    };
}

function makeText({ id, x, y, width, height, text, fontSize = 24, fontStyle = 'normal', fill = '#1a1d23', align = 'center', parentId = null }) {
    return {
        id, type: ELEMENT_TYPES.TEXT,
        x, y, width, height, rotation: 0,
        text, fontFamily: 'Nunito', fontSize, fontStyle, textDecoration: '',
        fill, align, verticalAlign: 'middle',
        letterSpacing: 0, lineHeight: 1.2, padding: 12,
        bgFill: 'transparent', bgStroke: 'transparent', bgStrokeWidth: 0, bgCornerRadius: 0,
        shadowEnabled: false, shadowColor: '#000000', shadowBlur: 4, shadowOpacity: 0.3,
        listStyle: 'none',
        parentId,
        locked: false, hidden: false,
    };
}

function findAndSelectLayout() {
    const W = DEFAULT_CANVAS.width;
    const H = DEFAULT_CANVAS.height;

    // Proportii clare: text 12%, imagine 68%, solutii 20%, cu 3% margini/gap
    const marginX = W * 0.03;
    const marginY = H * 0.03;
    const gap = H * 0.02;

    const textZoneH = H * 0.12;
    const solutionsZoneH = H * 0.18;
    const imageZoneH = H - textZoneH - solutionsZoneH - marginY * 2 - gap * 2;

    const zoneW = W - marginX * 2;

    const textZoneY = marginY;
    const imageZoneY = textZoneY + textZoneH + gap;
    const solutionsZoneY = imageZoneY + imageZoneH + gap;

    const textZoneId = generateId('box_text_zone');
    const imageZoneId = generateId('box_image_zone');
    const solutionsZoneId = generateId('box_solutions_zone');

    return [
        makeBox({
            id: textZoneId,
            x: marginX, y: textZoneY,
            width: zoneW, height: textZoneH,
            role: 'text-zone',
            bgFill: 'transparent',
            bgStroke: '#d1d9f6', bgStrokeWidth: 2, bgCornerRadius: 16,
        }),
        makeText({
            id: generateId('el_title'),
            x: 0, y: 0,
            width: zoneW, height: textZoneH,
            text: 'Găsește și selectează [obiectele indicate]',
            fontSize: 32, fontStyle: 'bold',
            parentId: textZoneId,
        }),

        makeBox({
            id: imageZoneId,
            x: marginX, y: imageZoneY,
            width: zoneW, height: imageZoneH,
            role: 'image-zone',
            bgFill: '#ffffff',
            bgStroke: '#d1d9f6', bgStrokeWidth: 2, bgCornerRadius: 16,
        }),

        makeBox({
            id: solutionsZoneId,
            x: marginX, y: solutionsZoneY,
            width: zoneW, height: solutionsZoneH,
            role: 'solutions-zone',
            bgFill: '#f9fafb',
            bgStroke: '#e5e7eb', bgStrokeWidth: 1, bgCornerRadius: 10,
        }),
        makeText({
            id: generateId('el_solutions_hint'),
            x: 0, y: 0,
            width: zoneW, height: solutionsZoneH,
            text: 'Zonă de soluții — progresul elevului va apărea aici',
            fontSize: 16, fontStyle: 'italic', fill: '#9ca3af',
            parentId: solutionsZoneId,
        }),
    ];
}

function dragAndDropLayout() {
    const W = DEFAULT_CANVAS.width;
    const H = DEFAULT_CANVAS.height;

    const marginX = W * 0.03;
    const marginY = H * 0.03;
    const gap = W * 0.02;

    const textZoneH = H * 0.12;
    const zonesH = H - textZoneH - marginY * 2 - H * 0.02;
    const zoneW = (W - marginX * 2 - gap) / 2;

    const textZoneY = marginY;
    const zonesY = textZoneY + textZoneH + H * 0.02;

    const textZoneId = generateId('box_text_zone');
    const sourceZoneId = generateId('box_source_zone');
    const targetZoneId = generateId('box_target_zone');

    return [
        makeBox({
            id: textZoneId,
            x: marginX, y: textZoneY,
            width: W - marginX * 2, height: textZoneH,
            role: 'text-zone',
            bgFill: 'transparent',
            bgStroke: '#d1d9f6', bgStrokeWidth: 2,
        }),
        makeText({
            id: generateId('el_title'),
            x: 0, y: 0,
            width: W - marginX * 2, height: textZoneH,
            text: 'Trage fiecare obiect în zona corectă',
            fontSize: 32, fontStyle: 'bold',
            parentId: textZoneId,
        }),

        makeBox({
            id: sourceZoneId,
            x: marginX, y: zonesY,
            width: zoneW, height: zonesH,
            role: 'source-zone',
            bgFill: '#ffffff',
            bgStroke: '#d1d9f6', bgStrokeWidth: 2,
        }),
        makeText({
            id: generateId('el_source_hint'),
            x: 0, y: 0,
            width: zoneW, height: 40,
            text: 'Obiecte de tras',
            fontSize: 16, fontStyle: 'italic', fill: '#9ca3af',
            parentId: sourceZoneId,
        }),

        makeBox({
            id: targetZoneId,
            x: marginX + zoneW + gap, y: zonesY,
            width: zoneW, height: zonesH,
            role: 'target-zone',
            bgFill: '#ffffff',
            bgStroke: '#d1fae5', bgStrokeWidth: 2,
        }),
        makeText({
            id: generateId('el_target_hint'),
            x: 0, y: 0,
            width: zoneW, height: 40,
            text: 'Zone destinație',
            fontSize: 16, fontStyle: 'italic', fill: '#9ca3af',
            parentId: targetZoneId,
        }),
    ];
}

const LAYOUT_GENERATORS = {
    FIND_AND_SELECT: findAndSelectLayout,
    DRAG_AND_DROP: dragAndDropLayout,
};

export function getInitialLayoutForType(type) {
    const generator = LAYOUT_GENERATORS[type];
    return generator ? generator() : [];
}