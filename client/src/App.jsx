import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LogWorkout from './pages/LogWorkout';
import Exercises from './pages/Exercises';
import Routines from './pages/Routines';
import Goals from './pages/Goals';
import History from './pages/History';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/log" element={<LogWorkout />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/routines" element={<Routines />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
