import { useEffect, useMemo } from 'react';
import { useEditor } from '../../store/editorStore.jsx';
import { createMockPreviewApi } from '../../api/mockPreviewApi';
import { setApiOverride, clearApiOverride } from '../../api/axios';
import FindAndSelectPlayer from '../player/FindAndSelectPlayer';
import DragAndDropPlayer from '../player/DragAndDropPlayer';
import FindAndCountPlayer from '../player/FindAndCountPlayer';
import LogicalSeriesPlayer from '../player/LogicalSeriesPlayer';
import TextProblemsPlayer from '../player/TextProblemsPlayer';
import TablesChartsPlayer from '../player/TablesChartsPlayer';
import ColoringPlayer from '../player/ColoringPlayer';
import PuzzlePlayer from '../player/PuzzlePlayer';
import VideoPlayer from '../player/VideoPlayer';
import PdfPlayer from '../player/PdfPlayer';
import GridBasedPlayer from '../player/GridBasedPlayer';
import MultipleChoicePlayer from '../player/MultipleChoicePlayer';
import OrderingPlayer from '../player/OrderingPlayer';
import MatchingPlayer from '../player/MatchingPlayer';
import { EXERCISE_TYPES } from '../../constants/exerciseTypes';

const PLAYERS_BY_TYPE = {
    [EXERCISE_TYPES.FIND_AND_SELECT]: FindAndSelectPlayer,
    [EXERCISE_TYPES.DRAG_AND_DROP]: DragAndDropPlayer,
    [EXERCISE_TYPES.FIND_AND_COUNT]: FindAndCountPlayer,
    [EXERCISE_TYPES.LOGICAL_SERIES]: LogicalSeriesPlayer,
    [EXERCISE_TYPES.TEXT_PROBLEMS]: TextProblemsPlayer,
    [EXERCISE_TYPES.TABLES_CHARTS]: TablesChartsPlayer,
    [EXERCISE_TYPES.COLORING]: ColoringPlayer,
    [EXERCISE_TYPES.PUZZLE]: PuzzlePlayer,
    [EXERCISE_TYPES.VIDEO]: VideoPlayer,
    [EXERCISE_TYPES.PDF]: PdfPlayer,
    [EXERCISE_TYPES.GRID_BASED]: GridBasedPlayer,
    [EXERCISE_TYPES.MULTIPLE_CHOICE]: MultipleChoicePlayer,
    [EXERCISE_TYPES.ORDERING]: OrderingPlayer,
    [EXERCISE_TYPES.MATCHING]: MatchingPlayer,
};

export default function PreviewPanel() {
    const { elements, canvas, meta, settings, solution, setMode } = useEditor();

    const correctElementIds = Array.isArray(solution.correctElementIds) ? solution.correctElementIds : [];

    const config = useMemo(() => ({
        version: 1,
        meta: { ...meta },
        canvas: { ...canvas },
        elements: JSON.parse(JSON.stringify(elements)),
        settings: { ...settings },
        solution: {
            correctElementIds,
            correctElementId: correctElementIds[0] || null,
            correctCount: correctElementIds.length || Object.keys(solution.dropMapping || {}).length,
            dropMapping: solution.dropMapping || {},
            correctAnswers: solution.correctAnswers || {},
            correctCellKeys: solution.correctCellKeys || [],
            correctColors: solution.correctColors || {},
            coloringCount: solution.coloringCount || 0,
            targets: solution.targets || [],
            alternativeAnswers: solution.alternativeAnswers || [],
            correctOrder: solution.correctOrder || [],
            matchMapping: solution.matchMapping || {},
            puzzleMapping: solution.puzzleMapping || {},
        },
    }), [elements, canvas, meta, settings, solution]);

    const fullConfigForMock = useMemo(() => ({
        ...config,
        solution: {
            ...config.solution,
            correctElementIds,
            correctElementId: correctElementIds[0] || null,
            dropMapping: solution.dropMapping || {},
            correctAnswers: solution.correctAnswers || {},
            correctCellKeys: solution.correctCellKeys || [],
            correctColors: solution.correctColors || {},
            coloringCount: solution.coloringCount || 0,
            alternativeAnswers: solution.alternativeAnswers || [],
            correctOrder: solution.correctOrder || [],
            matchMapping: solution.matchMapping || {},
            puzzleMapping: solution.puzzleMapping || {},
        },
    }), [config, solution]);

    useEffect(() => {
        const mockApi = createMockPreviewApi(fullConfigForMock);
        setApiOverride(mockApi);
        return () => clearApiOverride();
    }, [fullConfigForMock]);

    const type = meta?.type;
    const PlayerComponent = PLAYERS_BY_TYPE[type];

    if (!PlayerComponent) {
        return (
            <div style={styles.panel}>
                <div style={styles.header}>
                    <span style={styles.badge}>PREVIZUALIZARE</span>
                    <button onClick={() => setMode('editor')} style={styles.exitBtn}>
                        ← Înapoi la editor
                    </button>
                </div>
                <p style={styles.emptyText}>
                    Tipul de exercițiu „{type || 'necunoscut'}" nu are player disponibil pentru preview.
                </p>
            </div>
        );
    }

    return (
        <div style={styles.wrapper}>
            <div style={styles.previewHeader}>
                <span style={styles.badge}>🔍 PREVIZUALIZARE — răspunsurile nu se salvează</span>
                <button onClick={() => setMode('editor')} style={styles.exitBtn}>
                    ✕ Închide preview
                </button>
            </div>
            <PlayerComponent
                exerciseId={-1}
                config={config}
                onExit={() => setMode('editor')}
                isPreview={true}
            />
        </div>
    );
}

const styles = {
    wrapper: {
        position: 'fixed', inset: 0, background: 'white',
        zIndex: 50, display: 'flex', flexDirection: 'column',
    },
    previewHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 16px', background: '#eef2ff',
        borderBottom: '1px solid #c7d2fe', flexShrink: 0,
    },
    badge: { fontSize: '0.75rem', fontWeight: 800, color: '#4F6BF6', letterSpacing: '0.5px' },
    exitBtn: {
        background: 'white', border: '1.5px solid #c7d2fe', color: '#4F6BF6',
        padding: '6px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
    },
    panel: { background: 'white', borderTop: '1px solid #e5e7eb', padding: '20px 24px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    emptyText: { color: '#9ca3af', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center', margin: '20px 0' },
};
