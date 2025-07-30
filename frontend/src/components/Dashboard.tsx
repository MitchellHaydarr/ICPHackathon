import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPortfolio, formatICP } from '../services/canister';
import { Principal } from '@dfinity/principal';
import type { Stats } from '../declarations/ai_canister/ai_canister.did';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data for chart - in production this would come from canister history
const generateMockPriceData = (currentPrice: number) => {
  const data = [];
  const now = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    
    // Generate price with some variance
    const variance = Math.random() * 0.1 - 0.05; // -5% to +5%
    const price = currentPrice * (1 - (i / 100)) * (1 + variance);
    
    data.push({
      date: date.toLocaleDateString(),
      btc: Math.round(price),
    });
  }
  return data;
};

interface DashboardProps {
  stats: Stats | null;
  loading: boolean;
  isConnected: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, loading, isConnected }) => {
  const [portfolio, setPortfolio] = useState<string>('0');
  const [portfolioLoading, setPortfolioLoading] = useState<boolean>(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const getUserPortfolio = async () => {
      if (!isConnected) {
        setPortfolioLoading(false);
        return;
      }
      
      try {
        setPortfolioLoading(true);
        const result = await fetchPortfolio();
        
        if (result.success && result.data) {
          setPortfolio(formatICP(result.data.totalValue));
        } else {
          console.error('Error fetching portfolio:', result.error);
        }
      } catch (error) {
        console.error('Error fetching portfolio:', error);
      } finally {
        setPortfolioLoading(false);
      }
    };

    getUserPortfolio();
  }, [isConnected]);

  useEffect(() => {
    if (stats && stats.btc_price > 0) {
      setChartData(generateMockPriceData(Number(stats.btc_price)));
    }
  }, [stats]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Your Portfolio</h2>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {portfolioLoading ? 
                <div className="animate-pulse h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div> : 
                isConnected ? `${portfolio} ICP` : 'Not connected'}
            </span>
          </div>
          {isConnected ? (
            <Link to="/portfolio"
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded transition-colors flex items-center justify-center"
            >
              <span>Manage Portfolio</span>
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          ) : (
            <button
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded transition-colors flex items-center justify-center opacity-50 cursor-not-allowed"
              disabled
            >
              Connect to Manage Portfolio
            </button>
          )}
        </div>
        
        <div className="bg-card-light dark:bg-card-dark shadow-md rounded-lg p-6">
          <h2 className="text-lg font-medium text-text-light dark:text-text-dark mb-4">BTC Price</h2>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-primary dark:text-primary-light">
              {loading ? '...' : `$${Number(stats?.btc_price || 0).toLocaleString()}`}
            </span>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Threshold</span>
              <span>{loading ? '...' : `${stats?.threshold_pct || 0}%`}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span>AI Trading Status</span>
              <span className={stats?.paused ? 'text-red-500' : 'text-green-500'}>
                {loading ? '...' : (stats?.paused ? 'Paused' : 'Active')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-card-light dark:bg-card-dark shadow-md rounded-lg p-6">
          <h2 className="text-lg font-medium text-text-light dark:text-text-dark mb-4">BTC Wallet</h2>
          <div className="flex items-baseline">
            <span className="text-md font-mono text-primary dark:text-primary-light break-all">
              {loading ? '...' : (stats?.btc_address?.[0] || 'Not configured')}
            </span>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Last Transaction</span>
              <span className="font-mono">{loading ? '...' : (stats?.last_txid?.[0] ? stats.last_txid[0].substring(0, 10) + '...' : 'None')}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-card-light dark:bg-card-dark shadow-md rounded-lg p-6">
        <h2 className="text-lg font-medium text-text-light dark:text-text-dark mb-6">BTC Price History</h2>
        <div className="h-80">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  tick={{ fill: '#9CA3AF' }}
                  domain={['dataMin - 1000', 'dataMax + 1000']}
                />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="btc"
                  name="BTC Price (USD)"
                  stroke="#4F46E5"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Loading chart data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
