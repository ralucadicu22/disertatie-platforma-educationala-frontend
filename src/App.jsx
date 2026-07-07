import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import ModulesPage from './pages/ModulesPage'
import QuizzesPage from './pages/QuizzesPage'
import ExercisePage from './pages/ExercisePage'
import ProductDetailPage from "./pages/ProductsDetailPage.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";
import ExerciseEditor from "./pages/ExerciseEditor.jsx";
import CreateExercisePage from "./pages/CreateExercisePage.jsx";

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(
        !!localStorage.getItem('token')
    )

    useEffect(() => {
        const handleStorageChange = () => {
            setIsAuthenticated(!!localStorage.getItem('token'))
        }
        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    const PrivateRoute = ({ children }) => {
        return isAuthenticated ? children : <Navigate to="/login" />
    }

    return (
        <Routes>
            <Route
                path="/login"
                element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />}
            />
            <Route
                path="/"
                element={<PrivateRoute><ModulesPage /></PrivateRoute>}
            />
            <Route
                path="/product/:productId"
                element={<PrivateRoute><ProductDetailPage /></PrivateRoute>}
            />
            <Route
                path="/module/:moduleId"
                element={<PrivateRoute><QuizzesPage /></PrivateRoute>}
            />
            <Route
                path="/quiz/:quizId"
                element={<PrivateRoute><ExercisePage /></PrivateRoute>}
            />
            <Route
                path="/progres"
                element={<PrivateRoute><StudentDashboard /></PrivateRoute>}
            />
            <Route
                path="/profesor"
                element={<PrivateRoute><TeacherDashboard /></PrivateRoute>}
            />
            <Route
                path="/editor/create"
                element={
                    <PrivateRoute>
                        <CreateExercisePage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/editor/new"
                element={
                    <PrivateRoute>
                        <ExerciseEditor mode="new" />
                    </PrivateRoute>
                }
            />
            <Route
                path="/editor/:exerciseId"
                element={
                    <PrivateRoute>
                        <ExerciseEditor mode="existing" />
                    </PrivateRoute>
                }
            />
        </Routes>
    )
}

export default App