import React, { useState, useEffect } from 'react';
import { getAICanister } from '../api/canister';
import type { Stats } from '../declarations/ai_canister/ai_canister.did';

interface AIControlProps {
  stats: Stats | null;
  loading: boolean;
}

const AIControl: React.FC<AIControlProps> = ({ stats, loading }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(true);
  const [threshold, setThreshold] = useState<string>(stats?.threshold_pct.toString() || '5');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (stats) {
      setThreshold(stats.threshold_pct.toString());
    }
  }, [stats]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLogsLoading(true);
        const aiCanister = getAICanister();
        const result = await aiCanister.get_logs();
        setLogs(result);
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLogsLoading(false);
      }
    };

    fetchLogs();
    // Refresh logs every 30 seconds
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePauseToggle = async () => {
    if (!stats) return;
    
    try {
      setIsSubmitting(true);
      setStatusMessage('Updating AI status...');
      
      const aiCanister = getAICanister();
      const newPausedState = !stats.paused;
      const result = await aiCanister.pause_ai(newPausedState);
      
      setStatusMessage(`AI ${newPausedState ? 'paused' : 'resumed'} successfully.`);
      
      // Trigger a manual tick to update price data if resuming
      if (!newPausedState) {
        await aiCanister.tick();
      }
      
      setTimeout(() => {
        setStatusMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error toggling AI status:', error);
      setStatusMessage('Error updating AI status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleThresholdUpdate = async () => {
    try {
      setIsSubmitting(true);
      setStatusMessage('Updating threshold...');
      
      // Validate the threshold value
      const thresholdValue = parseInt(threshold);
      if (isNaN(thresholdValue) || thresholdValue < 1 || thresholdValue > 50) {
        setStatusMessage('Invalid threshold value. Please use a number between 1 and 50.');
        return;
      }
      
      console.log(`Updating threshold to ${thresholdValue}`);
      
      // Make sure to handle BigInt conversion properly
      const aiCanister = getAICanister();
      const bigIntValue = BigInt(thresholdValue);
      const result = await aiCanister.set_strategy(bigIntValue);
      
      // Set success message
      setStatusMessage(`Threshold updated to ${thresholdValue}%.`);
      
      setTimeout(() => {
        setStatusMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error updating threshold:', error);
      setStatusMessage('Error updating threshold. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleManualTick = async () => {
    try {
      setIsSubmitting(true);
      setStatusMessage('Triggering manual price check...');
      
      const aiCanister = getAICanister();
      await aiCanister.tick();
      
      setStatusMessage('Manual price check completed successfully.');
      
      setTimeout(() => {
        setStatusMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error triggering manual tick:', error);
      setStatusMessage('Error checking price. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSendDemoBTC = async () => {
    try {
      setIsSubmitting(true);
      setStatusMessage('Sending demo BTC transaction...');
      
      const aiCanister = getAICanister();
      const txid = await aiCanister.send_demo_btc();
      
      setStatusMessage(`Demo BTC transaction sent. TxID: ${txid.length > 10 ? txid.substring(0, 10) + '...' : txid}`);
      
      setTimeout(() => {
        setStatusMessage('');
      }, 5000);
    } catch (error) {
      console.error('Error sending demo BTC:', error);
      setStatusMessage('Error sending demo BTC. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card-light dark:bg-card-dark shadow-md rounded-lg p-6">
          <h2 className="text-lg font-medium text-text-light dark:text-text-dark mb-4">AI Trading Controls</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Price Drop Threshold (%)
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="number"
                  name="threshold"
                  id="threshold"
                  disabled={isSubmitting}
                  className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  min="1"
                  max="50"
                  step="1"
                />
                <button
                  type="button"
                  onClick={handleThresholdUpdate}
                  disabled={isSubmitting || loading}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Update
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                The AI will execute trades when BTC price drops by this percentage from 24h ago
              </p>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handlePauseToggle}
                disabled={isSubmitting || loading}
                className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  stats?.paused 
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                } disabled:opacity-50`}
              >
                {stats?.paused ? 'Resume AI' : 'Pause AI'}
              </button>
              
              <button
                onClick={handleManualTick}
                disabled={isSubmitting || loading}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Check Price Now
              </button>
            </div>
            
            <div>
              <button
                onClick={handleSendDemoBTC}
                disabled={isSubmitting || loading}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
              >
                Send Demo BTC Transaction
              </button>
            </div>
            
            {statusMessage && (
              <div className="mt-3">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  {statusMessage}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-card-light dark:bg-card-dark shadow-md rounded-lg p-6">
          <h2 className="text-lg font-medium text-text-light dark:text-text-dark mb-4">AI Status</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <p className="text-lg font-medium text-text-light dark:text-text-dark">
                  {loading ? '...' : (stats?.paused ? 'Paused' : 'Active')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Current Threshold</p>
                <p className="text-lg font-medium text-text-light dark:text-text-dark">
                  {loading ? '...' : `${stats?.threshold_pct}%`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Current BTC Price</p>
                <p className="text-lg font-medium text-text-light dark:text-text-dark">
                  {loading ? '...' : `$${Number(stats?.btc_price || 0).toLocaleString()}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">BTC Address</p>
                <p className="text-sm font-mono truncate text-text-light dark:text-text-dark">
                  {loading ? '...' : (stats?.btc_address?.[0] || 'Not configured')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-card-light dark:bg-card-dark shadow-md rounded-lg p-6">
        <h2 className="text-lg font-medium text-text-light dark:text-text-dark mb-4">Activity Log</h2>
        
        <div className="mt-3 bg-gray-100 dark:bg-gray-800 rounded-md p-4 h-64 overflow-y-auto font-mono text-sm">
          {logsLoading ? (
            <p className="text-gray-500 dark:text-gray-400">Loading logs...</p>
          ) : logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index} className="mb-2 text-text-light dark:text-text-dark">
                <span className="text-gray-500 dark:text-gray-400">{`[${index + 1}] `}</span>
                {log}
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No logs available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIControl;
