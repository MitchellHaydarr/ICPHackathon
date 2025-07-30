import React, { type ReactNode } from 'react';
import Navbar from './Navbar';
import type { Stats } from '../declarations/ai_canister/ai_canister.did';

interface LayoutProps {
  children: ReactNode;
  darkMode: boolean;
  toggleDarkMode: () => void;
  stats?: Stats | null;
  loading?: boolean;
  isConnected?: boolean;
  isConnecting?: boolean;
  onConnect?: () => void;
  principal?: string;
  error?: string | null;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  darkMode, 
  toggleDarkMode, 
  stats, 
  loading = false,
  isConnected = false,
  isConnecting = false,
  onConnect,
  principal,
  error
 }) => {
  return (
    <>
      <Navbar 
        darkMode={darkMode} 
        toggleDarkMode={toggleDarkMode} 
        isConnected={isConnected} 
        isConnecting={isConnecting}
        onConnect={onConnect} 
        principal={principal}
      />
      
      {/* BTC Price Banner */}
      {stats && !loading && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="flex items-center text-sm">
              <span className="font-medium mr-2">Current BTC Price:</span>
              <span className="font-bold">${Number(stats.btc_price).toLocaleString()}</span>
            </div>
            {stats.paused && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                AI Trading Paused
              </span>
            )}
          </div>
        </div>
      )}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      
      <footer className="bg-card-light dark:bg-card-dark border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            © {new Date().getFullYear()} Atlas - Built on Internet Computer Protocol
          </p>
        </div>
      </footer>
    </>
  );
};

export default Layout;
