import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AIControl from './components/AIControl';
import Portfolio from './components/Portfolio';
import config from './config';
import Layout from './components/Layout';
import { ChakraProvider } from '@chakra-ui/react';
import { AnimatePresence } from 'framer-motion';
import type { Stats } from './declarations/ai_canister/ai_canister.did';
import type { AuthState } from './services/auth';
import { authService } from './services/auth';
import { mockAuthService } from './services/mockAuth';
import { callCanister, getAICanister } from './services/canister';
import ToastContainer, { toast } from './components/ToastContainer';
import theme from './theme';

function App() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [principal, setPrincipal] = useState('');
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    identity: null,
    principal: null
  });
  const [loginInProgress, setLoginInProgress] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get the appropriate auth service based on config
  const activeAuthService = config.useMockWallet ? mockAuthService : authService;

  // Initialize authentication on app load
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        // Use either real or mock auth service based on config
        const state = await activeAuthService.initialize();
        setAuthState(state);

        if (state.isAuthenticated && state.principal) {
          setIsConnected(true);
          setPrincipal(state.principal.toString());
          console.log('Already authenticated, principal:', state.principal.toString());
          console.log('Using mock wallet:', config.useMockWallet ? 'Yes' : 'No');
        }
      } catch (err: any) {
        console.error('Authentication initialization failed:', err);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, []);

  // Define fetchStats outside of useEffect so it can be referenced by multiple hooks
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      setError(null);
      
      // Get the AI canister (real or mock based on config)
      const aiCanister = getAICanister();
      
      // Call get_stats on the canister
      console.log('Calling get_stats on', config.useMockWallet ? 'mock' : 'real', 'canister');
      const statsData = await aiCanister.get_stats();
      console.log('Stats received:', statsData);
      
      setStats(statsData);
      setStatsLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to fetch AI stats');
      setStatsLoading(false);
    }
  };

  // Initial fetch of AI stats when authenticated
  useEffect(() => {
    if (authState.isAuthenticated) {
      fetchStats();
    } else {
      // Clear stats when logged out
      setStats(null);
    }
  }, [authState.isAuthenticated]); // Refetch when identity/auth state changes

  // Set up periodic refresh of stats
  useEffect(() => {
    if (authState.isAuthenticated) {
      const intervalId = setInterval(fetchStats, 30000); // Update stats every 30 seconds
      return () => clearInterval(intervalId); // Clean up on unmount
    }
  }, [authState.isAuthenticated]);

  // Handle login
  const connect = async () => {
    try {
      setLoginInProgress(true);
      // Use either real or mock auth service based on config
      const state = await activeAuthService.login();
      setAuthState(state);
      
      if (state.isAuthenticated && state.principal) {
        setIsConnected(true);
        setPrincipal(state.principal.toString());
        console.log('Connected to wallet, principal:', state.principal.toString());
        console.log('Using mock wallet:', config.useMockWallet ? 'Yes' : 'No');
        toast.success(
          'Connected',
          config.useMockWallet ? 'Using mock wallet' : 'Internet Identity connected'
        );
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      toast.error(
        'Connection Failed',
        'Failed to connect to wallet'
      );
      setError('Login failed');
    } finally {
      setLoginInProgress(false);
    }
  };
  
  // Handle logout
  const disconnect = async () => {
    try {
      // Use either real or mock auth service based on config
      await activeAuthService.logout();
      setAuthState({
        isAuthenticated: false,
        identity: null,
        principal: null
      });
      setIsConnected(false);
      setPrincipal('');
      console.log('Disconnected from wallet');
      toast.info(
        'Disconnected',
        'Wallet disconnected'
      );
    } catch (err: any) {
      console.error('Logout failed:', err);
      setError('Logout failed');
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Improved connect/disconnect handling
  const handleConnect = async () => {
    try {
      if (authState.isAuthenticated) {
        // If already connected, disconnect
        setLoginInProgress(true);
        await authService.logout();
        setAuthState({
          isAuthenticated: false,
          identity: null,
          principal: null
        });
        console.log('User logged out');
      } else {
        // Start login process
        setLoginInProgress(true);
        setError(null);
        const newAuthState = await authService.login();
        setAuthState(newAuthState);
        console.log('User authenticated with Internet Computer');
      }
    } catch (err: any) {
      console.error('Authentication action failed:', err);
      setError(`Authentication failed: ${err.message || 'Unknown error'}`);
    } finally {
      setLoginInProgress(false);
    }
  };

  // Create protected route component
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!authState.isAuthenticated && !loading) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  };

  return (
    <ChakraProvider theme={theme} resetCSS>
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
                  <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
                    <button onClick={() => setError(null)}>
                      <span className="sr-only">Dismiss</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                </div>
              )}
              
              <Routes>
                <Route path="/" element={<Dashboard stats={stats} loading={statsLoading} isConnected={authState.isAuthenticated} />} />
                <Route path="/portfolio" element={
                  <ProtectedRoute>
                    <Portfolio principal={authState.principal ? authState.principal.toString() : undefined} />
                  </ProtectedRoute>
                } />
                <Route path="/ai-control" element={
                  <ProtectedRoute>
                    <AIControl stats={stats} loading={statsLoading} />
                  </ProtectedRoute>
                } />
              </Routes>
            </Layout>
          </div>
        </div>
      </Router>
    </ChakraProvider>
  );
}

export default App;
