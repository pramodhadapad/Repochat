import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import RepoChat from './pages/RepoChat';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import CollabLoader from './pages/CollabLoader';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import useStore from './store/useStore';
import api, { authService } from './services/api';
import { ThemeProvider } from './components/common/ThemeProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';
import GuestRoute from './components/auth/GuestRoute';
import DocumentationView from './components/features/DocumentationView';
import SnippetsView from './components/features/SnippetsView';
import { useParams } from 'react-router-dom';

function App() {
  const { user, token, setToken, setUser, logout } = useStore();
  const [isReady, setIsReady] = useState(false);

  // Sync token from URL (OAuth callback) + handle browser back navigation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    
    // Only apply NEW token if we don't already have one
    // This prevents account switching without logout
    if (urlToken) {
      if (!token) {
        console.log('[AUTH] Syncing token from OAuth callback...');
        setToken(urlToken);
      } else {
        console.warn('[AUTH] Attempted to sync new token while already logged in. Ignoring.');
      }
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Root-level protection: If navigating to guest routes while authenticated, 
    // GuestRoute component handles the redirect. We just ensure state is ready.
    if (token && (window.location.pathname === '/' || window.location.pathname === '/login')) {
        console.log('[AUTH] Authenticated user on guest route. Redirecting...');
        window.history.replaceState(null, '', '/dashboard');
    }

    setIsReady(true);
  }, [token, setToken]);

  // Fetch user profile when token is available
  useEffect(() => {
    const fetchUser = async () => {
      if (token && !user) {
        try {
          const res = await authService.getProfile();
          setUser(res.data.user);
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
          
          // If it's a 401, try a refresh once
          if (err.response?.status === 401) {
            try {
              const refreshRes = await api.post('/auth/refresh');
              if (refreshRes.data.jwt) {
                setToken(refreshRes.data.jwt);
                const retryRes = await authService.getProfile();
                setUser(retryRes.data.user);
                return;
              }
            } catch (refreshErr) {
              console.error('Token refresh failed:', refreshErr);
            }
          }
          
          // For 403, network errors, or failed refresh: logout to clear token and return home
          logout();
        }
      }
    };
    fetchUser();
  }, [token, user, setToken, setUser, logout]);

  if (!isReady) return null;

  return (
    <ThemeProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route 
            path="/" 
            element={
              <GuestRoute>
                <Landing />
              </GuestRoute>
            } 
          />
          <Route 
            path="/login" 
            element={
              <GuestRoute>
                <Landing />
              </GuestRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/repo/:repoId" 
            element={
              <ProtectedRoute>
                <RepoChat />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/collab/:shareId" 
            element={
              <ProtectedRoute>
                <CollabLoader />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/repo/:repoId/docs" 
            element={
              <ProtectedRoute>
                <DocumentationWrapper />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/repo/:repoId/snippets" 
            element={
              <ProtectedRoute>
                <SnippetsWrapper />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

// Wrappers to extract repoId from params and pass to components
const DocumentationWrapper = () => {
  const { repoId } = useParams();
  return <DocumentationView repoId={repoId} />;
};

const SnippetsWrapper = () => {
  const { repoId } = useParams();
  return <SnippetsView repoId={repoId} />;
};

export default App;
