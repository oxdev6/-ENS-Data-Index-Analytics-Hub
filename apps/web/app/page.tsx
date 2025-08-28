"use client";
import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Area,
} from 'recharts';

type Registration = { blockTime: string; name?: string; txHash?: string; chainId?: number };
type Renewal = { blockTime: string };
type NameRow = { id: string };

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') q.set(k, String(v));
  return q.toString();
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';
function buildHeaders(): HeadersInit {
  const h: Record<string, string> = {};
  if (API_KEY) h['x-api-key'] = API_KEY;
  return h;
}

async function fetchRegistrations(params?: { from?: string; to?: string; chainId?: number }): Promise<Registration[]> {
  const query = buildQuery({ limit: 200, from: params?.from, to: params?.to, chainId: params?.chainId });
  const res = await fetch(`${API_BASE}/registrations?${query}`, { headers: buildHeaders() });
  const json = await res.json();
  const rows = Array.isArray(json) ? json : json.data;
  return rows as Registration[];
}

async function fetchRenewals(): Promise<Renewal[]> {
  const res = await fetch(`${API_BASE}/renewals?limit=200`, { headers: buildHeaders() });
  const json = await res.json();
  const rows = Array.isArray(json) ? json : json.data;
  return rows as Renewal[];
}

async function fetchNames(): Promise<NameRow[]> {
  const res = await fetch(`${API_BASE}/names?limit=1`, { headers: buildHeaders() });
  const json = await res.json();
  const rows = Array.isArray(json) ? json : json.data;
  return rows as NameRow[];
}

export default function HomePage() {
  const [data, setData] = useState<Registration[]>([]);
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  useEffect(() => {
    fetchRegistrations({ from, to, chainId }).then(setData).catch(() => setData([]));
    fetchRenewals().then(setRenewals).catch(() => setRenewals([]));
    fetchNames().then((rows) => setActiveCount(rows.length > 0 ? rows.length : 0)).catch(() => setActiveCount(0));
  }, [from, to, chainId]);

  const series = useMemo(() => {
    const byDay: Record<string, number> = {};
    for (const r of data) {
      const day = r.blockTime.split('T')[0];
      byDay[day] = (byDay[day] ?? 0) + 1;
    }
    return Object.entries(byDay)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, count]) => ({ date, count }));
  }, [data]);

  const renewalsSeries = useMemo(() => {
    const byDay: Record<string, number> = {};
    for (const r of renewals) {
      const day = r.blockTime.split('T')[0];
      byDay[day] = (byDay[day] ?? 0) + 1;
    }
    return Object.entries(byDay)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, count]) => ({ date, count }));
  }, [renewals]);

  const today = new Date().toISOString().slice(0, 10);
  const registrationsToday = useMemo(
    () => data.filter((r) => r.blockTime.startsWith(today)).length,
    [data, today]
  );
  const renewalsToday = useMemo(
    () => renewals.filter((r) => r.blockTime.startsWith(today)).length,
    [renewals, today]
  );

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  function resetPaging() {
    setPage(1);
  }

  return (
    <main className="container mx-auto max-w-6xl p-6">
      <div className="rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-[1px] shadow-lg">
        <div className="rounded-[11px] bg-white p-5 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-700 to-pink-600 bg-clip-text text-transparent">ENS Data Index & Analytics Hub</h1>
          <p className="mt-1 text-sm text-gray-600">Transparent metrics across mainnet and L2s</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <label className="flex flex-col text-sm text-gray-600">
          <span>From</span>
          <input className="mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" type="date" value={from ? from.slice(0,10) : ''} onChange={(e) => setFrom(e.target.value ? `${e.target.value}T00:00:00.000Z` : '')} />
        </label>
        <label className="flex flex-col text-sm text-gray-600">
          <span>To</span>
          <input className="mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" type="date" value={to ? to.slice(0,10) : ''} onChange={(e) => setTo(e.target.value ? `${e.target.value}T23:59:59.999Z` : '')} />
        </label>
        <label className="flex flex-col text-sm text-gray-600">
          <span>Chain</span>
          <select className="mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={chainId ?? ''} onChange={(e) => setChainId(e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">All</option>
            <option value="1">Ethereum</option>
            <option value="10">Optimism</option>
            <option value="42161">Arbitrum</option>
            <option value="137">Polygon</option>
            <option value="8453">Base</option>
          </select>
        </label>
        <div className="md:col-span-2 flex gap-2">
          <a
            href={`${API_BASE}/export/registrations.csv?${buildQuery({ from, to, chainId })}`}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
            target="_blank"
          >
            Export registrations CSV
          </a>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm relative overflow-hidden">
          <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500" />
          <div className="text-sm text-gray-500">Active names (sample)</div>
          <div className="mt-1 text-3xl font-bold">{activeCount}</div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm relative overflow-hidden">
          <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-lime-500" />
          <div className="text-sm text-gray-500">Registrations today</div>
          <div className="mt-1 text-3xl font-bold">{registrationsToday}</div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm relative overflow-hidden">
          <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pink-500 to-red-500" />
          <div className="text-sm text-gray-500">Renewals today</div>
          <div className="mt-1 text-3xl font-bold">{renewalsToday}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
        <span>Legend:</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-indigo-600" /> Registrations</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-green-600" /> Renewals</span>
        <span className="ml-4">Chains:</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-purple-600" /> Ethereum</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Optimism</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-cyan-500" /> Arbitrum</span>
      </div>
      <p className="mt-6 text-sm font-medium text-gray-700">Registrations over time (last 200 events)</p>
      <div className="mt-2 h-80 rounded-lg border bg-white p-3">
        <ResponsiveContainer>
          <LineChart data={series} margin={{ top: 16, right: 16, bottom: 16, left: 0 }}>
            <defs>
              <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f0f0f0" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Area type="monotone" dataKey="count" stroke="#4f46e5" fill="url(#regGradient)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-6 text-sm font-medium text-gray-700">Renewals over time (last 200 events)</p>
      <div className="mt-2 h-80 rounded-lg border bg-white p-3">
        <ResponsiveContainer>
          <LineChart data={renewalsSeries} margin={{ top: 16, right: 16, bottom: 16, left: 0 }}>
            <defs>
              <linearGradient id="renGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#16a34a" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#16a34a" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f0f0f0" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Area type="monotone" dataKey="count" stroke="#16a34a" fill="url(#renGradient)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-6 text-sm font-medium text-gray-700">Recent registrations</p>
      <div className="mt-2 flex items-center gap-3">
        <label className="text-sm text-gray-600">Rows per page</label>
        <select className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); resetPaging(); }}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <div className="ml-auto flex items-center gap-2">
          <button className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm disabled:opacity-50" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <button className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm disabled:opacity-50" onClick={() => setPage((p) => (p * pageSize < data.length ? p + 1 : p))} disabled={page * pageSize >= data.length}>Next</button>
        </div>
      </div>
      <div className="mt-2 overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 font-medium text-gray-700">Time</th>
              <th className="px-3 py-2 font-medium text-gray-700">Name</th>
              <th className="px-3 py-2 font-medium text-gray-700">Tx</th>
              <th className="px-3 py-2 font-medium text-gray-700">Chain</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">{new Date(r.blockTime).toLocaleString()}</td>
                <td className="px-3 py-2">{r.name ?? '-'}</td>
                <td className="px-3 py-2">
                  {r.txHash ? (
                    <a className="text-indigo-600 hover:underline" href={`https://etherscan.io/tx/${r.txHash}`} target="_blank">{r.txHash.slice(0, 10)}...</a>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-3 py-2">{r.chainId ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

