"use client";
import { useState, useEffect } from 'react';
import { Search, Calendar, Clock, User, ExternalLink } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

interface NameDetails {
  name: string;
  registrant: string;
  registrationDate: string;
  expirationDate: string;
  resolver: string;
  registrationCost: string;
  chainId: number;
}

interface RegistrationEvent {
  id: string;
  name: string;
  registrant: string;
  costEth: string;
  blockTime: string;
  txHash: string;
  chainId: number;
}

interface RenewalEvent {
  id: string;
  name: string;
  costEth: string;
  blockTime: string;
  txHash: string;
  chainId: number;
}

export default function NamesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedName, setSelectedName] = useState<NameDetails | null>(null);
  const [registrationHistory, setRegistrationHistory] = useState<RegistrationEvent[]>([]);
  const [renewalHistory, setRenewalHistory] = useState<RenewalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchName = async (name: string) => {
    if (!name.trim()) return;
    
    setLoading(true);
    setError('');
    setSelectedName(null);
    setRegistrationHistory([]);
    setRenewalHistory([]);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (API_KEY) headers['x-api-key'] = API_KEY;

      // Search for the name in our database
      const [regResponse, renewResponse] = await Promise.all([
        fetch(`${API_BASE}/registrations?name=${encodeURIComponent(name)}`, { headers }),
        fetch(`${API_BASE}/renewals?name=${encodeURIComponent(name)}`, { headers })
      ]);

      if (!regResponse.ok || !renewResponse.ok) {
        throw new Error('Failed to fetch name data');
      }

      const regData = await regResponse.json();
      const renewData = await renewResponse.json();

      // Get registration history
      const registrations = regData.data || [];
      setRegistrationHistory(registrations);

      // Get renewal history
      const renewals = renewData.data || [];
      setRenewalHistory(renewals);

      // If we found registration data, create name details
      if (registrations.length > 0) {
        const latestReg = registrations[0];
        setSelectedName({
          name: latestReg.name,
          registrant: latestReg.registrant,
          registrationDate: latestReg.blockTime,
          expirationDate: latestReg.expirationDate || 'Unknown',
          resolver: latestReg.resolver || 'Default',
          registrationCost: latestReg.costEth,
          chainId: latestReg.chainId
        });
      } else {
        setError(`No registration data found for "${name}"`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search name');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchName(searchTerm);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 1: return 'Ethereum';
      case 10: return 'Optimism';
      case 137: return 'Polygon';
      case 42161: return 'Arbitrum';
      default: return `Chain ${chainId}`;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
          ENS Name Search
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Search for detailed information about any ENS name, including registration history and renewals.
        </p>
      </div>

      {/* Search Form */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-4 max-w-2xl">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter ENS name (e.g., vitalik.eth)"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900/20 dark:border-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Name Details */}
      {selectedName && (
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
            {selectedName.name}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-indigo-500" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Owner</div>
                <div className="font-mono text-sm break-all">{selectedName.registrant}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Registered</div>
                <div className="text-sm">{formatDate(selectedName.registrationDate)}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Chain</div>
                <div className="text-sm">{getChainName(selectedName.chainId)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration History */}
      {registrationHistory.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Registration History
          </h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cost (ETH)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Chain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Transaction
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {registrationHistory.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {reg.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {parseFloat(reg.costEth).toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(reg.blockTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {getChainName(reg.chainId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <a
                        href={`https://etherscan.io/tx/${reg.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        {reg.txHash.slice(0, 10)}...
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Renewal History */}
      {renewalHistory.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Renewal History
          </h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cost (ETH)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Chain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Transaction
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {renewalHistory.map((renewal) => (
                  <tr key={renewal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {renewal.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {parseFloat(renewal.costEth).toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(renewal.blockTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {getChainName(renewal.chainId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <a
                        href={`https://etherscan.io/tx/${renewal.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        {renewal.txHash.slice(0, 10)}...
                        <ExternalLink className="w-3 h-3" />
                      </a>
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
}
