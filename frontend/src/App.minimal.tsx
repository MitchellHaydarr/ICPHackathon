import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Simplified placeholder components
const Dashboard = () => <div className="p-6">Dashboard Content</div>;
const Portfolio = () => <div className="p-6">Portfolio Content</div>;
const AIControl = () => <div className="p-6">AI Control Content</div>;

// Simplified Layout component
const Layout = ({ children, darkMode, toggleDarkMode }: { children: React.ReactNode; darkMode: boolean; toggleDarkMode: () => void }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="font-bold text-xl">Atlas ICP</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <a href="/" className="px-3 py-2 rounded-md text-sm font-medium">Dashboard</a>
                <a href="/portfolio" className="px-3 py-2 rounded-md text-sm font-medium">Portfolio</a>
                <a href="/ai-control" className="px-3 py-2 rounded-md text-sm font-medium">AI Control</a>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                Connect to IC
              </button>
              <button onClick={toggleDarkMode} className="ml-3 p-2">
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
            <div className="flex items-center sm:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <a href="/" className="block px-3 py-2 rounded-md text-base font-medium">Dashboard</a>
              <a href="/portfolio" className="block px-3 py-2 rounded-md text-base font-medium">Portfolio</a>
              <a href="/ai-control" className="block px-3 py-2 rounded-md text-base font-medium">AI Control</a>
              <div className="px-3 py-2">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                  Connect to IC
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};

// Simplified App component
function App() {
  const [darkMode, setDarkMode] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <Router>
      <div className={`app ${darkMode ? 'dark' : ''}`}>
        <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/ai-control" element={<AIControl />} />
          </Routes>
        </Layout>
      </div>
    </Router>
  );
}

export default App;
