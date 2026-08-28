import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import api from '../api/axios';
import { createDefaultConfig, migrateConfig } from '../utils/configFactory';
import { DEFAULT_CANVAS } from '../constants/canvas';
import { EXERCISE_TYPES } from '../constants/exerciseTypes';
import { ELEMENT_TYPES } from '../constants/elementTypes';
import { DEFAULT_SETTINGS, DEFAULT_SOLUTION } from '../utils/configFactory';


const EditorContext = createContext(null);
const MAX_HISTORY = 50;

export function EditorProvider({ children }) {
    const [elements, setElements] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [canvas, setCanvas] = useState({ ...DEFAULT_CANVAS });
    const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS });
    const [solution, setSolution] = useState({ ...DEFAULT_SOLUTION });
    const [meta, setMeta] = useState({
        type: 'CUSTOM',
        name: 'Exercitiu nou',
        description: '',
    });
    const [mode, setMode] = useState('editor');
    const [history, setHistory] = useState([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const clipboardRef = useRef(null);

    const [zoom, setZoom] = useState(1);
    const [stageOffset, setStageOffset] = useState({ x: 0, y: 0 });

    const [snapEnabled, setSnapEnabled] = useState(true);
    const GRID_SIZE = 20;

    const [layersPanelOpen, setLayersPanelOpen] = useState(false);
    const [fullscreenMode, setFullscreenMode] = useState(false);

    const [exerciseId, setExerciseId] = useState(null);
    const [saveStatus, setSaveStatus] = useState('idle');
    const [saveMessage, setSaveMessage] = useState('');
    const [loadStatus, setLoadStatus] = useState('idle');
    const [loadMessage, setLoadMessage] = useState('');

    const [draftVersionId, setDraftVersionId] = useState(null);
    const [draftStatus, setDraftStatus] = useState(null);

    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
    const lastSavedRef = useRef(null);

    const generateId = () => `el_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const pushHistory = useCallback((newElements) => {
        setHistory(prev => {
            const truncated = prev.slice(0, historyIndex + 1);
            const next = [...truncated, JSON.parse(JSON.stringify(newElements))];
            if (next.length > MAX_HISTORY) next.shift();
            return next;
        });
        setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
    }, [historyIndex]);

    const commitElements = useCallback((newElements) => {
        setElements(newElements);
        pushHistory(newElements);
    }, [pushHistory]);

    // Helper intern: calculeaza parentId, coordonate si slotIndex pentru un element nou
    // pe baza selectiei curente
    const resolveInsertContext = (type) => {
        let parentId = null;
        let finalX = 100;
        let finalY = 100;
        let slotIndex = undefined;

        if (type !== ELEMENT_TYPES.BOX && type !== ELEMENT_TYPES.GRID && selectedIds.length === 1) {
            const selected = elements.find(el => el.id === selectedIds[0]);
            if (selected) {
                if (selected.type === ELEMENT_TYPES.BOX) {
                    parentId = selected.id;
                    finalX = 20;
                    finalY = 20;
                } else if (selected.type === ELEMENT_TYPES.GRID) {
                    parentId = selected.id;
                    const usedSlots = new Set(
                        elements.filter(el => el.parentId === selected.id).map(el => el.slotIndex)
                    );
                    const totalSlots = selected.rows * selected.cols;
                    for (let i = 0; i < totalSlots; i++) {
                        if (!usedSlots.has(i)) { slotIndex = i; break; }
                    }
                    if (slotIndex === undefined) return null; // Grid plin
                    finalX = 0;
                    finalY = 0;
                }
            }
        }

        return { parentId, finalX, finalY, slotIndex };
    };

    const addElement = useCallback((type, x = 100, y = 100) => {
        const ctx = resolveInsertContext(type);
        if (ctx === null) return null; // Grid plin

        const id = generateId();
        const defaults = getDefaultElementProps(type);
        const useX = ctx.parentId ? ctx.finalX : x;
        const useY = ctx.parentId ? ctx.finalY : y;

        const newElement = { id, type, x: useX, y: useY, ...defaults, parentId: ctx.parentId };
        if (ctx.slotIndex !== undefined) newElement.slotIndex = ctx.slotIndex;

        const newElements = [...elements, newElement];
        commitElements(newElements);
        setSelectedIds([id]);
        return id;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [elements, commitElements, selectedIds]);

    const addElementWithProps = useCallback((type, extraProps = {}) => {
        const ctx = resolveInsertContext(type);
        if (ctx === null) return null;

        const id = generateId();
        const defaults = getDefaultElementProps(type);

        const newElement = {
            id, type,
            x: ctx.finalX, y: ctx.finalY,
            ...defaults,
            parentId: ctx.parentId,
            ...extraProps,
        };
        if (ctx.slotIndex !== undefined) newElement.slotIndex = ctx.slotIndex;

        const newElements = [...elements, newElement];
        commitElements(newElements);
        setSelectedIds([id]);
        return id;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [elements, commitElements, selectedIds]);

    const updateElement = useCallback((id, updates) => {
        const newElements = elements.map(el =>
            el.id === id ? { ...el, ...updates } : el
        );
        commitElements(newElements);
    }, [elements, commitElements]);

    const updateMultipleElements = useCallback((updatesMap) => {
        const newElements = elements.map(el => {
            const upd = updatesMap[el.id];
            return upd ? { ...el, ...upd } : el;
        });
        commitElements(newElements);
    }, [elements, commitElements]);

    const deleteElement = useCallback((id) => {
        const newElements = elements.filter(el => el.id !== id);
        commitElements(newElements);
        setSelectedIds([]);
    }, [elements, commitElements]);

    const deleteSelected = useCallback(() => {
        if (selectedIds.length === 0) return;
        const newElements = elements.filter(el => !selectedIds.includes(el.id));
        commitElements(newElements);
        setSelectedIds([]);
    }, [elements, selectedIds, commitElements]);

    const selectOne = useCallback((id) => setSelectedIds([id]), []);

    const toggleSelection = useCallback((id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }, []);

    const clearSelection = useCallback(() => setSelectedIds([]), []);

    const selectedElement = selectedIds.length === 1
        ? elements.find(el => el.id === selectedIds[0]) || null
        : null;

    const selectedElements = elements.filter(el => selectedIds.includes(el.id));

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            setHistoryIndex(prevIndex);
            setElements(JSON.parse(JSON.stringify(history[prevIndex])));
            setSelectedIds([]);
        }
    }, [history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            setHistoryIndex(nextIndex);
            setElements(JSON.parse(JSON.stringify(history[nextIndex])));
            setSelectedIds([]);
        }
    }, [history, historyIndex]);

    const copy = useCallback(() => {
        if (selectedIds.length > 0) {
            const els = elements.filter(e => selectedIds.includes(e.id));
            clipboardRef.current = JSON.parse(JSON.stringify(els));
        }
    }, [selectedIds, elements]);

    const paste = useCallback(() => {
        if (!clipboardRef.current || clipboardRef.current.length === 0) return;
        const copies = clipboardRef.current.map(orig => ({
            ...JSON.parse(JSON.stringify(orig)),
            id: generateId(),
            x: (orig.x || 0) + 20,
            y: (orig.y || 0) + 20,
        }));
        const newElements = [...elements, ...copies];
        commitElements(newElements);
        setSelectedIds(copies.map(c => c.id));
    }, [elements, commitElements]);

    const duplicate = useCallback(() => {
        if (selectedIds.length === 0) return;
        const els = elements.filter(e => selectedIds.includes(e.id));
        const copies = els.map(orig => ({
            ...JSON.parse(JSON.stringify(orig)),
            id: generateId(),
            x: orig.x + 20,
            y: orig.y + 20,
        }));
        const newElements = [...elements, ...copies];
        commitElements(newElements);
        setSelectedIds(copies.map(c => c.id));
    }, [selectedIds, elements, commitElements]);

    const alignElements = useCallback((alignment) => {
        if (selectedIds.length < 2) return;
        const els = elements.filter(e => selectedIds.includes(e.id));

        const minX = Math.min(...els.map(e => e.x));
        const maxX = Math.max(...els.map(e => e.x + e.width));
        const minY = Math.min(...els.map(e => e.y));
        const maxY = Math.max(...els.map(e => e.y + e.height));
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const updates = {};
        els.forEach(el => {
            switch (alignment) {
                case 'left': updates[el.id] = { x: minX }; break;
                case 'center-h': updates[el.id] = { x: centerX - el.width / 2 }; break;
                case 'right': updates[el.id] = { x: maxX - el.width }; break;
                case 'top': updates[el.id] = { y: minY }; break;
                case 'middle-v': updates[el.id] = { y: centerY - el.height / 2 }; break;
                case 'bottom': updates[el.id] = { y: maxY - el.height }; break;
            }
        });
        updateMultipleElements(updates);
    }, [selectedIds, elements, updateMultipleElements]);

    const distributeElements = useCallback((axis) => {
        if (selectedIds.length < 3) return;
        const els = elements.filter(e => selectedIds.includes(e.id));

        if (axis === 'horizontal') {
            const sorted = [...els].sort((a, b) => a.x - b.x);
            const first = sorted[0];
            const last = sorted[sorted.length - 1];
            const totalSpan = (last.x + last.width) - first.x;
            const totalWidth = sorted.reduce((s, e) => s + e.width, 0);
            const gap = (totalSpan - totalWidth) / (sorted.length - 1);

            let cursor = first.x;
            const updates = {};
            sorted.forEach((el, i) => {
                if (i === 0 || i === sorted.length - 1) {
                    cursor = el.x + el.width + gap;
                    return;
                }
                updates[el.id] = { x: cursor };
                cursor += el.width + gap;
            });
            updateMultipleElements(updates);
        } else {
            const sorted = [...els].sort((a, b) => a.y - b.y);
            const first = sorted[0];
            const last = sorted[sorted.length - 1];
            const totalSpan = (last.y + last.height) - first.y;
            const totalHeight = sorted.reduce((s, e) => s + e.height, 0);
            const gap = (totalSpan - totalHeight) / (sorted.length - 1);

            let cursor = first.y;
            const updates = {};
            sorted.forEach((el, i) => {
                if (i === 0 || i === sorted.length - 1) {
                    cursor = el.y + el.height + gap;
                    return;
                }
                updates[el.id] = { y: cursor };
                cursor += el.height + gap;
            });
            updateMultipleElements(updates);
        }
    }, [selectedIds, elements, updateMultipleElements]);

    const snapToGrid = useCallback((value) => {
        if (!snapEnabled) return value;
        return Math.round(value / GRID_SIZE) * GRID_SIZE;
    }, [snapEnabled]);

    const reorderElement = useCallback((fromIndex, toIndex) => {
        const newElements = [...elements];
        const [moved] = newElements.splice(fromIndex, 1);
        newElements.splice(toIndex, 0, moved);
        commitElements(newElements);
    }, [elements, commitElements]);

    const bringToFront = useCallback((id) => {
        const idx = elements.findIndex(e => e.id === id);
        if (idx === -1 || idx === elements.length - 1) return;
        const newElements = [...elements];
        const [item] = newElements.splice(idx, 1);
        newElements.push(item);
        commitElements(newElements);
    }, [elements, commitElements]);

    const sendToBack = useCallback((id) => {
        const idx = elements.findIndex(e => e.id === id);
        if (idx <= 0) return;
        const newElements = [...elements];
        const [item] = newElements.splice(idx, 1);
        newElements.unshift(item);
        commitElements(newElements);
    }, [elements, commitElements]);

    const bringForward = useCallback((id) => {
        const idx = elements.findIndex(e => e.id === id);
        if (idx === -1 || idx === elements.length - 1) return;
        const newElements = [...elements];
        [newElements[idx], newElements[idx + 1]] = [newElements[idx + 1], newElements[idx]];
        commitElements(newElements);
    }, [elements, commitElements]);

    const sendBackward = useCallback((id) => {
        const idx = elements.findIndex(e => e.id === id);
        if (idx <= 0) return;
        const newElements = [...elements];
        [newElements[idx], newElements[idx - 1]] = [newElements[idx - 1], newElements[idx]];
        commitElements(newElements);
    }, [elements, commitElements]);

    const toggleLock = useCallback((id) => {
        const el = elements.find(e => e.id === id);
        if (!el) return;
        updateElement(id, { locked: !el.locked });
    }, [elements, updateElement]);

    const toggleHidden = useCallback((id) => {
        const el = elements.find(e => e.id === id);
        if (!el) return;
        updateElement(id, { hidden: !el.hidden });
    }, [elements, updateElement]);

    const reparentElement = useCallback((elementId, newParentId, dropRelativeToId = null) => {
        const element = elements.find(el => el.id === elementId);
        if (!element) return;

        if (element.type === ELEMENT_TYPES.BOX && newParentId) {
            let ancestor = elements.find(el => el.id === newParentId);
            while (ancestor) {
                if (ancestor.id === elementId) return;
                ancestor = ancestor.parentId
                    ? elements.find(el => el.id === ancestor.parentId)
                    : null;
            }
        }

        const oldParent = element.parentId
            ? elements.find(el => el.id === element.parentId)
            : null;
        const newParent = newParentId
            ? elements.find(el => el.id === newParentId)
            : null;

        let absX = element.x;
        let absY = element.y;
        let cursor = oldParent;
        while (cursor) {
            absX += cursor.x;
            absY += cursor.y;
            cursor = cursor.parentId
                ? elements.find(el => el.id === cursor.parentId)
                : null;
        }

        let newX = absX;
        let newY = absY;
        cursor = newParent;
        while (cursor) {
            newX -= cursor.x;
            newY -= cursor.y;
            cursor = cursor.parentId
                ? elements.find(el => el.id === cursor.parentId)
                : null;
        }

        let newElements = elements.map(el =>
            el.id === elementId
                ? { ...el, parentId: newParentId, x: newX, y: newY }
                : el
        );

        if (dropRelativeToId) {
            const moved = newElements.find(el => el.id === elementId);
            const withoutMoved = newElements.filter(el => el.id !== elementId);
            const targetIndex = withoutMoved.findIndex(el => el.id === dropRelativeToId);
            if (targetIndex !== -1) {
                withoutMoved.splice(targetIndex, 0, moved);
                newElements = withoutMoved;
            }
        }

        commitElements(newElements);
    }, [elements, commitElements]);

    const updateCanvas = useCallback((updates) => {
        setCanvas(prev => ({ ...prev, ...updates }));
    }, []);

    const saveDraft = useCallback(async () => {
        if (!exerciseId) {
            setSaveStatus('error');
            setSaveMessage('Niciun exercitiu selectat');
            return;
        }

        setSaveStatus('saving');
        setSaveMessage('Se salveaza...');

        const canvasState = {
            ...createDefaultConfig(),
            canvas,
            meta,
            elements,
            settings,
            solution,
        };

        try {
            const res = await api.put(`/exercises/${exerciseId}/draft`, {
                config: JSON.stringify(canvasState),
                changeNote: `Draft salvat la ${new Date().toLocaleTimeString('ro-RO')}`,
            });
            setSaveStatus('saved');
            setSaveMessage(`Salvat! Versiune ${res.data.versionNumber}`);
            setDraftVersionId(res.data.id);
            setDraftStatus(res.data.status);
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err) {
            console.error('Eroare la salvare:', err);
            setSaveStatus('error');
            setSaveMessage(err.response?.data?.message || 'Eroare la salvare');
            setTimeout(() => setSaveStatus('idle'), 5000);
        }
    }, [exerciseId, elements, canvas, meta, settings, solution]);

    const submitForReview = useCallback(async () => {
        if (!draftVersionId) {
            setSaveStatus('error');
            setSaveMessage('Salvează draftul înainte de a trimite spre review');
            setTimeout(() => setSaveStatus('idle'), 5000);
            return;
        }

        setSaveStatus('saving');
        setSaveMessage('Se trimite spre review...');

        try {
            const res = await api.post(`/exercises/versions/${draftVersionId}/submit-for-review`, {});
            setSaveStatus('saved');
            setSaveMessage('Trimis spre review!');
            setDraftStatus(res.data.status);
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err) {
            console.error('Eroare la trimiterea spre review:', err);
            setSaveStatus('error');
            setSaveMessage(err.response?.data?.message || 'Eroare la trimiterea spre review');
            setTimeout(() => setSaveStatus('idle'), 5000);
        }
    }, [draftVersionId]);

    const initNewExercise = useCallback(async (quizId, type = EXERCISE_TYPES.CUSTOM) => {
        setLoadStatus('loading');
        setLoadMessage('Se creeaza exercitiu nou...');

        const emptyCanvas = createDefaultConfig({ type });

        try {
            const res = await api.post(`/exercises/draft/new?quizId=${quizId}`, {
                config: JSON.stringify(emptyCanvas),
                type: type,
                changeNote: 'Exercitiu creat din editor',
            });
            setExerciseId(res.data.exerciseId);
            setElements(emptyCanvas.elements);
            setCanvas(emptyCanvas.canvas || { ...DEFAULT_CANVAS });
            setMeta(emptyCanvas.meta);
            setSettings(emptyCanvas.settings);
            setSolution(emptyCanvas.solution);
            setHistory([JSON.parse(JSON.stringify(emptyCanvas.elements))]);
            setHistoryIndex(0);
            setDraftVersionId(res.data.id);
            setDraftStatus(res.data.status);
            setLoadStatus('loaded');
            setLoadMessage('');
            return res.data.exerciseId;
        } catch (err) {
            console.error('Eroare la creare:', err);
            setLoadStatus('error');
            setLoadMessage(err.response?.data?.message || 'Eroare la creare exercitiu');
            return null;
        }
    }, []);

    const loadDraft = useCallback(async (id) => {
        setLoadStatus('loading');
        setLoadMessage('Se incarca exercitiu...');

        try {
            const res = await api.get(`/exercises/${id}/draft`);
            const rawConfig = JSON.parse(res.data.config);
            const canvasState = migrateConfig(rawConfig);

            setExerciseId(id);
            setElements(canvasState.elements);
            setCanvas(canvasState.canvas || { ...DEFAULT_CANVAS });
            setMeta(canvasState.meta);
            setSettings(canvasState.settings);
            setSolution(canvasState.solution);
            setHistory([JSON.parse(JSON.stringify(canvasState.elements))]);
            setHistoryIndex(0);
            setSelectedIds([]);
            setDraftVersionId(res.data.id);
            setDraftStatus(res.data.status);
            setLoadStatus('loaded');
            setLoadMessage('');
        } catch (err) {
            console.error('Eroare la incarcare:', err);
            setLoadStatus('error');
            setLoadMessage(
                err.response?.status === 500 || err.response?.data?.message?.includes('Nu exista draft')
                    ? 'Nu exista draft pentru acest exercitiu'
                    : err.response?.data?.message || 'Eroare la incarcare'
            );
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;

            const isCtrlOrCmd = e.ctrlKey || e.metaKey;

            if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
            if ((isCtrlOrCmd && e.key === 'y') || (isCtrlOrCmd && e.shiftKey && e.key === 'Z')) {
                e.preventDefault(); redo(); return;
            }
            if (isCtrlOrCmd && e.key === 'c') { e.preventDefault(); copy(); return; }
            if (isCtrlOrCmd && e.key === 'v') { e.preventDefault(); paste(); return; }
            if (isCtrlOrCmd && e.key === 'd') { e.preventDefault(); duplicate(); return; }
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
                e.preventDefault(); deleteSelected(); return;
            }
            if (isCtrlOrCmd && e.key === 'a') {
                e.preventDefault();
                setSelectedIds(elements.map(el => el.id));
                return;
            }
            if (e.key === 'F11' || (isCtrlOrCmd && e.shiftKey && (e.key === 'f' || e.key === 'F'))) {
                e.preventDefault();
                setFullscreenMode(prev => !prev);
                return;
            }
            if (e.key === 'Escape') {
                if (fullscreenMode) setFullscreenMode(false);
                else clearSelection();
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, copy, paste, duplicate, deleteSelected, selectedIds, elements, clearSelection, fullscreenMode]);

    useEffect(() => {
        if (!autoSaveEnabled || !exerciseId || draftStatus !== 'DRAFT') return;

        const interval = setInterval(() => {
            const snapshot = JSON.stringify({ elements, canvas, meta, settings, solution });
            if (snapshot === lastSavedRef.current) return;
            if (saveStatus === 'saving') return;
            lastSavedRef.current = snapshot;
            saveDraft();
        }, 30000);

        return () => clearInterval(interval);
    }, [autoSaveEnabled, exerciseId, draftStatus, elements, canvas, meta, settings, solution, saveDraft, saveStatus]);

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    const updateSettings = useCallback((updates) => {
        setSettings(prev => ({ ...prev, ...updates }));
    }, []);

    const updateSolution = useCallback((updates) => {
        setSolution(prev => ({ ...prev, ...updates }));
    }, []);

    const updateMeta = useCallback((updates) => {
        setMeta(prev => ({ ...prev, ...updates }));
    }, []);

    const toggleCorrect = useCallback((elementId) => {
        setSolution(prev => {
            const isCorrect = prev.correctElementIds.includes(elementId);
            return {
                ...prev,
                correctElementIds: isCorrect
                    ? prev.correctElementIds.filter(id => id !== elementId)
                    : [...prev.correctElementIds, elementId],
            };
        });
    }, []);

    const value = {
        elements, setElements,
        selectedIds, setSelectedIds,
        selectedElement, selectedElements,
        selectOne, toggleSelection, clearSelection,
        mode, setMode,
        canvas, updateCanvas,
        addElement, addElementWithProps, updateElement, updateMultipleElements,
        deleteElement, deleteSelected,
        undo, redo, canUndo, canRedo,
        copy, paste, duplicate,
        alignElements, distributeElements,
        zoom, setZoom,
        stageOffset, setStageOffset,
        snapEnabled, setSnapEnabled,
        snapToGrid,
        GRID_SIZE,
        layersPanelOpen, setLayersPanelOpen,
        fullscreenMode, setFullscreenMode,
        reorderElement, bringToFront, sendToBack, bringForward, sendBackward,
        reparentElement,
        toggleLock, toggleHidden,
        exerciseId, setExerciseId,
        saveDraft, saveStatus, saveMessage,
        initNewExercise, loadDraft,
        loadStatus, loadMessage, meta, updateMeta,
        settings, updateSettings,
        solution, updateSolution,
        toggleCorrect, isCorrect: (id) => solution.correctElementIds.includes(id),
        draftVersionId, draftStatus, submitForReview,
        autoSaveEnabled, setAutoSaveEnabled,
    };

    return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor() {
    const ctx = useContext(EditorContext);
    if (!ctx) throw new Error('useEditor trebuie folosit în interiorul EditorProvider');
    return ctx;
}

function getDefaultElementProps(type) {
    switch (type) {
        case ELEMENT_TYPES.TEXT:
            return {
                text: 'Text nou', fontFamily: 'Nunito', fontSize: 24, fontStyle: 'normal',
                textDecoration: '', fill: '#1a1d23', align: 'left', verticalAlign: 'top',
                letterSpacing: 0, lineHeight: 1.2, width: 240, height: 60, rotation: 0, padding: 4,
                bgFill: 'transparent', bgStroke: 'transparent', bgStrokeWidth: 0, bgCornerRadius: 0,
                shadowEnabled: false, shadowColor: '#000000', shadowBlur: 4, shadowOpacity: 0.3,
                listStyle: 'none',
                locked: false, hidden: false,
            };
        case ELEMENT_TYPES.IMAGE:
            return {
                src: null, width: 200, height: 150, rotation: 0,
                cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1,
                fitMode: 'fit', opacity: 1,
                borderColor: 'transparent', borderWidth: 0, cornerRadius: 0,
                shadowEnabled: false, shadowColor: '#000000', shadowBlur: 8, shadowOpacity: 0.3,
                behavior: 'static',
                locked: false, hidden: false,
            };
        case ELEMENT_TYPES.SHAPE:
            return {
                shapeType: 'rect', fill: '#4F6BF6', stroke: '#1a1d23', strokeWidth: 2,
                width: 150, height: 100, cornerRadius: 8, rotation: 0, opacity: 1,
                shadowEnabled: false, shadowColor: '#000000', shadowBlur: 8, shadowOpacity: 0.3,
                behavior: 'static',
                locked: false, hidden: false,
            };
        case ELEMENT_TYPES.BOX:
            return {
                width: 300, height: 200, rotation: 0,
                bgFill: '#ffffff', bgStroke: '#e5e7eb', bgStrokeWidth: 2,
                bgCornerRadius: 12, padding: 12,
                shadowEnabled: false, shadowColor: '#000000',
                shadowBlur: 8, shadowOpacity: 0.15,
                parentId: null,
                role: null,
                locked: false, hidden: false,
            };
        case ELEMENT_TYPES.GRID:
            return {
                width: 400, height: 400, rotation: 0,
                rows: 3, cols: 3, gap: 10, cellPadding: 8,
                bgFill: '#ffffff', bgStroke: '#e5e7eb', bgStrokeWidth: 2,
                bgCornerRadius: 12,
                cellFill: '#f9fafb', cellStroke: '#e5e7eb', cellStrokeWidth: 1,
                cellCornerRadius: 8,
                shadowEnabled: false, shadowColor: '#000000',
                shadowBlur: 8, shadowOpacity: 0.15,
                parentId: null,
                role: null,
                locked: false, hidden: false,
            };
        case ELEMENT_TYPES.VIDEO:
            return {
                src: null, width: 320, height: 180, rotation: 0,
                posterSrc: null,
                autoplay: false, loop: false, muted: true,
                controls: true, opacity: 1,
                cornerRadius: 8,
                shadowEnabled: false, shadowColor: '#000000', shadowBlur: 8, shadowOpacity: 0.3,
                behavior: 'static',
                locked: false, hidden: false,
            };
        default:
            return {};
    }
}