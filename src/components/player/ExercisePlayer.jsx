import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { migrateConfig } from '../../utils/configFactory';
import { EXERCISE_TYPES } from '../../constants/exerciseTypes';
import FindAndSelectPlayer from './FindAndSelectPlayer';

// Adaugi aici o linie noua pentru fiecare tip nou implementat.
const PLAYERS_BY_TYPE = {
    [EXERCISE_TYPES.FIND_AND_SELECT]: FindAndSelectPlayer,
};

export default function ExercisePlayer() {
    const { exerciseId } = useParams();
    const navigate = useNavigate();
    const [exercise, setExercise] = useState(null);
    const [config, setConfig] = useState(null);
    const [status, setStatus] = useState('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let cancelled = false;

        api.get(`/exercises/${exerciseId}`)
            .then(res => {
                if (cancelled) return;
                if (!res.data.config) {
                    setStatus('error');
                    setErrorMessage('Acest exercițiu nu are o versiune publicată.');
                    return;
                }
                const parsed = migrateConfig(JSON.parse(res.data.config));
                setExercise(res.data);
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

    const type = config.meta?.type;
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
            onExit={() => navigate(-1)}
        />
    );
}

const styles = {
    centered: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 16, minHeight: '100vh', background: '#f0f2f5', padding: 20, textAlign: 'center',
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