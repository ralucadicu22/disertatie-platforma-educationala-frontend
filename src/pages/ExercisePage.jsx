import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import QuizStartScreen from '../components/quiz/QuizStartScreen';
import QuizFinishScreen from '../components/quiz/QuizFinishScreen';
import ExercisePlayer from '../components/player/ExercisePlayer';
import api from '../api/axios';

const ExercisePage = () => {
    const { quizId } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [exercises, setExercises] = useState([]);
    const [screen, setScreen] = useState('start');
    const [currentAttemptId, setCurrentAttemptId] = useState(null);
    const [exerciseIndex, setExerciseIndex] = useState(0);

    useEffect(() => {
        api.get(`/quizzes/${quizId}`)
            .then((r) => setQuiz(r.data))
            .catch(() => {});
    }, [quizId]);

    useEffect(() => {
        if (!quiz) return;
        api.get(`/exercises/quiz/${quiz.id}`)
            .then(r => setExercises(r.data))
            .catch(() => {});
    }, [quiz]);

    const handleStart = (attemptId) => {
        setCurrentAttemptId(attemptId);
        setExerciseIndex(0);
        setScreen('playing');
    };

    const handleFinishQuiz = () => {
        setScreen('finish');
    };

    const handleNextExercise = () => {
        if (exercises && exerciseIndex < exercises.length - 1) {
            setExerciseIndex((i) => i + 1);
        } else {
            handleFinishQuiz();
        }
    };

    const handleRestart = (newAttemptId) => {
        setCurrentAttemptId(newAttemptId);
        setExerciseIndex(0);
        setScreen('playing');
    };

    if (!quiz) return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="min-h-screen bg-neutral-50">
            {screen === 'start' && (
                <QuizStartScreen
                    quiz={quiz}
                    onStart={handleStart}
                />
            )}

            {screen === 'playing' && exercises?.[exerciseIndex] && (
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="mb-4 flex items-center gap-3">
                        <span className="text-caption text-neutral-600 font-semibold">
                            {exerciseIndex + 1} / {exercises.length}
                        </span>
                        <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-hero-primary rounded-full transition-all duration-500"
                                style={{
                                    width: `${((exerciseIndex + 1) / exercises.length) * 100}%`
                                }}
                            />
                        </div>
                        <button
                            onClick={handleFinishQuiz}
                            className="text-caption text-neutral-500 hover:text-neutral-700"
                        >
                            Termină
                        </button>
                    </div>

                    <ExercisePlayer
                        exerciseId={exercises[exerciseIndex].id}
                        onComplete={handleNextExercise}
                    />
                </div>
            )}

            {screen === 'playing' && exercises.length === 0 && (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
                </div>
            )}

            {screen === 'finish' && (
                <QuizFinishScreen
                    attemptId={currentAttemptId}
                    quizId={quiz.id}
                    quizTitle={quiz.title}
                    onRestart={handleRestart}
                />
            )}
        </div>
    );
};

export default ExercisePage;