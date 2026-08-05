import { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { EditorProvider, useEditor } from '../store/editorStore.jsx';
import EditorTopBar from '../components/editor/EditorTopBar';
import EditorToolbar from '../components/editor/EditorToolbar';
import EditorCanvas from '../components/editor/EditorCanvas';
import EditorPropertiesPanel from '../components/editor/EditorPropertiesPanel';
import LayersPanel from '../components/editor/LayersPanel.jsx';
import SolutionPanel from '../components/editor/SolutionPanel';
import PreviewPanel from "../components/editor/PreviewPanel.jsx";

function EditorContent({ initialMode = 'existing' }) {
    const { exerciseId: routeExerciseId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const {
        mode, initNewExercise, loadDraft, loadStatus, loadMessage, exerciseId,
        fullscreenMode, setFullscreenMode,
    } = useEditor();

    useEffect(() => {
        if (initialMode === 'new') {
            const quizId = searchParams.get('quizId');
            const type = searchParams.get('type') || 'CUSTOM';

            if (!quizId) {
                navigate('/');
                return;
            }
            initNewExercise(parseInt(quizId), type)
                .then(newId => {
                    if (newId) navigate(`/editor/${newId}`, { replace: true });
                });
        } else if (routeExerciseId) {
            loadDraft(parseInt(routeExerciseId));
        }
    }, []);

    if (loadStatus === 'loading') {
        return (
            <div style={styles.centeredMsg}>
                <div style={styles.spinner} />
                <p style={styles.msgText}>{loadMessage || 'Se încarcă...'}</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (loadStatus === 'error') {
        return (
            <div style={styles.centeredMsg}>
                <div style={styles.errorIcon}>⚠️</div>
                <p style={styles.errorText}>{loadMessage}</p>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button style={styles.backBtn} onClick={() => navigate('/')}>
                        ← Înapoi
                    </button>
                    <button
                        style={{ ...styles.backBtn, background: '#4F6BF6', color: 'white', border: 'none' }}
                        onClick={() => loadDraft(parseInt(routeExerciseId))}
                    >
                        🔄 Reîncearcă
                    </button>
                </div>
            </div>
        );
    }

    if (loadStatus === 'idle' && !exerciseId) {
        return (
            <div style={styles.centeredMsg}>
                <p style={styles.msgText}>Se pregătește editorul...</p>
            </div>
        );
    }

    if (fullscreenMode) {
        return (
            <div style={styles.editorRoot}>
                <div style={styles.mainAreaFullscreen}>
                    <EditorCanvas />
                </div>
                <button
                    style={styles.exitFullscreenBtn}
                    onClick={() => setFullscreenMode(false)}
                    title="Ieși din fullscreen (Esc)"
                >
                    ✕ Ieși din fullscreen
                </button>
            </div>
        );
    }

    return (
        <div style={styles.editorRoot}>
            <EditorTopBar />
            <div style={styles.mainArea}>
                <EditorToolbar />
                <EditorCanvas />
                <LayersPanel />
            </div>

            {mode === 'editor' && <EditorPropertiesPanel />}
            {mode === 'solution' && <SolutionPanel />}
            {mode === 'preview' && <PreviewPanel />}
        </div>
    );
}

export default function ExerciseEditor({ mode = 'existing' }) {
    return (
        <EditorProvider>
            <EditorContent initialMode={mode} />
        </EditorProvider>
    );
}

const styles = {
    editorRoot: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#f9fafb',
    },
    mainArea: {
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
    },
    mainAreaFullscreen: {
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
        background: '#f0f2f5',
    },
    exitFullscreenBtn: {
        position: 'fixed',
        top: 16,
        right: 16,
        background: 'rgba(26, 29, 35, 0.85)',
        color: 'white',
        border: 'none',
        borderRadius: 10,
        padding: '8px 14px',
        fontSize: '0.82rem',
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 100,
        backdropFilter: 'blur(6px)',
    },
    centeredMsg: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: 16,
        background: '#f9fafb',
    },
    spinner: {
        width: 40,
        height: 40,
        border: '3px solid #e5e7eb',
        borderTop: '3px solid #4F6BF6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
    msgText: {
        fontSize: '0.9rem',
        color: '#6b7280',
        fontWeight: 600,
    },
    errorIcon: { fontSize: '2rem' },
    errorText: {
        fontSize: '0.9rem',
        color: '#dc2626',
        fontWeight: 700,
        maxWidth: 400,
        textAlign: 'center',
    },
    backBtn: {
        padding: '10px 20px',
        background: 'white',
        border: '1.5px solid #e5e7eb',
        borderRadius: 10,
        fontSize: '0.85rem',
        fontWeight: 700,
        color: '#374151',
        cursor: 'pointer',
    },
};