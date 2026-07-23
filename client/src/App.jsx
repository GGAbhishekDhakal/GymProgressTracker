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
import AdminAssign from './pages/AdminAssign';
import OrgDashboard from './pages/OrgDashboard';
import Profile from './pages/Profile';
import KYC from './pages/KYC';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/" element={<Layout><ProtectedRoute><Dashboard /></ProtectedRoute></Layout>} />
              <Route path="/log" element={<Layout><ProtectedRoute roles={['client', 'ghost']}><LogWorkout /></ProtectedRoute></Layout>} />
              <Route path="/exercises" element={<Layout><ProtectedRoute><Exercises /></ProtectedRoute></Layout>} />
              <Route path="/routines" element={<Layout><ProtectedRoute roles={['client', 'admin', 'ghost']}><Routines /></ProtectedRoute></Layout>} />
              <Route path="/goals" element={<Layout><ProtectedRoute roles={['client', 'ghost']}><Goals /></ProtectedRoute></Layout>} />
              <Route path="/history" element={<Layout><ProtectedRoute><History /></ProtectedRoute></Layout>} />
              <Route path="/admin" element={<Layout><ProtectedRoute roles={['superadmin', 'admin']}><Admin /></ProtectedRoute></Layout>} />
              <Route path="/assign" element={<Layout><ProtectedRoute roles={['superadmin', 'admin']}><AdminAssign /></ProtectedRoute></Layout>} />
              <Route path="/org" element={<Layout><ProtectedRoute roles={['superadmin']}><OrgDashboard /></ProtectedRoute></Layout>} />
              <Route path="/clients" element={<Layout><ProtectedRoute roles={['superadmin']}><Admin /></ProtectedRoute></Layout>} />
              <Route path="/profile" element={<Layout><ProtectedRoute><Profile /></ProtectedRoute></Layout>} />
              <Route path="/kyc" element={<Layout><ProtectedRoute><KYC /></ProtectedRoute></Layout>} />
            </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
