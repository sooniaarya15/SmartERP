'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getCompany, getToken } from '@/lib/store';

export default function StockListPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [company, setCompany] = useState(null);

  useEffect(() => {
    if (!getToken()) { router.push('/auth/login'); return; }
    const c = getCompany();
    if (!c) { router.push('/companies'); return; }
    setCompany(c);
    fetchItems(c.id);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        router.push('/masters/stock/new');
      }
      if (e.key === 'Escape') router.push('/dashboard');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const fetchItems = async (company_id) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/stock?company_id=${company_id}`);
      setItems(data);
    } catch {
      setError('Failed to load stock items.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete stock item "${name}"?`)) return;
    try {
      await api.delete(`/stock/${id}`);
      fetchItems(company.id);
    } catch {
      setError('Delete failed. Item may be used in vouchers.');
    }
  };

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = items.reduce(
    (sum, i) =>
      sum + Number(i.selling_price || 0) * Number(i.opening_stock || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="bg-green-700 text-white px-6 py-3 flex justify-between items-center">
        <div>
          <h1 className="font-bold text-lg">Stock Item Master</h1>
          <p className="text-green-200 text-xs">{company?.name}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/masters/stock/new')}
            className="bg-white text-green-700 hover:bg-green-50 px-4 py-1.5 rounded text-sm font-semibold"
          >
            + Create (Alt+C)
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-green-600 hover:bg-green-500 px-4 py-1.5 rounded text-sm"
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

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: 'Total Items',    value: items.length,                              color: 'blue'  },
            { label: 'Stock Value',    value: `₹${totalValue.toLocaleString('en-IN')}`,  color: 'green' },
            { label: 'Low Stock (≤5)', value: items.filter((i) => Number(i.opening_stock) <= 5).length, color: 'red' },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-xl shadow px-5 py-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide">{card.label}</p>
              <p className={`text-2xl font-bold mt-1 text-${card.color}-600`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow p-4 mb-4 flex gap-3 items-center">
          <input
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="🔍 Search by item name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <span className="text-sm text-gray-400">{filtered.length} items</span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-gray-400">Loading stock items...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📦</p>
              <p className="text-gray-500 font-medium">No stock items found</p>
              <p className="text-gray-400 text-sm mt-1">
                Press Alt+C to create your first item
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Item Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">SKU</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Unit</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Purchase ₹</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Selling ₹</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">GST %</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Opening Qty</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 hover:bg-green-50 transition"
                  >
                    <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {item.sku || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">
                      ₹{Number(item.purchase_price).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-green-700 font-semibold">
                      ₹{Number(item.selling_price).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                        {item.gst_percent}%
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        Number(item.opening_stock) <= 5
                          ? 'text-red-500'
                          : 'text-gray-700'
                      }`}
                    >
                      {item.opening_stock} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() =>
                            router.push(`/masters/stock/new?id=${item.id}`)
                          }
                          className="text-xs bg-green-50 hover:bg-green-100 text-green-600 px-3 py-1.5 rounded-lg"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
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