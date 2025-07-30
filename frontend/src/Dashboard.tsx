import React, { useState, useEffect } from 'react';
import { Principal } from '@dfinity/principal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getPortfolio, e8sToIcp, initializeApi } from './api';

// Get the canister ID from environment variables
const STORE_CANISTER_ID = import.meta.env.VITE_STORE_CANISTER_ID || 'rrkah-fqaaa-aaaaa-aaaaq-cai'; // Default local canister ID

// Fixed ICP color
const ICP_COLOR = '#6B21A8'; // Purple for ICP
const EMPTY_COLOR = '#E2E8F0'; // Light gray for empty balance

const Dashboard: React.FC = () => {
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize API with the store canister ID
        await initializeApi(STORE_CANISTER_ID);
        
        // For demo purposes, use a test principal
        // In a real app, you would get this from authentication
        const testPrincipal = Principal.fromText('2vxsx-fae');
        setPrincipal(testPrincipal);
        
        // Fetch initial balance
        const initialBalance = await getPortfolio(testPrincipal);
        setBalance(initialBalance);
      } catch (err) {
        setError(`Failed to initialize: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    // Skip if no principal is set
    if (!principal) return;

    // Set up periodic fetching every 5 seconds
    const intervalId = setInterval(async () => {
      try {
        const updatedBalance = await getPortfolio(principal);
        setBalance(updatedBalance);
      } catch (err) {
        console.error('Failed to fetch balance:', err);
        // Don't update error state here to avoid constant UI changes
      }
    }, 5000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [principal]);

  // Prepare data for pie chart
  const prepareChartData = () => {
    const icpBalance = e8sToIcp(balance);
    
    // If balance is 0, show empty state
    if (icpBalance === 0) {
      return [
        { name: 'No Balance', value: 1 }
      ];
    }
    
    return [
      { name: 'ICP', value: icpBalance }
    ];
  };

  const chartData = prepareChartData();

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-gray-500">Loading portfolio data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Portfolio Balance</h2>
        <div className="text-right">
          <p className="text-sm text-gray-500">Current Balance</p>
          <p className="text-2xl font-bold text-gray-800">{e8sToIcp(balance).toFixed(8)} ICP</p>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.name === 'No Balance' ? EMPTY_COLOR : ICP_COLOR} 
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${Number(value).toFixed(8)} ICP`, 'Amount']} 
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>Principal ID: {principal?.toString() || 'Not connected'}</p>
        <p className="mt-1">Data refreshes every 5 seconds</p>
      </div>
    </div>
  );
};

export default Dashboard;
