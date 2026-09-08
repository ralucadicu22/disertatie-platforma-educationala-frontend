import Navbar from './Navbar';
import { useEffect, useState } from 'react';
import { teacherFeedbackApi } from '../../api/teacherFeedbackApi';
const MainLayout = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isElev = user?.role === 'ELEV';

    useEffect(() => {
        if (!isElev) return;
        teacherFeedbackApi.getUnreadCount()
            .then((data) => setUnreadCount(data?.count || 0))
            .catch(() => {});
    }, [isElev]);

    return (
        <div className="min-h-screen bg-neutral-50">
            <Navbar unreadCount={unreadCount} />
            <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
                {children}
            </main>
        </div>
    );
};

export default MainLayout;