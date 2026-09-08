import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, Check, X } from 'lucide-react';
import { Button, Textarea } from '../../design-system/components';
import { studentFeedbackApi } from '../../api/studentFeedbackApi';
import { notify } from '../../design-system/toast';
import { cn } from '../../design-system/cn';

const REACTIONS = [
    { value: 'LOVED_IT',   emoji: '😍', label: 'Mi-a placut mult' },
    { value: 'LIKED_IT',   emoji: '🙂', label: 'Mi-a placut' },
    { value: 'NEUTRAL',    emoji: '😐', label: 'Asa si asa' },
    { value: 'TOO_HARD',   emoji: '😰', label: 'Prea greu' },
    { value: 'CONFUSING',  emoji: '😕', label: 'Nu am inteles' },
    { value: 'BORING',     emoji: '😴', label: 'Plictisitor' },
];

const DIFFICULTY = [
    { value: 1, label: 'Foarte usor' },
    { value: 2, label: 'Usor' },
    { value: 3, label: 'Mediu' },
    { value: 4, label: 'Greu' },
    { value: 5, label: 'Foarte greu' },
];

const ExerciseFeedbackWidget = ({ exerciseId, onDismiss }) => {
    const [step, setStep] = useState('reaction'); // 'reaction' | 'details' | 'done'
    const [form, setForm] = useState({
        reaction: null,
        difficultyRating: null,
        enjoymentRating: null,
        comment: '',
    });
    const [saving, setSaving] = useState(false);
    const [existingFeedback, setExistingFeedback] = useState(null);

    useEffect(() => {
        studentFeedbackApi.getMyForExercise(exerciseId)
            .then((data) => {
                if (data) {
                    setExistingFeedback(data);
                    setStep('done');
                }
            })
            .catch(() => {}); // 204 = nu are feedback, ignoram eroarea
    }, [exerciseId]);

    const handleReactionSelect = (reaction) => {
        setForm((f) => ({ ...f, reaction }));
        setStep('details');
    };

    const handleSubmit = async () => {
        if (!form.reaction && !form.difficultyRating) {
            notify.warning('Selecteaza cel putin o reactie sau un nivel de dificultate');
            return;
        }
        setSaving(true);
        try {
            await studentFeedbackApi.submit({
                exerciseId,
                reaction: form.reaction || null,
                difficultyRating: form.difficultyRating || null,
                enjoymentRating: form.enjoymentRating || null,
                comment: form.comment.trim() || null,
            });
            setStep('done');
            notify.success('Multumim pentru feedback!');
        } catch (err) {
            notify.error(err?.response?.data?.message || 'Nu am putut salva feedback-ul');
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="mt-4 bg-white rounded-xl border-2 border-primary-100 p-4 shadow-md"
        >
            <AnimatePresence mode="wait">
                {step === 'reaction' && (
                    <motion.div
                        key="reaction"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <MessageSquarePlus className="w-5 h-5 text-primary-500" />
                                <span className="text-body font-semibold text-neutral-800">
                                    Ce parere ai despre acest exercitiu?
                                </span>
                            </div>
                            <button
                                onClick={onDismiss}
                                className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                            {REACTIONS.map((r) => (
                                <button
                                    key={r.value}
                                    onClick={() => handleReactionSelect(r.value)}
                                    className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-primary-50 transition-all group"
                                    title={r.label}
                                >
                                    <span className="text-2xl group-hover:scale-125 transition-transform">
                                        {r.emoji}
                                    </span>
                                    <span className="text-[10px] text-neutral-500 text-center leading-tight hidden md:block">
                                        {r.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={onDismiss}
                            className="mt-2 text-caption text-neutral-400 hover:text-neutral-600 w-full text-center"
                        >
                            Nu acum
                        </button>
                    </motion.div>
                )}

                {step === 'details' && (
                    <motion.div
                        key="details"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-body font-semibold text-neutral-800">
                                Spune-ne mai multe (optional)
                            </span>
                            <span className="text-2xl">
                                {REACTIONS.find((r) => r.value === form.reaction)?.emoji}
                            </span>
                        </div>
                        <div>
                            <label className="block text-caption text-neutral-600 mb-2">
                                Cat de greu ti s-a parut?
                            </label>
                            <div className="flex gap-2">
                                {DIFFICULTY.map((d) => (
                                    <button
                                        key={d.value}
                                        onClick={() => setForm((f) => ({
                                            ...f,
                                            difficultyRating: f.difficultyRating === d.value ? null : d.value,
                                        }))}
                                        title={d.label}
                                        className={cn(
                                            'flex-1 py-2 rounded-md text-caption font-bold border-2 transition-all',
                                            form.difficultyRating === d.value
                                                ? 'border-primary-400 bg-primary-50 text-primary-700'
                                                : 'border-neutral-200 text-neutral-500 hover:border-primary-200'
                                        )}
                                    >
                                        {d.value}
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between mt-1">
                                <span className="text-[10px] text-neutral-400">Usor</span>
                                <span className="text-[10px] text-neutral-400">Greu</span>
                            </div>
                        </div>

                        <Textarea
                            placeholder="Vrei sa adaugi ceva? (optional)"
                            value={form.comment}
                            onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                            rows={2}
                            maxLength={500}
                            resize="none"
                        />

                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setStep('reaction')}
                                className="flex-1"
                            >
                                Inapoi
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSubmit}
                                loading={saving}
                                className="flex-1"
                            >
                                Trimite feedback
                            </Button>
                        </div>
                    </motion.div>
                )}
                {step === 'done' && (
                    <motion.div
                        key="done"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-between py-2"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
                                <Check className="w-5 h-5 text-success-600" />
                            </div>
                            <span className="text-body font-semibold text-neutral-700">
                                {existingFeedback
                                    ? 'Ai lasat deja feedback pentru acest exercitiu'
                                    : 'Multumim pentru feedback!'}
                            </span>
                        </div>
                        <button
                            onClick={onDismiss}
                            className="p-1 rounded hover:bg-neutral-100 text-neutral-400 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ExerciseFeedbackWidget;