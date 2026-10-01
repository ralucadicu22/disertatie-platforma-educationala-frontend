import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import {
    Modal, Button, Textarea, Select, Badge,
} from '../../design-system/components';
import { teacherFeedbackApi } from '../../api/teacherFeedbackApi';
import { classroomApi } from '../../api/classroomApi';
import { userApi } from '../../api/userApi';
import { notify } from '../../design-system/toast';
import { cn } from '../../design-system/cn';

const TAGS = [
    { value: 'PRAISE',             label: '🎉 Felicitare' },
    { value: 'ENCOURAGEMENT',      label: '💪 Incurajare' },
    { value: 'IMPROVEMENT_NEEDED', label: '📈 De imbunătățit' },
    { value: 'WARNING',            label: '⚠️ Atenție' },
];

const RATINGS = [1, 2, 3, 4, 5];

const SendFeedbackModal = ({ open, onClose, prefilledStudentId, onSent }) => {
    const [students, setStudents] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        studentId: prefilledStudentId ? String(prefilledStudentId) : '',
        classroomId: '',
        message: '',
        rating: null,
        tag: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!open) return;
        setForm({
            studentId: prefilledStudentId ? String(prefilledStudentId) : '',
            classroomId: '',
            message: '',
            rating: null,
            tag: '',
        });
        setErrors({});
        setLoading(true);

        Promise.all([
            userApi.getByRole('ELEV'),
            classroomApi.getMy(),
        ])
            .then(([s, c]) => {
                setStudents(s || []);
                setClassrooms(c || []);
                setLoading(false);
            })
            .catch(() => {
                notify.error('Nu am putut încarcă datele');
                setLoading(false);
            });
    }, [open, prefilledStudentId]);

    const set = (key) => (e) =>
        setForm((f) => ({ ...f, [key]: e.target?.value ?? e }));

    const validate = () => {
        const e = {};
        if (!form.studentId) e.studentId = 'Selectează un elev';
        if (!form.message.trim()) e.message = 'Mesajul este obligatoriu';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            await teacherFeedbackApi.create({
                studentId: Number(form.studentId),
                classroomId: form.classroomId ? Number(form.classroomId) : null,
                message: form.message.trim(),
                rating: form.rating || null,
                tag: form.tag || null,
            });
            notify.success('Feedback trimis cu succes!');
            onSent?.();
            onClose();
        } catch (err) {
            notify.error(err?.response?.data?.message || 'Nu am putut trimite feedback-ul');
        } finally {
            setSaving(false);
        }
    };

    const studentOptions = students.map((s) => ({ value: String(s.id), label: s.name }));
    const classroomOptions = classrooms.map((c) => ({ value: String(c.id), label: c.name }));

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Trimite feedback"
            description="Lasă un mesaj personalizat pentru un elev."
            size="md"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={saving}>
                        Anulează
                    </Button>
                    <Button
                        variant="primary"
                        icon={Send}
                        onClick={handleSubmit}
                        loading={saving}
                    >
                        Trimite feedback
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <Select
                    label="Elev"
                    placeholder="Selectează elevul"
                    value={form.studentId}
                    onChange={set('studentId')}
                    options={studentOptions}
                    error={errors.studentId}
                    disabled={!!prefilledStudentId || loading}
                />

                <Select
                    label="Clasa (opțional)"
                    placeholder="Selectează clasa"
                    value={form.classroomId}
                    onChange={set('classroomId')}
                    options={classroomOptions}
                />

                <div>
                    <label className="block text-caption text-neutral-700 mb-2">
                        Tip feedback (opțional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {TAGS.map((t) => (
                            <button
                                key={t.value}
                                onClick={() => setForm((f) => ({
                                    ...f,
                                    tag: f.tag === t.value ? '' : t.value,
                                }))}
                                className={cn(
                                    'px-3 py-1.5 rounded-md text-body font-semibold border-2 transition-all',
                                    form.tag === t.value
                                        ? 'border-primary-400 bg-primary-50 text-primary-700'
                                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-200'
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-caption text-neutral-700 mb-2">
                        Rating (optional)
                    </label>
                    <div className="flex gap-2">
                        {RATINGS.map((r) => (
                            <button
                                key={r}
                                onClick={() => setForm((f) => ({
                                    ...f,
                                    rating: f.rating === r ? null : r,
                                }))}
                                className={cn(
                                    'w-10 h-10 rounded-md text-h3 transition-all border-2',
                                    form.rating >= r
                                        ? 'border-warning-400 bg-warning-50 text-warning-500'
                                        : 'border-neutral-200 bg-white text-neutral-300 hover:border-warning-200'
                                )}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                </div>

                <Textarea
                    label="Mesaj"
                    placeholder="Scrie un mesaj pentru elev..."
                    value={form.message}
                    onChange={set('message')}
                    rows={4}
                    maxLength={2000}
                    error={errors.message}
                />
            </div>
        </Modal>
    );
};

export default SendFeedbackModal;