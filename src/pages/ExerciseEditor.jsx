import { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { EditorProvider, useEditor } from '../store/editorStore.jsx';
import EditorTopBar from '../components/editor/EditorTopBar';
import EditorToolbar from '../components/editor/EditorToolbar';
import EditorCanvas from '../components/editor/EditorCanvas';
import EditorPropertiesPanel from '../components/editor/EditorPropertiesPanel';
import LayersPanel from '../components/editor/LayersPanel';
import SolutionPanel from '../components/editor/SolutionPanel';
import PreviewPanel from '../components/editor/PreviewPanel';

export default function ExerciseEditor({ mode }) {
    return (
        <EditorProvider>
            <EditorContent mode={mode} />
        </EditorProvider>
    );
}

function EditorContent({ mode: routeMode }) {
    const { exerciseId: urlExerciseId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { initNewExercise, loadDraft, loadStatus, loadMessage, mode } = useEditor();

    useEffect(() => {
        const run = async () => {
            if (routeMode === 'new') {
                const quizId = searchParams.get('quizId');
                const type = searchParams.get('type') || 'CUSTOM';
                if (!quizId) {
                    console.error('Lipseste quizId in URL');
                    return;
                }
                const newExerciseId = await initNewExercise(quizId, type);
                if (newExerciseId) {
                    navigate(`/editor/${newExerciseId}`, { replace: true });
                }
            } else if (routeMode === 'existing' && urlExerciseId) {
                await loadDraft(urlExerciseId);
            }
        };
        run();
    }, [routeMode, urlExerciseId]);

    if (loadStatus === 'loading') {
        return (
            <div style={styles.loadingPage}>
                <div style={styles.spinner} />
                <p style={styles.loadingText}>{loadMessage}</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (loadStatus === 'error') {
        return (
            <div style={styles.loadingPage}>
                <div style={styles.errorIcon}>⚠️</div>
                <p style={styles.errorText}>{loadMessage}</p>
                <button style={styles.backBtn} onClick={() => navigate('/')}>
                    Inapoi la pagina principala
                </button>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <EditorTopBar />
            <div style={styles.body}>
                {mode === 'editor' && <EditorToolbar />}
                <div style={styles.canvasArea}>
                    <EditorCanvas />
                    {mode !== 'preview' && <LayersPanel />}
                </div>
            </div>
            {mode === 'editor' && <EditorPropertiesPanel />}
            {mode === 'solution' && <SolutionPanel />}
            {mode === 'preview' && <PreviewPanel />}
        </div>
    );
}

const styles = {
    page: {
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f0f2f5',
        overflow: 'hidden',
    },
    body: {
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
    },
    canvasArea: {
        flex: 1,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
    },
    loadingPage: {
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: '#f0f2f5',
    },
    spinner: {
        width: 48,
        height: 48,
        border: '4px solid #e5e7eb',
        borderTop: '4px solid #4F6BF6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
    loadingText: {
        fontSize: '0.95rem',
        fontWeight: 700,
        color: '#6b7280',
    },
    errorIcon: {
        fontSize: '3rem',
    },
    errorText: {
        fontSize: '1rem',
        fontWeight: 700,
        color: '#dc2626',
        maxWidth: 400,
        textAlign: 'center',
    },
    backBtn: {
        padding: '10px 20px',
        background: '#4F6BF6',
        color: 'white',
        border: 'none',
        borderRadius: 10,
        fontSize: '0.9rem',
        fontWeight: 700,
        cursor: 'pointer',
    },
};