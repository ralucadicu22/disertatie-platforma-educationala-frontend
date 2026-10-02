import { useEffect, useState } from 'react';
import { Plus, MessageSquare, AlertCircle } from 'lucide-react';
import { Button, EmptyState, Skeleton } from '../design-system/components';
import FeedbackCard from '../components/feedback/FeedbackCard';
import SendFeedbackModal from '../components/feedback/SendFeedbackModal';
import { teacherFeedbackApi } from '../api/teacherFeedbackApi';
import { notify } from '../design-system/toast';

const TeacherFeedbackPage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);
    const [sendOpen, setSendOpen] = useState(false);

    const user = JSON.parse(localStorage.getItem('user') || 'null');

    const load = () => {
        setLoading(true);
        setError(null);
        teacherFeedbackApi.getMyGiven()
            .then((data) => { setFeedbacks(data || []); setLoading(false); })
            .catch((err) => {
                setError(err?.response?.data?.message || 'Nu am putut încărca feedback-urile');
                setLoading(false);
            });
    };

    useEffect(() => { load(); }, []);

    const handleDelete = async (id) => {
        try {
            await teacherFeedbackApi.delete(id);
            notify.success('Feedback sters');
            setFeedbacks((prev) => prev.filter((f) => f.id !== id));
        } catch (err) {
            notify.error(err?.response?.data?.message || 'Nu am putut sterge feedback-ul');
        }
    };

    return (
        <div user={user} title="Feedback elevi">
            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <h1 className="text-h1 text-neutral-900">Feedback pentru elevi</h1>
                    <p className="text-body-lg text-neutral-600 mt-1">
                        Trimite mesaje personalizate și monitorizează progresul elevilor.
                    </p>
                </div>
                <Button variant="primary" icon={Plus} onClick={() => setSendOpen(true)}>
                    Trimite feedback
                </Button>
            </div>

            {loading && (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} variant="card" height={160} />)}
                </div>
            )}

            {error && !loading && (
                <EmptyState
                    icon={AlertCircle}
                    variant="warm"
                    title="A aparut o eroare"
                    description={error}
                    action={<Button variant="primary" onClick={load}>Reîncarcă</Button>}
                />
            )}

            {!loading && !error && feedbacks.length === 0 && (
                <EmptyState
                    icon={MessageSquare}
                    variant="primary"
                    title="Nu ai trimis niciun feedback încă"
                    description="Trimite primul mesaj unui elev pentru a-l motiva sau ghida."
                    action={
                        <Button variant="primary" icon={Plus} onClick={() => setSendOpen(true)}>
                            Trimite primul feedback
                        </Button>
                    }
                />
            )}

            {!loading && !error && feedbacks.length > 0 && (
                <div className="space-y-3">
                    {feedbacks.map((f, index) => (
                        <FeedbackCard
                            key={f.id}
                            feedback={f}
                            perspective="teacher"
                            onDelete={handleDelete}
                            index={index}
                        />
                    ))}
                </div>
            )}

            <SendFeedbackModal
                open={sendOpen}
                onClose={() => setSendOpen(false)}
                onSent={load}
            />
        </div>
    );
};

export default TeacherFeedbackPage;