import { EXERCISE_TYPES } from '../constants/exerciseTypes';
import { ELEMENT_TYPES } from '../constants/elementTypes';

const genId = (prefix) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

function makeTextBox({ id, x, y, width, height, text, fontSize = 28, fontStyle = 'bold', fill = '#1a1d23', align = 'center', role = null, locked = false }) {
    return {
        id,
        type: ELEMENT_TYPES.TEXT,
        x, y, width, height,
        text,
        fontFamily: 'Nunito',
        fontSize,
        fontStyle,
        textDecoration: '',
        fill,
        align,
        verticalAlign: 'middle',
        letterSpacing: 0,
        lineHeight: 1.3,
        padding: 12,
        bgFill: '#ffffff',
        bgStroke: '#e5e7eb',
        bgStrokeWidth: 2,
        bgCornerRadius: 12,
        shadowEnabled: false,
        shadowColor: '#000000',
        shadowBlur: 4,
        shadowOpacity: 0.1,
        listStyle: 'none',
        rotation: 0,
        locked,
        hidden: false,
        parentId: null,
        role,
    };
}

function makeBox({ id, x, y, width, height, role = null, bgFill = '#f9fafb', bgStroke = '#e5e7eb', bgStrokeWidth = 2, bgCornerRadius = 16, label = null, locked = false }) {
    return {
        id,
        type: ELEMENT_TYPES.BOX,
        x, y, width, height,
        bgFill,
        bgStroke,
        bgStrokeWidth,
        bgCornerRadius,
        padding: 16,
        shadowEnabled: false,
        shadowColor: '#000000',
        shadowBlur: 8,
        shadowOpacity: 0.08,
        parentId: null,
        role,
        label,
        locked,
        hidden: false,
        rotation: 0,
    };
}

function makePlaceholderText({ id, parentId, x, y, width, height, text, fontSize = 14, fill = '#9ca3af', locked = true }) {
    return {
        id,
        type: ELEMENT_TYPES.TEXT,
        x, y, width, height,
        text,
        fontFamily: 'Nunito',
        fontSize,
        fontStyle: 'italic',
        textDecoration: '',
        fill,
        align: 'center',
        verticalAlign: 'middle',
        letterSpacing: 0,
        lineHeight: 1.3,
        padding: 8,
        bgFill: 'transparent',
        bgStroke: 'transparent',
        bgStrokeWidth: 0,
        bgCornerRadius: 0,
        shadowEnabled: false,
        shadowColor: '#000000',
        shadowBlur: 0,
        shadowOpacity: 0,
        listStyle: 'none',
        rotation: 0,
        locked,
        hidden: false,
        parentId,
        role: null,
        isPlaceholder: true,
    };
}

function layoutFindAndSelect() {
    const CANVAS_W = 1200;
    const PADDING = 40;

    const titleId = genId('title');
    const imageZoneId = genId('image_zone');
    const solutionsZoneId = genId('solutions_zone');

    const titleH = 80;
    const titleY = PADDING;

    const imageZoneY = titleY + titleH + 24;
    const imageZoneH = 480;
    const imageZoneW = CANVAS_W - PADDING * 2;

    const solZoneY = imageZoneY + imageZoneH + 24;
    const solZoneH = 120;
    const solZoneW = imageZoneW;

    const titleEl = makeTextBox({
        id: titleId,
        x: PADDING, y: titleY,
        width: imageZoneW, height: titleH,
        text: 'Găsește și selectează',
        fontSize: 28, fontStyle: 'bold',
        align: 'center',
        role: 'title',
    });

    const imageZone = makeBox({
        id: imageZoneId,
        x: PADDING, y: imageZoneY,
        width: imageZoneW, height: imageZoneH,
        role: 'image-zone',
        bgFill: '#f0f2f5',
        bgStroke: '#d1d5db',
        bgCornerRadius: 16,
    });

    const imageZonePlaceholder = makePlaceholderText({
        id: genId('img_placeholder'),
        parentId: imageZoneId,
        x: 0, y: imageZoneH / 2 - 30,
        width: imageZoneW, height: 60,
        text: 'Adaugă o imagine sau elemente interactive',
        fontSize: 15,
    });

    const solutionsZone = makeBox({
        id: solutionsZoneId,
        x: PADDING, y: solZoneY,
        width: solZoneW, height: solZoneH,
        role: 'solutions-zone',
        bgFill: '#fafafa',
        bgStroke: '#e5e7eb',
        bgCornerRadius: 12,
    });

    const solutionsPlaceholder = makePlaceholderText({
        id: genId('sol_placeholder'),
        parentId: solutionsZoneId,
        x: 0, y: solZoneH / 2 - 24,
        width: solZoneW, height: 48,
        text: 'Zona soluții — adaugă ținte în modul Soluție',
        fontSize: 14,
    });

    return [titleEl, imageZone, imageZonePlaceholder, solutionsZone, solutionsPlaceholder];
}

function layoutFindAndCount() {
    const CANVAS_W = 1200;
    const PADDING = 40;
    const INNER_W = CANVAS_W - PADDING * 2;

    const titleEl = makeTextBox({
        id: genId('title'),
        x: PADDING, y: PADDING,
        width: INNER_W, height: 80,
        text: 'Numără și găsește',
        fontSize: 28, fontStyle: 'bold', align: 'center', role: 'title',
    });

    const imageZoneId = genId('image_zone');
    const imageZoneY = PADDING + 80 + 24;
    const imageZoneH = 420;
    const imageZone = makeBox({
        id: imageZoneId,
        x: PADDING, y: imageZoneY,
        width: INNER_W, height: imageZoneH,
        role: 'image-zone',
        bgFill: '#f0f2f5', bgStroke: '#d1d5db', bgCornerRadius: 16,
    });

    const imageZonePlaceholder = makePlaceholderText({
        id: genId('img_ph'),
        parentId: imageZoneId,
        x: 0, y: imageZoneH / 2 - 30,
        width: INNER_W, height: 60,
        text: 'Adaugă imaginea cu obiectele de numărat',
        fontSize: 15,
    });

    const countZoneId = genId('count_zone');
    const countZoneY = imageZoneY + imageZoneH + 24;
    const countZoneH = 180;
    const countZone = makeBox({
        id: countZoneId,
        x: PADDING, y: countZoneY,
        width: INNER_W, height: countZoneH,
        role: 'solutions-zone',
        bgFill: '#fafafa', bgStroke: '#e5e7eb', bgCornerRadius: 12,
    });

    const countZonePlaceholder = makePlaceholderText({
        id: genId('count_ph'),
        parentId: countZoneId,
        x: 0, y: countZoneH / 2 - 24,
        width: INNER_W, height: 48,
        text: 'Zona contoare — elementele de numărat apar automat din Soluție',
        fontSize: 14,
    });

    return [titleEl, imageZone, imageZonePlaceholder, countZone, countZonePlaceholder];
}

function layoutLogicalSeries() {
    const CANVAS_W = 1200;
    const PADDING = 40;
    const INNER_W = CANVAS_W - PADDING * 2;

    const titleEl = makeTextBox({
        id: genId('title'),
        x: PADDING, y: PADDING,
        width: INNER_W, height: 80,
        text: 'Continuă seria logică',
        fontSize: 28, fontStyle: 'bold', align: 'center', role: 'title',
    });

    const seriesZoneId = genId('series_zone');
    const seriesZoneY = PADDING + 80 + 24;
    const seriesZoneH = 260;
    const seriesZone = makeBox({
        id: seriesZoneId,
        x: PADDING, y: seriesZoneY,
        width: INNER_W, height: seriesZoneH,
        role: 'series-zone',
        bgFill: '#f0f7ff', bgStroke: '#bfdbfe', bgStrokeWidth: 2, bgCornerRadius: 16,
    });

    const seriesPlaceholder = makePlaceholderText({
        id: genId('series_ph'),
        parentId: seriesZoneId,
        x: 0, y: seriesZoneH / 2 - 40,
        width: INNER_W, height: 80,
        text: 'Adaugă elementele seriei logice\n(imagini, forme, cifre, litere)',
        fontSize: 15,
    });

    const inputZoneId = genId('input_zone');
    const inputZoneY = seriesZoneY + seriesZoneH + 24;
    const inputZoneH = 200;
    const inputZone = makeBox({
        id: inputZoneId,
        x: PADDING, y: inputZoneY,
        width: INNER_W, height: inputZoneH,
        role: 'input-zone',
        bgFill: '#ffffff', bgStroke: '#c7d2fe', bgStrokeWidth: 2, bgCornerRadius: 16,
    });

    const OPTION_COUNT = 4;
    const OPTION_H = 120;
    const OPTION_GAP = 16;
    const OPTION_W = (INNER_W - 64 - (OPTION_COUNT - 1) * OPTION_GAP) / OPTION_COUNT;
    const OPTION_X_START = 32;

    const inputOptions = Array.from({ length: OPTION_COUNT }, (_, i) => ({
        id: genId(`input_option_${i}`),
        type: ELEMENT_TYPES.BOX,
        x: OPTION_X_START + i * (OPTION_W + OPTION_GAP),
        y: (inputZoneH - OPTION_H) / 2,
        width: OPTION_W,
        height: OPTION_H,
        bgFill: '#ffffff',
        bgStroke: '#d1d5db',
        bgStrokeWidth: 2,
        bgCornerRadius: 10,
        padding: 12,
        shadowEnabled: false,
        shadowColor: '#000000',
        shadowBlur: 4,
        shadowOpacity: 0.04,
        parentId: inputZoneId,
        role: 'choice-option',
        label: String.fromCharCode(65 + i),
        locked: false,
        hidden: false,
        rotation: 0,
    }));

    return [titleEl, seriesZone, seriesPlaceholder, inputZone, ...inputOptions];
}

function layoutTextProblems() {
    const CANVAS_W = 1200;
    const PADDING = 40;
    const INNER_W = CANVAS_W - PADDING * 2;

    const titleEl = makeTextBox({
        id: genId('title'),
        x: PADDING, y: PADDING,
        width: INNER_W, height: 80,
        text: 'Problemă text',
        fontSize: 28, fontStyle: 'bold', align: 'center', role: 'title',
    });

    const contextZoneId = genId('context_zone');
    const contextZoneY = PADDING + 80 + 24;
    const contextZoneH = 320;
    const contextZone = makeBox({
        id: contextZoneId,
        x: PADDING, y: contextZoneY,
        width: INNER_W, height: contextZoneH,
        role: 'context-zone',
        bgFill: '#f9fafb', bgStroke: '#e5e7eb', bgCornerRadius: 16,
    });

    const contextPlaceholder = makePlaceholderText({
        id: genId('ctx_ph'),
        parentId: contextZoneId,
        x: 0, y: contextZoneH / 2 - 30,
        width: INNER_W, height: 60,
        text: 'Adaugă enunțul problemei — text, imagini, tabele',
        fontSize: 15,
    });

    const inputZoneId = genId('input_zone');
    const inputZoneY = contextZoneY + contextZoneH + 24;
    const inputZoneH = 200;
    const inputZone = makeBox({
        id: inputZoneId,
        x: PADDING, y: inputZoneY,
        width: INNER_W, height: inputZoneH,
        role: 'input-zone',
        bgFill: '#ffffff', bgStroke: '#a5f3fc', bgStrokeWidth: 2, bgCornerRadius: 16,
    });

    const inputPlaceholder = makePlaceholderText({
        id: genId('inp_ph'),
        parentId: inputZoneId,
        x: 0, y: inputZoneH / 2 - 36,
        width: INNER_W, height: 72,
        text: 'Câmpurile de răspuns apar automat\ndin elementele marcate în Soluție',
        fontSize: 14,
    });

    return [titleEl, contextZone, contextPlaceholder, inputZone, inputPlaceholder];
}

function layoutTablesCharts() {
    const CANVAS_W = 1200;
    const PADDING = 40;
    const INNER_W = CANVAS_W - PADDING * 2;

    const titleEl = makeTextBox({
        id: genId('title'),
        x: PADDING, y: PADDING,
        width: INNER_W, height: 80,
        text: 'Completează tabelul / graficul',
        fontSize: 28, fontStyle: 'bold', align: 'center', role: 'title',
    });

    const tableZoneId = genId('table_zone');
    const tableZoneY = PADDING + 80 + 24;
    const tableZoneH = 380;
    const tableZone = makeBox({
        id: tableZoneId,
        x: PADDING, y: tableZoneY,
        width: INNER_W, height: tableZoneH,
        role: 'table-zone',
        bgFill: '#f8faff', bgStroke: '#c7d2fe', bgStrokeWidth: 2, bgCornerRadius: 16,
    });

    const tableZonePlaceholder = makePlaceholderText({
        id: genId('table_ph'),
        parentId: tableZoneId,
        x: 0, y: tableZoneH / 2 - 40,
        width: INNER_W, height: 80,
        text: 'Adaugă un element Grid și activează modul Tabel\ndin panoul de proprietăți → tab „Mod"',
        fontSize: 15,
    });

    const questionZoneId = genId('question_zone');
    const questionZoneY = tableZoneY + tableZoneH + 24;
    const questionZoneH = 160;
    const questionZone = makeBox({
        id: questionZoneId,
        x: PADDING, y: questionZoneY,
        width: INNER_W, height: questionZoneH,
        role: 'question-zone',
        bgFill: '#fffbeb', bgStroke: '#fde68a', bgStrokeWidth: 2, bgCornerRadius: 16,
    });

    const questionPlaceholder = makePlaceholderText({
        id: genId('q_ph'),
        parentId: questionZoneId,
        x: 0, y: questionZoneH / 2 - 30,
        width: INNER_W, height: 60,
        text: 'Adaugă enunțul / cerințele exercițiului',
        fontSize: 15,
    });

    return [titleEl, tableZone, tableZonePlaceholder, questionZone, questionPlaceholder];
}

function layoutColoring() {
    const CANVAS_W = 1200;
    const PADDING = 40;
    const INNER_W = CANVAS_W - PADDING * 2;

    const titleEl = makeTextBox({
        id: genId('title'),
        x: PADDING, y: PADDING,
        width: INNER_W, height: 80,
        text: 'Colorează corect',
        fontSize: 28, fontStyle: 'bold', align: 'center', role: 'title',
    });

    const coloringZoneId = genId('coloring_zone');
    const coloringZoneY = PADDING + 80 + 24;
    const coloringZoneH = 460;
    const coloringZone = makeBox({
        id: coloringZoneId,
        x: PADDING, y: coloringZoneY,
        width: INNER_W, height: coloringZoneH,
        role: 'coloring-zone',
        bgFill: '#fefce8', bgStroke: '#fde68a', bgStrokeWidth: 2, bgCornerRadius: 16,
    });

    const coloringPlaceholder = makePlaceholderText({
        id: genId('col_ph'),
        parentId: coloringZoneId,
        x: 0, y: coloringZoneH / 2 - 40,
        width: INNER_W, height: 80,
        text: 'Adaugă elementele de colorat\n(forme, regiuni, imagini)',
        fontSize: 15,
    });

    const paletteZoneId = genId('palette_zone');
    const paletteZoneY = coloringZoneY + coloringZoneH + 24;
    const paletteZoneH = 100;
    const paletteZone = makeBox({
        id: paletteZoneId,
        x: PADDING, y: paletteZoneY,
        width: INNER_W, height: paletteZoneH,
        role: 'palette-zone',
        bgFill: '#ffffff', bgStroke: '#e5e7eb', bgCornerRadius: 12,
        label: 'Paletă culori',
    });

    const palettePlaceholder = makePlaceholderText({
        id: genId('pal_ph'),
        parentId: paletteZoneId,
        x: 0, y: paletteZoneH / 2 - 20,
        width: INNER_W, height: 40,
        text: 'Paleta de culori apare automat din soluție',
        fontSize: 14,
    });

    return [titleEl, coloringZone, coloringPlaceholder, paletteZone, palettePlaceholder];
}

function layoutPuzzle() {
    const CANVAS_W = 1200;
    const PADDING = 40;
    const INNER_W = CANVAS_W - PADDING * 2;
    const COL_GAP = 32;

    const titleEl = makeTextBox({
        id: genId('title'),
        x: PADDING, y: PADDING,
        width: INNER_W, height: 80,
        text: 'Asamblează puzzle-ul',
        fontSize: 28, fontStyle: 'bold', align: 'center', role: 'title',
    });

    const zonesY = PADDING + 80 + 24;
    const zonesH = 460;
    const zoneW = (INNER_W - COL_GAP) / 2;

    const piecesZoneId = genId('pieces_zone');
    const piecesZone = makeBox({
        id: piecesZoneId,
        x: PADDING, y: zonesY,
        width: zoneW, height: zonesH,
        role: 'pieces-zone',
        bgFill: '#f9fafb', bgStroke: '#d1d5db', bgCornerRadius: 16,
        label: 'Piese puzzle',
    });

    const piecesPlaceholder = makePlaceholderText({
        id: genId('pieces_ph'),
        parentId: piecesZoneId,
        x: 0, y: zonesH / 2 - 30,
        width: zoneW, height: 60,
        text: 'Piesele puzzle apar\nautomat din Soluție',
        fontSize: 14,
    });

    const boardZoneId = genId('board_zone');
    const boardZone = makeBox({
        id: boardZoneId,
        x: PADDING + zoneW + COL_GAP, y: zonesY,
        width: zoneW, height: zonesH,
        role: 'board-zone',
        bgFill: '#f0f7ff', bgStroke: '#bfdbfe', bgStrokeWidth: 2, bgCornerRadius: 16,
        label: 'Tablă puzzle',
    });

    const boardPlaceholder = makePlaceholderText({
        id: genId('board_ph'),
        parentId: boardZoneId,
        x: 0, y: zonesH / 2 - 40,
        width: zoneW, height: 80,
        text: 'Adaugă imaginea completă\nca referință sau zonele de plasare',
        fontSize: 14,
    });

    return [titleEl, piecesZone, piecesPlaceholder, boardZone, boardPlaceholder];
}

function layoutVideo() {
    const CANVAS_W = 1200;
    const PADDING = 40;
    const INNER_W = CANVAS_W - PADDING * 2;

    const titleEl = makeTextBox({
        id: genId('title'),
        x: PADDING, y: PADDING,
        width: INNER_W, height: 80,
        text: 'Urmărește și răspunde',
        fontSize: 28, fontStyle: 'bold', align: 'center', role: 'title',
    });

    const videoEl = {
        id: genId('video'),
        type: ELEMENT_TYPES.VIDEO,
        x: PADDING, y: PADDING + 80 + 24,
        width: INNER_W, height: 380,
        src: null,
        posterSrc: null,
        autoplay: false,
        loop: false,
        muted: true,
        controls: true,
        opacity: 1,
        cornerRadius: 16,
        shadowEnabled: false,
        shadowColor: '#000000',
        shadowBlur: 8,
        shadowOpacity: 0.3,
        behavior: 'static',
        locked: false,
        hidden: false,
        parentId: null,
        rotation: 0,
        role: 'video-zone',
    };

    const questionsZoneId = genId('questions_zone');
    const questionsZoneY = PADDING + 80 + 24 + 380 + 24;
    const questionsZoneH = 180;
    const questionsZone = makeBox({
        id: questionsZoneId,
        x: PADDING, y: questionsZoneY,
        width: INNER_W, height: questionsZoneH,
        role: 'questions-zone',
        bgFill: '#ffffff', bgStroke: '#e5e7eb', bgCornerRadius: 12,
    });

    const questionsPlaceholder = makePlaceholderText({
        id: genId('q_ph'),
        parentId: questionsZoneId,
        x: 0, y: questionsZoneH / 2 - 24,
        width: INNER_W, height: 48,
        text: 'Adaugă întrebările legate de videoclip',
        fontSize: 14,
    });

    return [titleEl, videoEl, questionsZone, questionsPlaceholder];
}

function layoutPdf() {
    const CANVAS_W = 1200;
    const PADDING = 40;
    const INNER_W = CANVAS_W - PADDING * 2;

    const titleEl = makeTextBox({
        id: genId('title'),
        x: PADDING, y: PADDING,
        width: INNER_W, height: 80,
        text: 'Citește și răspunde',
        fontSize: 28, fontStyle: 'bold', align: 'center', role: 'title',
    });

    const pdfEl = {
        id: genId('pdf'),
        type: ELEMENT_TYPES.PDF,
        x: PADDING, y: PADDING + 80 + 24,
        width: INNER_W, height: 80,
        src: null,
        originalName: null,
        bgFill: '#ffffff',
        bgStroke: '#e5e7eb',
        bgStrokeWidth: 2,
        bgCornerRadius: 12,
        padding: 12,
        label: 'Deschide documentul',
        shadowEnabled: false,
        shadowColor: '#000000',
        shadowBlur: 8,
        shadowOpacity: 0.15,
        locked: false,
        hidden: false,
        parentId: null,
        rotation: 0,
        role: 'pdf-zone',
    };

    const questionsZoneId = genId('questions_zone');
    const questionsZoneY = PADDING + 80 + 24 + 80 + 24;
    const questionsZoneH = 400;
    const questionsZone = makeBox({
        id: questionsZoneId,
        x: PADDING, y: questionsZoneY,
        width: INNER_W, height: questionsZoneH,
        role: 'questions-zone',
        bgFill: '#ffffff', bgStroke: '#e5e7eb', bgCornerRadius: 12,
    });

    const questionsPlaceholder = makePlaceholderText({
        id: genId('q_ph'),
        parentId: questionsZoneId,
        x: 0, y: questionsZoneH / 2 - 24,
        width: INNER_W, height: 48,
        text: 'Adaugă întrebările legate de documentul PDF',
        fontSize: 14,
    });

    return [titleEl, pdfEl, questionsZone, questionsPlaceholder];
}

function layoutDragAndDrop() {
    const CANVAS_W = 1200;
    const PADDING = 40;
    const COL_GAP = 32;

    const titleId = genId('title');
    const sourceZoneId = genId('source_zone');
    const targetZoneId = genId('target_zone');

    const titleH = 80;
    const titleY = PADDING;

    const zonesY = titleY + titleH + 32;
    const zonesH = 460;
    const zoneW = (CANVAS_W - PADDING * 2 - COL_GAP) / 2;

    const titleEl = makeTextBox({
        id: titleId,
        x: PADDING, y: titleY,
        width: CANVAS_W - PADDING * 2, height: titleH,
        text: 'Trage fiecare obiect în zona corectă',
        fontSize: 28, fontStyle: 'bold', align: 'center', role: 'title',
    });

    const sourceZone = makeBox({
        id: sourceZoneId,
        x: PADDING, y: zonesY,
        width: zoneW, height: zonesH,
        role: 'source-zone',
        bgFill: '#f9fafb', bgStroke: '#d1d5db', bgCornerRadius: 16,
        label: 'Obiecte de tras',
    });

    const sourcePlaceholder = makePlaceholderText({
        id: genId('src_ph'),
        parentId: sourceZoneId,
        x: 0, y: zonesH / 2 - 30,
        width: zoneW, height: 60,
        text: 'Obiecte de tras',
        fontSize: 15,
    });

    const targetZone = makeBox({
        id: targetZoneId,
        x: PADDING + zoneW + COL_GAP, y: zonesY,
        width: zoneW, height: zonesH,
        role: 'target-zone',
        bgFill: '#f0f7ff', bgStroke: '#bfdbfe', bgCornerRadius: 16,
        label: 'Zone destinație',
    });

    const targetPlaceholder = makePlaceholderText({
        id: genId('tgt_ph'),
        parentId: targetZoneId,
        x: 0, y: zonesH / 2 - 30,
        width: zoneW, height: 60,
        text: 'Zone destinație',
        fontSize: 15,
    });

    return [titleEl, sourceZone, sourcePlaceholder, targetZone, targetPlaceholder];
}

function layoutInputText() {
    const CANVAS_W = 1200;
    const PADDING = 40;
    const INNER_W = CANVAS_W - PADDING * 2;

    const titleEl = makeTextBox({
        id: genId('title'),
        x: PADDING, y: PADDING,
        width: INNER_W, height: 80,
        text: 'Completează răspunsul',
        fontSize: 28, fontStyle: 'bold', align: 'center', role: 'title',
    });

    const contextZoneId = genId('context_zone');
    const contextZone = makeBox({
        id: contextZoneId,
        x: PADDING, y: PADDING + 80 + 24,
        width: INNER_W, height: 260,
        role: 'context-zone',
        bgFill: '#f9fafb', bgStroke: '#e5e7eb', bgCornerRadius: 16,
    });

    const contextPlaceholder = makePlaceholderText({
        id: genId('ctx_ph'),
        parentId: contextZoneId,
        x: 0, y: 100,
        width: INNER_W, height: 60,
        text: 'Adaugă imagini sau text de context (opțional)',
        fontSize: 15,
    });

    const inputZoneId = genId('input_zone');
    const inputZoneY = PADDING + 80 + 24 + 260 + 24;
    const inputZone = makeBox({
        id: inputZoneId,
        x: PADDING, y: inputZoneY,
        width: INNER_W, height: 200,
        role: 'input-zone',
        bgFill: '#ffffff', bgStroke: '#c7d2fe', bgStrokeWidth: 2, bgCornerRadius: 16,
    });

    const inputPlaceholder = makePlaceholderText({
        id: genId('inp_ph'),
        parentId: inputZoneId,
        x: 0, y: 76,
        width: INNER_W, height: 48,
        text: 'Câmpurile de input apar automat din elementele marcate în Soluție',
        fontSize: 14,
    });

    return [titleEl, contextZone, contextPlaceholder, inputZone, inputPlaceholder];
}

function layoutInputNumeric() {
    const CANVAS_W = 1200;
    const PADDING = 40;
    const INNER_W = CANVAS_W - PADDING * 2;

    const titleEl = makeTextBox({
        id: genId('title'),
        x: PADDING, y: PADDING,
        width: INNER_W, height: 80,
        text: 'Calculează și răspunde',
        fontSize: 28, fontStyle: 'bold', align: 'center', role: 'title',
    });

    const contextZoneId = genId('context_zone');
    const contextZone = makeBox({
        id: contextZoneId,
        x: PADDING, y: PADDING + 80 + 24,
        width: INNER_W, height: 300,
        role: 'context-zone',
        bgFill: '#f9fafb', bgStroke: '#e5e7eb', bgCornerRadius: 16,
    });

    const contextPlaceholder = makePlaceholderText({
        id: genId('ctx_ph'),
        parentId: contextZoneId,
        x: 0, y: 120,
        width: INNER_W, height: 60,
        text: 'Adaugă enunțul problemei — text, imagini, tabele',
        fontSize: 15,
    });

    const inputZoneId = genId('input_zone');
    const inputZoneY = PADDING + 80 + 24 + 300 + 24;
    const inputZone = makeBox({
        id: inputZoneId,
        x: PADDING, y: inputZoneY,
        width: INNER_W, height: 180,
        role: 'input-zone',
        bgFill: '#ffffff', bgStroke: '#a5f3fc', bgStrokeWidth: 2, bgCornerRadius: 16,
    });

    const inputPlaceholder = makePlaceholderText({
        id: genId('inp_ph'),
        parentId: inputZoneId,
        x: 0, y: 66,
        width: INNER_W, height: 48,
        text: 'Câmpurile numerice apar automat din elementele marcate în Soluție',
        fontSize: 14,
    });

    return [titleEl, contextZone, contextPlaceholder, inputZone, inputPlaceholder];
}

function layoutMatching() {
    const CANVAS_W = 1200;
    const PADDING = 40;
    const COL_GAP = 80;
    const INNER_W = CANVAS_W - PADDING * 2;

    const titleEl = makeTextBox({
        id: genId('title'),
        x: PADDING, y: PADDING,
        width: INNER_W, height: 80,
        text: 'Potrivește perechile',
        fontSize: 28, fontStyle: 'bold', align: 'center', role: 'title',
    });

    const colW = (INNER_W - COL_GAP) / 2;
    const zonesY = PADDING + 80 + 32;
    const zonesH = 480;

    const leftZoneId = genId('left_zone');
    const leftZone = makeBox({
        id: leftZoneId,
        x: PADDING, y: zonesY,
        width: colW, height: zonesH,
        role: 'matching-left',
        bgFill: '#f0f7ff', bgStroke: '#bfdbfe', bgCornerRadius: 16,
        label: 'Coloana stângă',
    });

    const leftPlaceholder = makePlaceholderText({
        id: genId('left_ph'),
        parentId: leftZoneId,
        x: 0, y: zonesH / 2 - 30,
        width: colW, height: 60,
        text: 'Adaugă elemente stânga\n(text, imagini)',
        fontSize: 14,
    });

    const rightZoneId = genId('right_zone');
    const rightZone = makeBox({
        id: rightZoneId,
        x: PADDING + colW + COL_GAP, y: zonesY,
        width: colW, height: zonesH,
        role: 'matching-right',
        bgFill: '#f0fdf4', bgStroke: '#bbf7d0', bgCornerRadius: 16,
        label: 'Coloana dreaptă',
    });

    const rightPlaceholder = makePlaceholderText({
        id: genId('right_ph'),
        parentId: rightZoneId,
        x: 0, y: zonesH / 2 - 30,
        width: colW, height: 60,
        text: 'Adaugă elemente dreapta\n(text, imagini)',
        fontSize: 14,
    });

    const instrEl = makeTextBox({
        id: genId('instr'),
        x: PADDING + colW + (COL_GAP - 200) / 2, y: zonesY + zonesH / 2 - 20,
        width: 200, height: 40,
        text: '↔',
        fontSize: 28, fontStyle: 'normal', align: 'center', role: null,
        fill: '#9ca3af',
    });

    return [titleEl, leftZone, leftPlaceholder, rightZone, rightPlaceholder, instrEl];
}

function layoutOrdering() {
    const CANVAS_W = 1200;
    const PADDING = 40;
    const INNER_W = CANVAS_W - PADDING * 2;

    const titleEl = makeTextBox({
        id: genId('title'),
        x: PADDING, y: PADDING,
        width: INNER_W, height: 80,
        text: 'Aranjează în ordinea corectă',
        fontSize: 28, fontStyle: 'bold', align: 'center', role: 'title',
    });

    const instrEl = makeTextBox({
        id: genId('instr'),
        x: PADDING, y: PADDING + 80 + 16,
        width: INNER_W, height: 48,
        text: 'Trage elementele pentru a le reordona',
        fontSize: 16, fontStyle: 'normal', align: 'center',
        fill: '#6b7280', role: null,
    });

    const ITEM_COUNT = 4;
    const ITEM_H = 100;
    const ITEM_GAP = 16;
    const ITEM_W = INNER_W;
    const ITEMS_START_Y = PADDING + 80 + 16 + 48 + 32;

    const items = Array.from({ length: ITEM_COUNT }, (_, i) => ({
        id: genId(`order_item_${i}`),
        type: ELEMENT_TYPES.BOX,
        x: PADDING,
        y: ITEMS_START_Y + i * (ITEM_H + ITEM_GAP),
        width: ITEM_W,
        height: ITEM_H,
        bgFill: '#ffffff',
        bgStroke: '#d1d5db',
        bgStrokeWidth: 2,
        bgCornerRadius: 10,
        padding: 12,
        shadowEnabled: false,
        shadowColor: '#000000',
        shadowBlur: 4,
        shadowOpacity: 0.06,
        parentId: null,
        role: 'ordering-item',
        label: `Element ${i + 1}`,
        locked: false,
        hidden: false,
        rotation: 0,
    }));

    return [titleEl, instrEl, ...items];
}

function layoutGridBased() {
    const CANVAS_W = 1200;
    const PADDING = 40;
    const INNER_W = CANVAS_W - PADDING * 2;

    const titleEl = makeTextBox({
        id: genId('title'),
        x: PADDING, y: PADDING,
        width: INNER_W, height: 80,
        text: 'Completează grila',
        fontSize: 28, fontStyle: 'bold', align: 'center', role: 'title',
    });

    const instrEl = makeTextBox({
        id: genId('instr'),
        x: PADDING, y: PADDING + 80 + 16,
        width: INNER_W, height: 48,
        text: 'Completează celulele goale din grilă',
        fontSize: 16, fontStyle: 'normal', align: 'center',
        fill: '#6b7280', role: null,
    });

    const gridEl = {
        id: genId('grid'),
        type: ELEMENT_TYPES.GRID,
        x: PADDING,
        y: PADDING + 80 + 16 + 48 + 24,
        width: INNER_W,
        height: 460,
        rows: 4,
        cols: 4,
        gap: 10,
        cellPadding: 8,
        bgFill: '#ffffff',
        bgStroke: '#e5e7eb',
        bgStrokeWidth: 2,
        bgCornerRadius: 16,
        cellFill: '#f9fafb',
        cellStroke: '#e5e7eb',
        cellStrokeWidth: 1,
        cellCornerRadius: 8,
        shadowEnabled: false,
        shadowColor: '#000000',
        shadowBlur: 8,
        shadowOpacity: 0.15,
        parentId: null,
        role: 'grid-zone',
        locked: false,
        hidden: false,
        rotation: 0,
    };

    return [titleEl, instrEl, gridEl];
}

function layoutMultipleChoice() {
    const CANVAS_W = 1200;
    const PADDING = 40;
    const INNER_W = CANVAS_W - PADDING * 2;

    const titleEl = makeTextBox({
        id: genId('title'),
        x: PADDING, y: PADDING,
        width: INNER_W, height: 80,
        text: 'Alege răspunsul corect',
        fontSize: 28, fontStyle: 'bold', align: 'center', role: 'title',
    });

    const questionZoneId = genId('question_zone');
    const questionZoneY = PADDING + 80 + 24;
    const questionZoneH = 200;
    const questionZone = makeBox({
        id: questionZoneId,
        x: PADDING, y: questionZoneY,
        width: INNER_W, height: questionZoneH,
        role: 'question-zone',
        bgFill: '#f0f7ff', bgStroke: '#bfdbfe', bgStrokeWidth: 2, bgCornerRadius: 16,
    });

    const questionPlaceholder = makePlaceholderText({
        id: genId('q_ph'),
        parentId: questionZoneId,
        x: 0, y: questionZoneH / 2 - 30,
        width: INNER_W, height: 60,
        text: 'Adaugă întrebarea sau imaginea cu enunțul',
        fontSize: 15,
    });

    const answersZoneId = genId('answers_zone');
    const answersZoneY = questionZoneY + questionZoneH + 24;
    const answersZoneH = 380;
    const answersZone = makeBox({
        id: answersZoneId,
        x: PADDING, y: answersZoneY,
        width: INNER_W, height: answersZoneH,
        role: 'answers-zone',
        bgFill: '#f9fafb', bgStroke: '#e5e7eb', bgCornerRadius: 16,
    });

    const OPTION_COUNT = 4;
    const OPTION_H = 72;
    const OPTION_GAP = 12;
    const OPTION_W = INNER_W - 64;
    const OPTION_X = 32;

    const options = Array.from({ length: OPTION_COUNT }, (_, i) => ({
        id: genId(`option_${i}`),
        type: ELEMENT_TYPES.BOX,
        x: OPTION_X,
        y: 16 + i * (OPTION_H + OPTION_GAP),
        width: OPTION_W,
        height: OPTION_H,
        bgFill: '#ffffff',
        bgStroke: '#d1d5db',
        bgStrokeWidth: 2,
        bgCornerRadius: 10,
        padding: 12,
        shadowEnabled: false,
        shadowColor: '#000000',
        shadowBlur: 4,
        shadowOpacity: 0.04,
        parentId: answersZoneId,
        role: 'choice-option',
        label: String.fromCharCode(65 + i),
        locked: false,
        hidden: false,
        rotation: 0,
    }));

    return [titleEl, questionZone, questionPlaceholder, answersZone, ...options];
}

function layoutCustom() {
    const CANVAS_W = 1200;
    const PADDING = 40;
    const INNER_W = CANVAS_W - PADDING * 2;

    const titleEl = makeTextBox({
        id: genId('title'),
        x: PADDING, y: PADDING,
        width: INNER_W, height: 80,
        text: 'Exercițiu',
        fontSize: 28, fontStyle: 'bold', align: 'center', role: 'title',
    });

    return [titleEl];
}

const LAYOUT_BY_TYPE = {
    [EXERCISE_TYPES.FIND_AND_SELECT]: layoutFindAndSelect,
    [EXERCISE_TYPES.FIND_AND_COUNT]: layoutFindAndCount,
    [EXERCISE_TYPES.LOGICAL_SERIES]: layoutLogicalSeries,
    [EXERCISE_TYPES.TEXT_PROBLEMS]: layoutTextProblems,
    [EXERCISE_TYPES.TABLES_CHARTS]: layoutTablesCharts,
    [EXERCISE_TYPES.COLORING]: layoutColoring,
    [EXERCISE_TYPES.PUZZLE]: layoutPuzzle,
    [EXERCISE_TYPES.VIDEO]: layoutVideo,
    [EXERCISE_TYPES.PDF]: layoutPdf,
    [EXERCISE_TYPES.DRAG_AND_DROP]: layoutDragAndDrop,
    [EXERCISE_TYPES.INPUT_TEXT]: layoutInputText,
    [EXERCISE_TYPES.INPUT_NUMERIC]: layoutInputNumeric,
    [EXERCISE_TYPES.MATCHING]: layoutMatching,
    [EXERCISE_TYPES.ORDERING]: layoutOrdering,
    [EXERCISE_TYPES.GRID_BASED]: layoutGridBased,
    [EXERCISE_TYPES.MULTIPLE_CHOICE]: layoutMultipleChoice,
    [EXERCISE_TYPES.CUSTOM]: layoutCustom,
};

export function getInitialLayoutForType(type) {
    const fn = LAYOUT_BY_TYPE[type];
    if (!fn) return layoutCustom();
    return fn();
}