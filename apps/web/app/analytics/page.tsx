"use client";
import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Crown, Activity } from 'lucide-react';

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

interface WhaleData {
  address: string;
  totalSpent: number;
  nameCount: number;
  avgCost: number;
  firstRegistration: string;
  recentActivity: string;
}

interface ChainData {
  chainId: number;
  chainName: string;
  count: number;
  totalVolume: number;
}

export default function AnalyticsPage() {
  const [registrations, setRegistrations] = useState<RegistrationEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (API_KEY) headers['x-api-key'] = API_KEY;

        const response = await fetch(`${API_BASE}/registrations?limit=1000`, { headers });
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
  }, []);

  // Whale Analysis (addresses that spent >1 ETH total)
  const whaleData = useMemo(() => {
    const addressStats: Record<string, WhaleData> = {};
    
    registrations.forEach(reg => {
      const cost = parseFloat(reg.costEth);
      if (!addressStats[reg.registrant]) {
        addressStats[reg.registrant] = {
          address: reg.registrant,
          totalSpent: 0,
          nameCount: 0,
          avgCost: 0,
          firstRegistration: reg.blockTime,
          recentActivity: reg.blockTime
        };
      }
      
      addressStats[reg.registrant].totalSpent += cost;
      addressStats[reg.registrant].nameCount += 1;
      
      if (new Date(reg.blockTime) < new Date(addressStats[reg.registrant].firstRegistration)) {
        addressStats[reg.registrant].firstRegistration = reg.blockTime;
      }
      if (new Date(reg.blockTime) > new Date(addressStats[reg.registrant].recentActivity)) {
        addressStats[reg.registrant].recentActivity = reg.blockTime;
      }
    });

    // Calculate average costs and filter whales (>1 ETH total)
    const whales = Object.values(addressStats)
      .map(addr => ({
        ...addr,
        avgCost: addr.totalSpent / addr.nameCount
      }))
      .filter(addr => addr.totalSpent >= 1)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 20);

    return whales;
  }, [registrations]);

  // Chain Distribution
  const chainData = useMemo(() => {
    const chains: Record<number, ChainData> = {};
    
    registrations.forEach(reg => {
      const cost = parseFloat(reg.costEth);
      if (!chains[reg.chainId]) {
        chains[reg.chainId] = {
          chainId: reg.chainId,
          chainName: getChainName(reg.chainId),
          count: 0,
          totalVolume: 0
        };
      }
      chains[reg.chainId].count += 1;
      chains[reg.chainId].totalVolume += cost;
    });

    return Object.values(chains).sort((a, b) => b.count - a.count);
  }, [registrations]);

  // Registration Cost Distribution
  const costDistribution = useMemo(() => {
    const buckets = [
      { range: '0-0.01', min: 0, max: 0.01, count: 0 },
      { range: '0.01-0.1', min: 0.01, max: 0.1, count: 0 },
      { range: '0.1-0.5', min: 0.1, max: 0.5, count: 0 },
      { range: '0.5-1', min: 0.5, max: 1, count: 0 },
      { range: '1-5', min: 1, max: 5, count: 0 },
      { range: '5+', min: 5, max: Infinity, count: 0 }
    ];

    registrations.forEach(reg => {
      const cost = parseFloat(reg.costEth);
      const bucket = buckets.find(b => cost >= b.min && cost < b.max);
      if (bucket) bucket.count += 1;
    });

    return buckets.filter(b => b.count > 0);
  }, [registrations]);

  // Time-based activity patterns
  const activityPatterns = useMemo(() => {
    const hourly: Record<number, number> = {};
    
    registrations.forEach(reg => {
      const hour = new Date(reg.blockTime).getUTCHours();
      hourly[hour] = (hourly[hour] || 0) + 1;
    });

    return Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      registrations: hourly[hour] || 0
    }));
  }, [registrations]);

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 1: return 'Ethereum';
      case 10: return 'Optimism';
      case 137: return 'Polygon';
      case 42161: return 'Arbitrum';
      default: return `Chain ${chainId}`;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#F97316'];

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-600 dark:text-gray-400">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
          Advanced Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Deep insights into ENS adoption patterns, whale activity, and cross-chain distribution.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{whaleData.length}</div>
              <div className="text-purple-100">Whale Addresses</div>
              <div className="text-xs text-purple-200 mt-1">&gt;1 ETH spent</div>
            </div>
            <Crown className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{chainData.length}</div>
              <div className="text-blue-100">Active Chains</div>
              <div className="text-xs text-blue-200 mt-1">Multi-chain adoption</div>
            </div>
            <Activity className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {registrations.reduce((sum, reg) => sum + parseFloat(reg.costEth), 0).toFixed(2)}
              </div>
              <div className="text-green-100">Total Volume (ETH)</div>
              <div className="text-xs text-green-200 mt-1">All registrations</div>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {new Set(registrations.map(r => r.registrant)).size}
              </div>
              <div className="text-orange-100">Unique Users</div>
              <div className="text-xs text-orange-200 mt-1">Total participants</div>
            </div>
            <Users className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Chain Distribution */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Chain Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chainData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ chainName, count }) => `${chainName}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {chainData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Distribution */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Registration Cost Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Patterns */}
      <div className="mb-8">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Registration Activity by Hour (UTC)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityPatterns}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="registrations" stroke="#06B6D4" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Whale Analysis Table */}
      <div className="mb-8">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Top Whale Addresses (≥1 ETH Total Spent)
          </h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Spent (ETH)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Names Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Avg Cost (ETH)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    First Registration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Recent Activity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {whaleData.map((whale, index) => (
                  <tr key={whale.address} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Crown className="w-4 h-4 text-yellow-500 mr-2" />
                        <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                          {formatAddress(whale.address)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                      {whale.totalSpent.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {whale.nameCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {whale.avgCost.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(whale.firstRegistration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(whale.recentActivity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
