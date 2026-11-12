import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { migrateConfig } from '../../utils/configFactory';
import { EXERCISE_TYPES } from '../../constants/exerciseTypes';
import FindAndSelectPlayer from './FindAndSelectPlayer';
import DragAndDropPlayer from './DragAndDropPlayer';
import InputTextPlayer from "./InputTextPlayer.jsx";
import InputNumericPlayer from "./InputNumericPlayer.jsx";
import OrderingPlayer from "./OrderingPlayer.jsx";
import MatchingPlayer from "./MatchingPlayer.jsx";
import MultipleChoicePlayer from "./MultipleChoicePlayer.jsx";
import FindAndCountPlayer from "./FindAndCountPlayer.jsx";
import LogicalSeriesPlayer from "./LogicalSeriesPlayer.jsx";
import ColoringPlayer from "./ColoringPlayer.jsx";
import GridBasedPlayer from "./GridBasedPlayer.jsx";
import PdfPlayer from "./PdfPlayer.jsx";
import PuzzlePlayer from "./PuzzlePlayer.jsx";
import TablesChartsPlayer from "./TablesChartsPlayer.jsx";
import TextProblemsPlayer from "./TextProblemsPlayer.jsx";
import VideoPlayer from "./VideoPlayer.jsx";

const PLAYERS_BY_TYPE = {
    [EXERCISE_TYPES.FIND_AND_SELECT]: FindAndSelectPlayer,
    [EXERCISE_TYPES.DRAG_AND_DROP]: DragAndDropPlayer,
    [EXERCISE_TYPES.INPUT_TEXT]: InputTextPlayer,
    [EXERCISE_TYPES.INPUT_NUMERIC]: InputNumericPlayer,
    [EXERCISE_TYPES.ORDERING]: OrderingPlayer,
    [EXERCISE_TYPES.MATCHING]: MatchingPlayer,
    [EXERCISE_TYPES.MULTIPLE_CHOICE]: MultipleChoicePlayer,
    [EXERCISE_TYPES.FIND_AND_COUNT]:FindAndCountPlayer,
    [EXERCISE_TYPES.LOGICAL_SERIES]:LogicalSeriesPlayer,
    [EXERCISE_TYPES.COLORING]:ColoringPlayer,
    [EXERCISE_TYPES.GRID_BASED]:GridBasedPlayer,
    [EXERCISE_TYPES.PDF]:PdfPlayer,
    [EXERCISE_TYPES.PUZZLE]:PuzzlePlayer,
    [EXERCISE_TYPES.TABLES_CHARTS]:TablesChartsPlayer,
    [EXERCISE_TYPES.TEXT_PROBLEMS]:TextProblemsPlayer,
    [EXERCISE_TYPES.VIDEO]:VideoPlayer

};

export default function ExercisePlayer({ exerciseId, onComplete }) {
    const navigate = useNavigate();
    const [config, setConfig] = useState(null);
    const [status, setStatus] = useState('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!exerciseId) return;
        let cancelled = false;

        setStatus('loading');
        setConfig(null);

        api.get(`/exercises/${exerciseId}`)
            .then(res => {
                if (cancelled) return;
                if (!res.data.config) {
                    setStatus('error');
                    setErrorMessage('Acest exercițiu nu are o versiune publicată.');
                    return;
                }
                const parsed = migrateConfig(JSON.parse(res.data.config));
                setConfig(parsed);
                setStatus('ready');
            })
            .catch(err => {
                if (cancelled) return;
                console.error(err);
                setStatus('error');
                setErrorMessage(err.response?.data?.message || 'Eroare la încărcarea exercițiului');
            });

        return () => { cancelled = true; };
    }, [exerciseId]);

    if (status === 'loading') {
        return (
            <div style={styles.centered}>
                <div style={styles.spinner} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div style={styles.centered}>
                <div style={styles.errorIcon}>⚠️</div>
                <p style={styles.errorText}>{errorMessage}</p>
                <button style={styles.backBtn} onClick={() => navigate(-1)}>Înapoi</button>
            </div>
        );
    }

    const type = config?.meta?.type;
    const PlayerComponent = PLAYERS_BY_TYPE[type];

    if (!PlayerComponent) {
        return (
            <div style={styles.centered}>
                <div style={styles.errorIcon}>🚧</div>
                <p style={styles.errorText}>
                    Tipul de exercițiu „{type}" nu are încă un player implementat.
                </p>
                <button style={styles.backBtn} onClick={() => navigate(-1)}>Înapoi</button>
            </div>
        );
    }

    return (
        <PlayerComponent
            exerciseId={Number(exerciseId)}
            config={config}
            onExit={onComplete || (() => navigate(-1))}
        />
    );
}

const styles = {
    centered: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 16, minHeight: '60vh', background: '#f0f2f5', padding: 20, textAlign: 'center',
        borderRadius: 16,
    },
    spinner: {
        width: 40, height: 40, border: '3px solid #e5e7eb', borderTop: '3px solid #4F6BF6',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
    },
    errorIcon: { fontSize: '2.5rem' },
    errorText: { fontSize: '0.95rem', fontWeight: 700, color: '#6b7280', maxWidth: 420 },
    backBtn: {
        padding: '10px 20px', background: '#4F6BF6', color: 'white', border: 'none',
        borderRadius: 10, fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
    },
};