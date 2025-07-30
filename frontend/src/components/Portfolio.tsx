import React, { useState, useEffect } from 'react';
import { fetchPortfolio, depositFunds, withdrawFunds, formatICP, PortfolioData, PortfolioAsset } from '../services/canister';
import { Principal } from '@dfinity/principal';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface PortfolioProps {
  principal?: string;
}

const Portfolio: React.FC<PortfolioProps> = ({ principal }) => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [depositToken, setDepositToken] = useState<string>('ICP');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawToken, setWithdrawToken] = useState<string>('ICP');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (!principal) return;
    
    loadPortfolioData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadPortfolioData, 30000);
    return () => clearInterval(interval);
  }, [principal]);

  // Update chart when portfolio data changes
  useEffect(() => {
    if (!portfolioData || !portfolioData.assets.length) return;
    
    const chartLabels = portfolioData.assets.map(asset => asset.token);
    const chartValues = portfolioData.assets.map(asset => Number(formatICP(asset.value)));
    
    // Generate colors for each token
    const backgroundColors = [
      'rgba(255, 99, 132, 0.8)',   // Bitcoin (pink)
      'rgba(54, 162, 235, 0.8)',   // Ethereum (blue)
      'rgba(255, 206, 86, 0.8)',   // Solana (yellow)
      'rgba(75, 192, 192, 0.8)',   // Polkadot (teal)
      'rgba(153, 102, 255, 0.8)',  // Internet Computer (purple)
    ];
    
    const chartDataConfig = {
      labels: chartLabels,
      datasets: [
        {
          data: chartValues,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color.replace('0.8', '1')),
          borderWidth: 1,
        },
      ],
    };
    
    setChartData(chartDataConfig);
  }, [portfolioData]);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      setStatusMessage('');
      setStatusType('');
      
      const response = await fetchPortfolio(principal);
      
      if (response.success && response.data) {
        setPortfolioData(response.data);
      } else if (response.error) {
        setStatusMessage(response.error);
        setStatusType('error');
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      setStatusMessage('Failed to load portfolio data. Please try again.');
      setStatusType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setStatusMessage('Please enter a valid amount');
      setStatusType('error');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setStatusMessage('Processing deposit...');
      setStatusType('info');
      
      const result = await depositFunds(depositToken, parseFloat(depositAmount));
      
      if (result.success) {
        setStatusMessage(`Successfully deposited ${depositAmount} ${depositToken}!`);
        setStatusType('success');
        setDepositAmount('');
        loadPortfolioData(); // Refresh data
      } else {
        setStatusMessage(`Error: ${result.error || 'Failed to deposit funds'}`);
        setStatusType('error');
      }
    } catch (error: any) {
      console.error('Error making deposit:', error);
      setStatusMessage(`Error: ${error.message || 'Failed to deposit funds'}`);
      setStatusType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setStatusMessage('Please enter a valid amount');
      setStatusType('error');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setStatusMessage('Processing withdrawal...');
      setStatusType('info');
      
      const result = await withdrawFunds(withdrawToken, parseFloat(withdrawAmount));
      
      if (result.success) {
        setStatusMessage(`Successfully withdrew ${withdrawAmount} ${withdrawToken}!`);
        setStatusType('success');
        setWithdrawAmount('');
        loadPortfolioData(); // Refresh data
      } else {
        setStatusMessage(`Error: ${result.error || 'Failed to withdraw funds'}`);
        setStatusType('error');
      }
      
    } catch (error: any) {
      console.error('Error making withdrawal:', error);
      setStatusMessage(`Error: ${error.message || 'Failed to withdraw funds'}`);
      setStatusType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPortfolioValue = portfolioData ? Number(formatICP(portfolioData.totalValue)) : 0;

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Portfolio</h2>
        
        {statusMessage && (
          <div className={`border-l-4 p-4 mb-6 ${
            statusType === 'success' 
              ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900 dark:border-green-500 dark:text-green-300' 
              : statusType === 'error' 
              ? 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900 dark:border-red-500 dark:text-red-300' 
              : 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900 dark:border-blue-500 dark:text-blue-300'
          }`} role="alert">
            <p>{statusMessage}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading portfolio data...
            </div>
          </div>
        ) : !principal ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">Please connect to Internet Computer to view your portfolio</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Current Balance</h3>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {totalPortfolioValue.toFixed(2)} ICP
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Principal ID: {principal.substring(0, 5)}...{principal.substring(principal.length - 3)}
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-4 mb-6">
                {/* Deposit Form */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Deposit Funds</h4>
                  <div className="flex flex-col sm:flex-row sm:items-end gap-2 mb-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                      <input
                        type="number"
                        placeholder="Amount"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="sm:w-1/3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Token</label>
                      <select
                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800"
                        value={depositToken}
                        onChange={(e) => setDepositToken(e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="ICP">ICP</option>
                        <option value="BTC">BTC</option>
                        <option value="ETH">ETH</option>
                      </select>
                    </div>
                    <button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors sm:w-auto w-full"
                      onClick={handleDeposit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Processing...' : 'Deposit'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">This is a demo - no real funds will be transferred</p>
                </div>
                
                {/* Withdraw Form */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Withdraw Funds</h4>
                  <div className="flex flex-col sm:flex-row sm:items-end gap-2 mb-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                      <input
                        type="number"
                        placeholder="Amount"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="sm:w-1/3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Token</label>
                      <select
                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800"
                        value={withdrawToken}
                        onChange={(e) => setWithdrawToken(e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="ICP">ICP</option>
                        <option value="BTC">BTC</option>
                        <option value="ETH">ETH</option>
                      </select>
                    </div>
                    <button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors sm:w-auto w-full"
                      onClick={handleWithdraw}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Processing...' : 'Withdraw'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Portfolio Distribution</h3>
              <div className="h-64 flex items-center justify-center">
                {chartData && portfolioData && portfolioData.assets.length > 0 ? (
                  <Pie 
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            color: document.documentElement.classList.contains('dark') ? 'white' : '#111827'
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context: any) {
                              const label = context.label || '';
                              const value = Number(context.raw) || 0;
                              
                              // Calculate total manually as the Chart.js types don't include 'total' property
                              const dataset = context.chart.data.datasets[0];
                              const total = dataset.data.reduce((sum: number, val: number) => sum + Number(val), 0);
                              
                              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                              return `${label}: ${value.toFixed(2)} (${percentage}%)`;
                            }
                          }
                        }
                      },
                    }}
                  />
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <p>No assets found in portfolio.</p>
                    <p className="text-sm mt-1">Deposit funds to see your portfolio distribution</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {portfolioData && portfolioData.assets.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Assets</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Token</th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Value (USD)</th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">% of Portfolio</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {portfolioData.assets.map((asset, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {asset.token}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                      {formatICP(asset.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                      ${formatICP(asset.value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                      {totalPortfolioValue > 0 ? ((Number(formatICP(asset.value)) / totalPortfolioValue) * 100).toFixed(1) : '0.0'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
