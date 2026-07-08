import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import LogWorkout from './pages/LogWorkout';
import Exercises from './pages/Exercises';
import Routines from './pages/Routines';
import Goals from './pages/Goals';
import History from './pages/History';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import Admin from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/log" element={<ProtectedRoute><LogWorkout /></ProtectedRoute>} />
              <Route path="/exercises" element={<ProtectedRoute><Exercises /></ProtectedRoute>} />
              <Route path="/routines" element={<ProtectedRoute><Routines /></ProtectedRoute>} />
              <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute roles={['superadmin', 'admin']}><Admin /></ProtectedRoute>} />
            </Routes>
          </Layout>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
