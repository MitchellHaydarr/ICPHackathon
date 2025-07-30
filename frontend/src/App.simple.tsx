import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AIControl from './components/AIControl';
import Portfolio from './components/Portfolio';
import Layout from './components/Layout';
import { Stats } from './declarations/ai_canister/ai_canister.did';

// Define simple mock interfaces
interface AuthState {
  isAuthenticated: boolean;
  identity: any | null;
  principal: any | null;
}

function App() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    identity: null,
    principal: null
  });
  const [loginInProgress, setLoginInProgress] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Simplified connect handling
  const handleConnect = async () => {
    try {
      setLoginInProgress(true);
      
      // Toggle authentication state for demo purposes
      setTimeout(() => {
        setAuthState({
          isAuthenticated: !authState.isAuthenticated,
          identity: authState.isAuthenticated ? null : { toString: () => 'MockIdentity' },
          principal: authState.isAuthenticated ? null : { toString: () => '2vxsx-fae' }
        });
        setLoginInProgress(false);
      }, 1000);
      
    } catch (err: any) {
      console.error('Authentication action failed:', err);
      setError(`Authentication failed: ${err.message || 'Unknown error'}`);
      setLoginInProgress(false);
    }
  };

  // Simple protected route component
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!authState.isAuthenticated && !loading) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  };

  return (
    <Router>
      <div className={`app ${darkMode ? 'dark' : ''}`}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <Layout 
            darkMode={darkMode} 
            toggleDarkMode={toggleDarkMode} 
            isConnected={authState.isAuthenticated}
            isConnecting={loginInProgress}
            onConnect={handleConnect}
            principal={authState.principal ? authState.principal.toString() : undefined}
            error={error}
          >
            {error && !loading && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
                <button onClick={() => setError(null)} className="absolute top-0 right-0 px-4 py-3">
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            <Routes>
              <Route path="/" element={<Dashboard stats={stats} loading={statsLoading} isConnected={authState.isAuthenticated} />} />
              <Route 
                path="/portfolio" 
                element={
                  <ProtectedRoute>
                    <Portfolio />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/ai-control" 
                element={
                  <ProtectedRoute>
                    <AIControl stats={stats} loading={statsLoading} />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </Layout>
        </div>
      </div>
    </Router>
  );
}

export default App;
