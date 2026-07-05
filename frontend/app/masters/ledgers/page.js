'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getCompany, getToken } from '@/lib/store';

export default function LedgersPage() {
  const router = useRouter();
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [error, setError] = useState('');
  const [company, setCompany] = useState(null);

  useEffect(() => {
    if (!getToken()) { router.push('/auth/login'); return; }
    const c = getCompany();
    if (!c) { router.push('/companies'); return; }
    setCompany(c);
    fetchLedgers(c.id);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        router.push('/masters/ledgers/new');
      }
      if (e.key === 'Escape') router.push('/dashboard');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const fetchLedgers = async (company_id) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/ledgers?company_id=${company_id}`);
      setLedgers(data);
    } catch {
      setError('Failed to load ledgers.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete ledger "${name}"?`)) return;
    try {
      await api.delete(`/ledgers/${id}`);
      fetchLedgers(company.id);
    } catch {
      setError('Delete failed. Ledger may be used in vouchers.');
    }
  };

  const filtered = ledgers.filter((l) => {
    const matchType   = filterType === 'ALL' || l.ledger_type === filterType;
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const typeBadgeColor = {
    CUSTOMER: 'bg-blue-100 text-blue-700',
    SUPPLIER: 'bg-orange-100 text-orange-700',
    BANK:     'bg-green-100 text-green-700',
    CASH:     'bg-yellow-100 text-yellow-700',
    EXPENSE:  'bg-red-100 text-red-700',
    INCOME:   'bg-purple-100 text-purple-700',
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="bg-blue-700 text-white px-6 py-3 flex justify-between items-center">
        <div>
          <h1 className="font-bold text-lg">Ledger Master</h1>
          <p className="text-blue-200 text-xs">{company?.name}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/masters/ledgers/new')}
            className="bg-white text-blue-700 hover:bg-blue-50 px-4 py-1.5 rounded text-sm font-semibold"
          >
            + Create (Alt+C)
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded text-sm"
          >
            ← Gateway
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4 flex justify-between">
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* Filter bar */}
        <div className="bg-white rounded-xl shadow p-4 mb-4 flex flex-wrap gap-3 items-center">
          <input
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="🔍 Search ledger by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">All Types</option>
            <option value="CUSTOMER">Customer</option>
            <option value="SUPPLIER">Supplier</option>
            <option value="BANK">Bank</option>
            <option value="CASH">Cash</option>
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>
          <span className="text-sm text-gray-400">{filtered.length} records</span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-gray-400">Loading ledgers...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📒</p>
              <p className="text-gray-500 font-medium">No ledgers found</p>
              <p className="text-gray-400 text-sm mt-1">
                {search
                  ? 'Try a different search'
                  : 'Press Alt+C to create your first ledger'}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Ledger Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Group</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Opening Bal.</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, idx) => (
                  <tr
                    key={l.id}
                    className="border-b border-gray-100 hover:bg-blue-50 transition"
                  >
                    <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{l.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          typeBadgeColor[l.ledger_type] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {l.ledger_type || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{l.group_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{l.phone || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">
                      ₹{Number(l.opening_balance || 0).toLocaleString('en-IN')}
                      <span className="text-xs text-gray-400 ml-1">{l.balance_type}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => router.push(`/masters/ledgers/new?id=${l.id}`)}
                          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(l.id, l.name)}
                          className="text-xs bg-red-50 hover:bg-red-100 text-red-500 px-3 py-1.5 rounded-lg"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}