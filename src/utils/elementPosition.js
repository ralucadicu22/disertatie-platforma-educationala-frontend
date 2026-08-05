
export function getAbsolutePosition(element, allElements) {
    if (!element.parentId) {
        return { x: element.x, y: element.y };
    }
    const parent = allElements.find(el => el.id === element.parentId);
    if (!parent) {
        return { x: element.x, y: element.y };
    }
    const parentAbs = getAbsolutePosition(parent, allElements);

    // Daca parintele e Grid, pozitia copilului e determinata de slotIndex
    if (parent.type === 'GRID' && element.slotIndex !== undefined) {
        const cellRect = getGridCellRect(parent, element.slotIndex);
        return {
            x: parentAbs.x + cellRect.x,
            y: parentAbs.y + cellRect.y,
        };
    }

    return {
        x: parentAbs.x + element.x,
        y: parentAbs.y + element.y,
    };
}

export function isPointInBox(x, y, box, allElements) {
    const abs = getAbsolutePosition(box, allElements);
    return x >= abs.x && x <= abs.x + box.width
        && y >= abs.y && y <= abs.y + box.height;
}

export function clampChildInsideParent(x, y, w, h, parent, padding = 0) {
    const minX = padding;
    const minY = padding;
    const maxX = parent.width - w - padding;
    const maxY = parent.height - h - padding;
    return {
        x: Math.max(minX, Math.min(x, maxX)),
        y: Math.max(minY, Math.min(y, maxY)),
    };

}
/**
 * Calculeaza pozitia si dimensiunea unei celule dintr-un Grid,
 * pe baza slotIndex-ului si a configuratiei grid-ului.
 * Coordonatele returnate sunt LOCALE (fata de originea Grid-ului).
 */
export function getGridCellRect(grid, slotIndex) {
    const rows = grid.rows || 1;
    const cols = grid.cols || 1;
    const gap = grid.gap || 0;
    const padding = grid.cellPadding || 0;

    const totalCells = rows * cols;
    const idx = Math.max(0, Math.min(slotIndex, totalCells - 1));

    const row = Math.floor(idx / cols);
    const col = idx % cols;

    const totalGapW = gap * (cols - 1);
    const totalGapH = gap * (rows - 1);
    const cellW = (grid.width - totalGapW - padding * 2) / cols;
    const cellH = (grid.height - totalGapH - padding * 2) / rows;

    const x = padding + col * (cellW + gap);
    const y = padding + row * (cellH + gap);

    return { x, y, width: cellW, height: cellH };
}