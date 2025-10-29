import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Detections } from './pages/Detections';
import { DetectionDetail } from './pages/DetectionDetail';
import { VideoMonitor } from './pages/VideoMonitor';
import { Layout } from './components/layout/Layout.tsx';
import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { Settings } from './pages/Settings';
import { About } from './pages/About';
import { Home } from '@/pages/Home';
import { ViolationStats } from '@/pages/ViolationStats';
import { CCTVMonitor } from '@/pages/CCTVMonitor';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const { theme } = useAppStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/cctv-monitor" element={<CCTVMonitor />} />
            <Route path="/detections" element={<Detections />} />
            <Route path="/violation-stats" element={<ViolationStats />} />
            <Route path="/detections/:id" element={<DetectionDetail />} />
            <Route path="/video-monitor" element={<VideoMonitor />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;
