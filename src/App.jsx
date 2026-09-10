import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import ModulesPage from './pages/ModulesPage';
import QuizzesPage from './pages/QuizzesPage';
import ExercisePage from './pages/ExercisePage';
import ProductDetailPage from './pages/ProductsDetailPage.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx';
import ExerciseEditor from './pages/ExerciseEditor.jsx';
import CreateExercisePage from './pages/CreateExercisePage.jsx';
import AdminReviewPage from './pages/AdminReviewPage.jsx';
import ExercisePlayer from './components/player/ExercisePlayer.jsx';
import ParentOverviewPage from './pages/ParentOverviewPage';
import ParentChildDetailPage from './pages/ParentChildDetailPage';
import ClassroomsListPage from './pages/ClassroomsListPage';
import ClassroomDetailPage from './pages/ClassroomDetailPage';
import QuizAssignmentPage from './pages/QuizAssignmentPage';
import ParentChildAdminPage from './pages/ParentChildAdminPage';
import TeacherFeedbackPage from './pages/TeacherFeedbackPage';
import StudentFeedbackInboxPage from './pages/StudentFeedbackInboxPage';
import ExerciseFeedbackSummaryPage from './pages/ExerciseFeedbackSummaryPage';
import MainLayout from './components/layout/MainLayout';
import { ToastProvider } from './design-system/toast.jsx';
import AdminContentPage from './pages/AdminContentPage.jsx';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(
        !!localStorage.getItem('token')
    );

    useEffect(() => {
        const handleStorageChange = () => {
            setIsAuthenticated(!!localStorage.getItem('token'));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const PrivateRoute = ({ children, withNav = true }) => {
        if (!isAuthenticated) return <Navigate to="/login" />;
        if (!withNav) return children;
        return <MainLayout>{children}</MainLayout>;
    };

    return (
        <>
            <ToastProvider />
            <Routes>
                <Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />}
                />

                <Route path="/" element={<PrivateRoute><ModulesPage /></PrivateRoute>} />
                <Route path="/product/:productId" element={<PrivateRoute><ProductDetailPage /></PrivateRoute>} />
                <Route path="/module/:moduleId" element={<PrivateRoute><QuizzesPage /></PrivateRoute>} />
                <Route path="/quiz/:quizId" element={<PrivateRoute><ExercisePage /></PrivateRoute>} />
                <Route path="/progres" element={<PrivateRoute><StudentDashboard /></PrivateRoute>} />
                <Route path="/profesor" element={<PrivateRoute><TeacherDashboard /></PrivateRoute>} />
                <Route path="/parinte" element={<PrivateRoute><ParentOverviewPage /></PrivateRoute>} />
                <Route path="/parinte/copil/:childId" element={<PrivateRoute><ParentChildDetailPage /></PrivateRoute>} />
                <Route path="/clase" element={<PrivateRoute><ClassroomsListPage /></PrivateRoute>} />
                <Route path="/clase/:id" element={<PrivateRoute><ClassroomDetailPage /></PrivateRoute>} />
                <Route path="/asignare-quizuri" element={<PrivateRoute><QuizAssignmentPage /></PrivateRoute>} />
                <Route path="/admin/parinti" element={<PrivateRoute><ParentChildAdminPage /></PrivateRoute>} />
                <Route path="/admin/review" element={<PrivateRoute><AdminReviewPage /></PrivateRoute>} />
                <Route path="/feedback-elevi" element={<PrivateRoute><TeacherFeedbackPage /></PrivateRoute>} />
                <Route path="/feedback-inbox" element={<PrivateRoute><StudentFeedbackInboxPage /></PrivateRoute>} />
                <Route path="/exercise/:exerciseId/feedback" element={<PrivateRoute><ExerciseFeedbackSummaryPage /></PrivateRoute>} />

                {/* Fără Navbar */}
                <Route
                    path="/editor/create"
                    element={<PrivateRoute withNav={false}><CreateExercisePage /></PrivateRoute>}
                />
                <Route
                    path="/editor/new"
                    element={<PrivateRoute withNav={false}><ExerciseEditor mode="new" /></PrivateRoute>}
                />
                <Route
                    path="/editor/:exerciseId"
                    element={<PrivateRoute withNav={false}><ExerciseEditor mode="existing" /></PrivateRoute>}
                />
                <Route path="/exercise/:exerciseId/play" element={<ExercisePlayer />} />
                <Route path="/admin/content" element={<PrivateRoute><AdminContentPage /></PrivateRoute>} />
            </Routes>
        </>
    );
}

export default App;