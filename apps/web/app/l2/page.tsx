"use client";
import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Globe, TrendingUp, Activity, Network } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

interface RegistrationEvent {
  id: string;
  name: string;
  registrant: string;
  costEth: string;
  blockTime: string;
  chainId: number;
}

interface ChainMetrics {
  chainId: number;
  chainName: string;
  count: number;
  totalVolume: number;
  avgCost: number;
  uniqueUsers: number;
  growthRate: number;
  color: string;
}

interface TimeSeriesData {
  date: string;
  [key: string]: string | number;
}

export default function L2Page() {
  const [registrations, setRegistrations] = useState<RegistrationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (API_KEY) headers['x-api-key'] = API_KEY;

        // Calculate date range based on timeframe
        const now = new Date();
        let from: string | undefined;
        
        if (selectedTimeframe !== 'all') {
          const days = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : 90;
          from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
        }

        const url = new URL(`${API_BASE}/registrations`);
        url.searchParams.set('limit', '1000');
        if (from) url.searchParams.set('from', from);

        const response = await fetch(url.toString(), { headers });
        if (response.ok) {
          const data = await response.json();
          setRegistrations(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedTimeframe]);

  // Chain configuration with colors and info
  const chainConfig: Record<number, { name: string; color: string; explorer: string; type: string }> = {
    1: { name: 'Ethereum', color: '#627EEA', explorer: 'https://etherscan.io', type: 'Mainnet' },
    10: { name: 'Optimism', color: '#FF0420', explorer: 'https://optimistic.etherscan.io', type: 'L2 Optimistic' },
    137: { name: 'Polygon', color: '#8247E5', explorer: 'https://polygonscan.com', type: 'L2 Sidechain' },
    42161: { name: 'Arbitrum', color: '#28A0F0', explorer: 'https://arbiscan.io', type: 'L2 Optimistic' },
    8453: { name: 'Base', color: '#0052FF', explorer: 'https://basescan.org', type: 'L2 Optimistic' },
    59144: { name: 'Linea', color: '#000000', explorer: 'https://lineascan.build', type: 'L2 zkRollup' },
  };

  // Chain metrics calculation
  const chainMetrics = useMemo(() => {
    const metrics: Record<number, ChainMetrics> = {};
    const uniqueUsers: Record<number, Set<string>> = {};

    registrations.forEach(reg => {
      const chainId = reg.chainId;
      const cost = parseFloat(reg.costEth);
      
      if (!metrics[chainId]) {
        const config = chainConfig[chainId] || { name: `Chain ${chainId}`, color: '#9CA3AF', explorer: '', type: 'Unknown' };
        metrics[chainId] = {
          chainId,
          chainName: config.name,
          count: 0,
          totalVolume: 0,
          avgCost: 0,
          uniqueUsers: 0,
          growthRate: 0,
          color: config.color
        };
        uniqueUsers[chainId] = new Set();
      }

      metrics[chainId].count += 1;
      metrics[chainId].totalVolume += cost;
      uniqueUsers[chainId].add(reg.registrant);
    });

    // Calculate averages and unique users
    Object.keys(metrics).forEach(chainIdStr => {
      const chainId = parseInt(chainIdStr);
      metrics[chainId].avgCost = metrics[chainId].totalVolume / metrics[chainId].count;
      metrics[chainId].uniqueUsers = uniqueUsers[chainId].size;
    });

    return Object.values(metrics).sort((a, b) => b.count - a.count);
  }, [registrations]);

  // Time series data for cross-chain adoption
  const timeSeriesData = useMemo(() => {
    const dailyData: Record<string, Record<number, number>> = {};
    
    registrations.forEach(reg => {
      const date = new Date(reg.blockTime).toISOString().split('T')[0];
      if (!dailyData[date]) dailyData[date] = {};
      dailyData[date][reg.chainId] = (dailyData[date][reg.chainId] || 0) + 1;
    });

    return Object.entries(dailyData)
      .map(([date, chains]) => {
        const entry: TimeSeriesData = { date };
        Object.entries(chains).forEach(([chainId, count]) => {
          const chainName = chainConfig[parseInt(chainId)]?.name || `Chain ${chainId}`;
          entry[chainName] = count;
        });
        return entry;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [registrations]);

  // L2 vs L1 comparison
  const l1VsL2 = useMemo(() => {
    const l1Chains = [1]; // Ethereum mainnet
    const l2Chains = [10, 137, 42161, 8453, 59144]; // All L2s
    
    const l1Count = registrations.filter(reg => l1Chains.includes(reg.chainId)).length;
    const l2Count = registrations.filter(reg => l2Chains.includes(reg.chainId)).length;
    
    const l1Volume = registrations
      .filter(reg => l1Chains.includes(reg.chainId))
      .reduce((sum, reg) => sum + parseFloat(reg.costEth), 0);
    
    const l2Volume = registrations
      .filter(reg => l2Chains.includes(reg.chainId))
      .reduce((sum, reg) => sum + parseFloat(reg.costEth), 0);

    return [
      { type: 'L1 (Ethereum)', registrations: l1Count, volume: l1Volume, color: '#627EEA' },
      { type: 'L2 Networks', registrations: l2Count, volume: l2Volume, color: '#FF6B6B' }
    ];
  }, [registrations]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-600 dark:text-gray-400">Loading L2 analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
          L2 Adoption Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Cross-chain ENS adoption metrics and Layer 2 network comparison.
        </p>
      </div>

      {/* Timeframe Selector */}
      <div className="mb-8">
        <div className="flex gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTimeframe === timeframe
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {timeframe === 'all' ? 'All Time' : timeframe.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{chainMetrics.length}</div>
              <div className="text-blue-100">Active Chains</div>
              <div className="text-xs text-blue-200 mt-1">Multi-chain ENS</div>
            </div>
            <Globe className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {Math.round((l1VsL2[1]?.registrations / (l1VsL2[0]?.registrations + l1VsL2[1]?.registrations) || 0) * 100)}%
              </div>
              <div className="text-purple-100">L2 Adoption</div>
              <div className="text-xs text-purple-200 mt-1">vs L1 registrations</div>
            </div>
            <Network className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {chainMetrics.reduce((sum, chain) => sum + chain.totalVolume, 0).toFixed(2)}
              </div>
              <div className="text-green-100">Total Volume (ETH)</div>
              <div className="text-xs text-green-200 mt-1">All chains combined</div>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {chainMetrics.reduce((sum, chain) => sum + chain.uniqueUsers, 0)}
              </div>
              <div className="text-orange-100">Cross-Chain Users</div>
              <div className="text-xs text-orange-200 mt-1">Unique addresses</div>
            </div>
            <Activity className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* L1 vs L2 Comparison */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            L1 vs L2 Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={l1VsL2}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, registrations }) => `${type}: ${registrations}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="registrations"
              >
                {l1VsL2.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Chain Volume Comparison */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Volume by Chain (ETH)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chainMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="chainName" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value: number) => [`${value.toFixed(3)} ETH`, 'Volume']} />
              <Bar dataKey="totalVolume" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Time Series Chart */}
      <div className="mb-8">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Cross-Chain Registration Trends
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              {Object.entries(chainConfig).map(([chainId, config]) => (
                <Line
                  key={chainId}
                  type="monotone"
                  dataKey={config.name}
                  stroke={config.color}
                  strokeWidth={2}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chain Details Table */}
      <div className="mb-8">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Chain Performance Metrics
          </h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Chain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Registrations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Volume (ETH)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Avg Cost (ETH)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Unique Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Market Share
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {chainMetrics.map((chain) => {
                  const totalRegistrations = chainMetrics.reduce((sum, c) => sum + c.count, 0);
                  const marketShare = ((chain.count / totalRegistrations) * 100);
                  const config = chainConfig[chain.chainId];
                  
                  return (
                    <tr key={chain.chainId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: chain.color }}
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {chain.chainName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {config?.type || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {chain.count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                        {chain.totalVolume.toFixed(3)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {chain.avgCost.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {chain.uniqueUsers.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {marketShare.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
