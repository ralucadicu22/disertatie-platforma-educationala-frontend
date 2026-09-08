import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Modal, Button, Input, Select, Textarea } from '../../design-system/components';
import { classroomApi } from '../../api/classroomApi';
import { GRADE_LEVEL_OPTIONS } from '../../utils/gradeLevel';
import { notify } from '../../design-system/toast';

const CreateClassroomModal = ({ open, onClose, onCreated }) => {
    const [form, setForm] = useState({
        name: '',
        description: '',
        schoolYear: '2024-2025',
        gradeLevel: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const set = (key) => (e) =>
        setForm((f) => ({ ...f, [key]: e.target?.value ?? e }));

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Numele clasei este obligatoriu';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const created = await classroomApi.create({
                name: form.name.trim(),
                description: form.description.trim() || null,
                schoolYear: form.schoolYear.trim() || null,
                gradeLevel: form.gradeLevel || null,
            });
            notify.success(`Clasa "${created.name}" a fost creata`);
            onCreated?.(created);
            onClose();
            setForm({ name: '', description: '', schoolYear: '2024-2025', gradeLevel: '' });
            setErrors({});
        } catch (err) {
            notify.error(err?.response?.data?.message || 'Nu am putut crea clasa');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Clasa noua"
            description="Adauga o clasa pentru a organiza elevi si quiz-uri."
            size="md"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Anuleaza
                    </Button>
                    <Button variant="primary" icon={Sparkles} onClick={handleSubmit} loading={loading}>
                        Creeaza clasa
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <Input
                    label="Numele clasei"
                    placeholder="Ex: 3B - Matematica"
                    value={form.name}
                    onChange={set('name')}
                    error={errors.name}
                    autoFocus
                />
                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Nivel"
                        placeholder="Alege nivelul"
                        value={form.gradeLevel}
                        onChange={set('gradeLevel')}
                        options={GRADE_LEVEL_OPTIONS}
                    />
                    <Input
                        label="An scolar"
                        placeholder="2024-2025"
                        value={form.schoolYear}
                        onChange={set('schoolYear')}
                    />
                </div>
                <Textarea
                    label="Descriere"
                    placeholder="Descriere scurta (optional)"
                    value={form.description}
                    onChange={set('description')}
                    rows={3}
                    maxLength={500}
                />
            </div>
        </Modal>
    );
};

export default CreateClassroomModal;