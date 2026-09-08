import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Inbox, CheckCheck, AlertCircle } from 'lucide-react';
import { Button, Badge, EmptyState, Skeleton, Tabs } from '../design-system/components';
import FeedbackCard from '../components/feedback/FeedbackCard';
import { teacherFeedbackApi } from '../api/teacherFeedbackApi';
import { notify } from '../design-system/toast';

const StudentFeedbackInboxPage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);
    const [tab, setTab] = useState('all');
    const [markingAllRead, setMarkingAllRead] = useState(false);

    const user = JSON.parse(localStorage.getItem('user') || 'null');

    const load = () => {
        setLoading(true);
        setError(null);
        teacherFeedbackApi.getMyReceived()
            .then((data) => { setFeedbacks(data || []); setLoading(false); })
            .catch((err) => {
                setError(err?.response?.data?.message || 'Nu am putut incarca mesajele');
                setLoading(false);
            });
    };

    useEffect(() => { load(); }, []);

    const handleMarkRead = async (id) => {
        try {
            await teacherFeedbackApi.markAsRead(id);
            setFeedbacks((prev) =>
                prev.map((f) => f.id === id ? { ...f, readByStudent: true } : f)
            );
        } catch (err) {
            notify.error('Nu am putut marca mesajul ca citit');
        }
    };

    const handleMarkAllRead = async () => {
        const unread = feedbacks.filter((f) => !f.readByStudent);
        if (unread.length === 0) return;
        setMarkingAllRead(true);
        try {
            await Promise.all(unread.map((f) => teacherFeedbackApi.markAsRead(f.id)));
            setFeedbacks((prev) => prev.map((f) => ({ ...f, readByStudent: true })));
            notify.success('Toate mesajele marcate ca citite');
        } catch {
            notify.error('Nu am putut marca toate mesajele');
        } finally {
            setMarkingAllRead(false);
        }
    };

    const unreadCount = feedbacks.filter((f) => !f.readByStudent).length;
    const displayed = tab === 'unread'
        ? feedbacks.filter((f) => !f.readByStudent)
        : feedbacks;

    return (
        <div user={user} title="Mesaje de la profesori">
            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <h1 className="text-h1 text-neutral-900">
                        Mesaje de la profesori
                    </h1>
                    <p className="text-body-lg text-neutral-600 mt-1">
                        Feedback-ul primit de la profesorii tai.
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="secondary"
                        icon={CheckCheck}
                        onClick={handleMarkAllRead}
                        loading={markingAllRead}
                    >
                        Marcheaza toate citite
                    </Button>
                )}
            </div>

            {!loading && feedbacks.length > 0 && (
                <div className="mb-6">
                    <Tabs
                        value={tab}
                        onChange={setTab}
                        variant="pills"
                        options={[
                            { value: 'all', label: 'Toate', badge: feedbacks.length },
                            {
                                value: 'unread',
                                label: 'Necitite',
                                badge: unreadCount > 0 ? unreadCount : undefined,
                            },
                        ]}
                    />
                </div>
            )}

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
                    action={<Button variant="primary" onClick={load}>Reincarca</Button>}
                />
            )}

            {!loading && !error && feedbacks.length === 0 && (
                <EmptyState
                    icon={Inbox}
                    variant="primary"
                    title="Niciun mesaj inca"
                    description="Cand un profesor iti trimite feedback, il vei vedea aici."
                />
            )}

            {!loading && !error && feedbacks.length > 0 && displayed.length === 0 && (
                <EmptyState
                    icon={CheckCheck}
                    variant="success"
                    title="Toate mesajele sunt citite!"
                    description="Nu ai mesaje necitite in acest moment."
                    size="sm"
                />
            )}

            {!loading && !error && displayed.length > 0 && (
                <div className="space-y-3">
                    {displayed.map((f, index) => (
                        <FeedbackCard
                            key={f.id}
                            feedback={f}
                            perspective="student"
                            onMarkRead={handleMarkRead}
                            index={index}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentFeedbackInboxPage;