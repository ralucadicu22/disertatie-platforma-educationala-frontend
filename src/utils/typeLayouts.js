import { ELEMENT_TYPES } from '../constants/elementTypes';
import { DEFAULT_CANVAS } from '../constants/canvas';

const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

function makeBox({ id, x, y, width, height, role, bgFill, bgStroke, bgStrokeWidth, bgCornerRadius, locked = true }) {
    return {
        id, type: ELEMENT_TYPES.BOX,
        x, y, width, height, rotation: 0,
        bgFill: bgFill ?? '#ffffff',
        bgStroke: bgStroke ?? '#e5e7eb',
        bgStrokeWidth: bgStrokeWidth ?? 2,
        bgCornerRadius: bgCornerRadius ?? 16,
        padding: 16,
        shadowEnabled: false,
        shadowColor: '#000000',
        shadowBlur: 8,
        shadowOpacity: 0.15,
        parentId: null,
        role,
        locked,
        hidden: false,
    };
}

function makeText({ id, x, y, width, height, text, fontSize = 24, fontStyle = 'normal', fill = '#1a1d23', align = 'center', parentId = null, locked = false }) {
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
        locked,
        hidden: false,
    };
}

function findAndSelectLayout() {
    const W = DEFAULT_CANVAS.width;
    const H = DEFAULT_CANVAS.height;

    const marginX = 40;
    const marginY = 40;
    const gap = 20;

    const textZoneH = 100;
    const imageZoneY = marginY + textZoneH + gap;
    const imageZoneH = H - imageZoneY - marginY;
    const zoneW = W - marginX * 2;

    const textZoneId = generateId('box_text_zone');
    const imageZoneId = generateId('box_image_zone');

    return [

        makeBox({
            id: textZoneId,
            x: marginX,
            y: marginY,
            width: zoneW,
            height: textZoneH,
            role: 'text-zone',
            bgFill: '#ffffff',
            bgStroke: '#d1d9f6',
            bgStrokeWidth: 2,
            bgCornerRadius: 12,
            locked: true,
        }),
        makeText({
            id: generateId('el_title'),
            x: 0, y: 0,
            width: zoneW, height: textZoneH,
            text: 'Găsește și selectează [obiectele indicate]',
            fontSize: 30, fontStyle: 'bold',
            parentId: textZoneId,
            locked: false, // textul din interior e editabil
        }),

        makeBox({
            id: imageZoneId,
            x: marginX,
            y: imageZoneY,
            width: zoneW,
            height: imageZoneH,
            role: 'image-zone',
            bgFill: '#ffffff',
            bgStroke: '#d1d9f6',
            bgStrokeWidth: 2,
            bgCornerRadius: 12,
            locked: true,
        }),
    ];
}

function findAndCountLayout() {

    const layout = findAndSelectLayout();
    const titleEl = layout.find(el => el.type === ELEMENT_TYPES.TEXT);
    if (titleEl) titleEl.text = 'Găsește și numără [obiectele indicate]';
    return layout;
}


function dragAndDropLayout() {
    const W = DEFAULT_CANVAS.width;
    const H = DEFAULT_CANVAS.height;

    const marginX = 40;
    const marginY = 40;
    const gap = 20;

    const textZoneH = 100;
    const zonesY = marginY + textZoneH + gap;
    const zonesH = H - zonesY - marginY;
    const zoneW = (W - marginX * 2 - gap) / 2;

    const textZoneId = generateId('box_text_zone');
    const sourceZoneId = generateId('box_source_zone');
    const targetZoneId = generateId('box_target_zone');

    return [
        makeBox({
            id: textZoneId,
            x: marginX, y: marginY,
            width: W - marginX * 2, height: textZoneH,
            role: 'text-zone',
            bgFill: '#ffffff', bgStroke: '#d1d9f6', bgStrokeWidth: 2, bgCornerRadius: 12,
            locked: true,
        }),
        makeText({
            id: generateId('el_title'),
            x: 0, y: 0,
            width: W - marginX * 2, height: textZoneH,
            text: 'Trage fiecare obiect în zona corectă',
            fontSize: 30, fontStyle: 'bold',
            parentId: textZoneId,
        }),

        makeBox({
            id: sourceZoneId,
            x: marginX, y: zonesY,
            width: zoneW, height: zonesH,
            role: 'source-zone',
            bgFill: '#ffffff', bgStroke: '#d1d9f6', bgStrokeWidth: 2, bgCornerRadius: 12,
            locked: true,
        }),
        makeText({
            id: generateId('el_source_hint'),
            x: 0, y: 0,
            width: zoneW, height: 40,
            text: 'Obiecte de tras',
            fontSize: 14, fontStyle: 'italic', fill: '#9ca3af',
            parentId: sourceZoneId,
        }),

        makeBox({
            id: targetZoneId,
            x: marginX + zoneW + gap, y: zonesY,
            width: zoneW, height: zonesH,
            role: 'target-zone',
            bgFill: '#ffffff', bgStroke: '#d1fae5', bgStrokeWidth: 2, bgCornerRadius: 12,
            locked: true,
        }),
        makeText({
            id: generateId('el_target_hint'),
            x: 0, y: 0,
            width: zoneW, height: 40,
            text: 'Zone destinație',
            fontSize: 14, fontStyle: 'italic', fill: '#9ca3af',
            parentId: targetZoneId,
        }),
    ];
}

const LAYOUT_GENERATORS = {
    FIND_AND_SELECT: findAndSelectLayout,
    FIND_AND_COUNT: findAndCountLayout,
    DRAG_AND_DROP: dragAndDropLayout,
};

export function getInitialLayoutForType(type) {
    const generator = LAYOUT_GENERATORS[type];
    return generator ? generator() : [];
}