import { ELEMENT_TYPES } from '../constants/elementTypes';
import { DEFAULT_CANVAS } from '../constants/canvas';

/**
 * Genereaza layout-ul initial pentru un tip de exercitiu.
 * Returneaza array de elemente conform structurii din editorStore.
 */

const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

function findAndSelectLayout() {
    const W = DEFAULT_CANVAS.width;
    const H = DEFAULT_CANVAS.height;

    return [
        // Zona 1: Text enunt (sus)
        {
            id: generateId('el_zone_text'),
            type: ELEMENT_TYPES.TEXT,
            x: 60,
            y: 40,
            width: W - 120,
            height: 80,
            rotation: 0,
            text: 'Găsește și selectează [obiectele indicate]',
            fontFamily: 'Nunito',
            fontSize: 32,
            fontStyle: 'bold',
            textDecoration: '',
            fill: '#1a1d23',
            align: 'center',
            verticalAlign: 'middle',
            letterSpacing: 0,
            lineHeight: 1.2,
            padding: 12,
            bgFill: 'transparent',
            bgStroke: 'transparent',
            bgStrokeWidth: 0,
            bgCornerRadius: 0,
            shadowEnabled: false,
            shadowColor: '#000000',
            shadowBlur: 4,
            shadowOpacity: 0.3,
            listStyle: 'none',
            locked: false,
            hidden: false,
        },
        // Zona 2: Marker vizual pentru zona de imagine (chenar reper editabil / stergibil)
        {
            id: generateId('el_zone_image'),
            type: ELEMENT_TYPES.SHAPE,
            x: 60,
            y: 150,
            width: W - 120,
            height: H - 320,
            rotation: 0,
            shapeType: 'rect',
            fill: 'transparent',
            stroke: '#d1d9f6',
            strokeWidth: 2,
            cornerRadius: 16,
            opacity: 1,
            shadowEnabled: false,
            shadowColor: '#000000',
            shadowBlur: 8,
            shadowOpacity: 0.3,
            behavior: 'static',
            locked: false,
            hidden: false,
        },
        // Text guide in zona de imagine (dispare cand editorul adauga primul element)
        {
            id: generateId('el_zone_image_hint'),
            type: ELEMENT_TYPES.TEXT,
            x: 60,
            y: H / 2 - 40,
            width: W - 120,
            height: 80,
            rotation: 0,
            text: 'Zona de imagine — adauga aici obiectele de gasit',
            fontFamily: 'Nunito',
            fontSize: 18,
            fontStyle: 'italic',
            textDecoration: '',
            fill: '#9ca3af',
            align: 'center',
            verticalAlign: 'middle',
            letterSpacing: 0,
            lineHeight: 1.2,
            padding: 4,
            bgFill: 'transparent',
            bgStroke: 'transparent',
            bgStrokeWidth: 0,
            bgCornerRadius: 0,
            shadowEnabled: false,
            shadowColor: '#000000',
            shadowBlur: 4,
            shadowOpacity: 0.3,
            listStyle: 'none',
            locked: false,
            hidden: false,
        },
        // Zona 3: Text info despre zona de solutii (jos)
        {
            id: generateId('el_zone_solutions'),
            type: ELEMENT_TYPES.TEXT,
            x: 60,
            y: H - 130,
            width: W - 120,
            height: 60,
            rotation: 0,
            text: 'Zona de soluții — progresul elevului va apărea automat aici',
            fontFamily: 'Nunito',
            fontSize: 16,
            fontStyle: 'italic',
            textDecoration: '',
            fill: '#9ca3af',
            align: 'center',
            verticalAlign: 'middle',
            letterSpacing: 0,
            lineHeight: 1.2,
            padding: 8,
            bgFill: '#f9fafb',
            bgStroke: '#e5e7eb',
            bgStrokeWidth: 1,
            bgCornerRadius: 10,
            shadowEnabled: false,
            shadowColor: '#000000',
            shadowBlur: 4,
            shadowOpacity: 0.3,
            listStyle: 'none',
            locked: false,
            hidden: false,
        },
    ];
}

// Registry: tip -> functie generator
const LAYOUT_GENERATORS = {
    FIND_AND_SELECT: findAndSelectLayout,
    // Viitor: DRAG_AND_DROP: dragAndDropLayout, etc.
};

/**
 * Returneaza layout-ul initial pentru un tip.
 * Daca tipul nu are generator (ex. CUSTOM), returneaza array gol.
 */
export function getInitialLayoutForType(type) {
    const generator = LAYOUT_GENERATORS[type];
    return generator ? generator() : [];
}