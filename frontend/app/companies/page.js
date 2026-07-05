'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { setCompany, logout } from '@/lib/store';
import useAuth from '@/hooks/useAuth';

export default function CompaniesPage() {
  const router = useRouter();
  const { ready } = useAuth(false);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: '', gstin: '', address: '', state: '',
    financial_year_start: '2024-04-01',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ready) fetchCompanies();
  }, [ready]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/companies');
      setCompanies(data);
    } catch {
      setError('Failed to load companies.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (company) => {
    setCompany(company);
    router.push('/dashboard');
  };

  const openCreateForm = () => {
    setFormMode('create');
    setEditId(null);
    setForm({ name: '', gstin: '', address: '', state: '', financial_year_start: '2024-04-01' });
    setShowForm(true);
  };

  const openEditForm = (company) => {
    setFormMode('edit');
    setEditId(company.id);
    setForm({
      name: company.name,
      gstin: company.gstin || '',
      address: company.address || '',
      state: company.state || '',
      financial_year_start: company.financial_year_start?.split('T')[0] || '2024-04-01',
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Company name is required');
    try {
      setSaving(true);
      setError('');
      if (formMode === 'create') {
        await api.post('/companies', form);
      } else {
        await api.put(`/companies/${editId}`, form);
      }
      setShowForm(false);
      fetchCompanies();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/companies/${id}`);
      fetchCompanies();
    } catch {
      setError('Delete failed.');
    }
  };

  const states = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
    'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
    'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
    'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
    'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
    'Delhi','Jammu & Kashmir','Ladakh','Puducherry',
  ];

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Top bar */}
      <div className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <div>
          <h1 className="text-xl font-bold tracking-wide">SmartERP</h1>
          <p className="text-blue-200 text-sm">Select or create a company</p>
        </div>
        <button onClick={logout}
          className="text-sm bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded">
          Logout
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button className="float-right font-bold" onClick={() => setError('')}>×</button>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Your Companies</h2>
          {companies.length < 5 && (
            <button onClick={openCreateForm}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition">
              + Create Company
            </button>
          )}
        </div>

        {companies.length >= 5 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4 text-sm">
            Maximum 5 companies per account reached.
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading companies...</div>

        ) : companies.length === 0 ? (

          <div className="bg-white rounded-xl shadow p-16 text-center">
            <div className="text-5xl mb-4">🏢</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No companies yet</h3>
            <p className="text-gray-400 mb-6">Create your first company to get started</p>
            <button onClick={openCreateForm}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              + Create Company
            </button>
          </div>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companies.map((c) => (
              <div key={c.id}
                className="bg-white rounded-xl shadow hover:shadow-md transition border border-gray-100 p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{c.name}</h3>
                    {c.gstin && <p className="text-xs text-gray-400 mt-0.5">GST: {c.gstin}</p>}
                    {c.state && <p className="text-xs text-gray-400">{c.state}</p>}
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                    Active
                  </span>
                </div>
                {c.address && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-1">{c.address}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleSelect(c)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition">
                    Open →
                  </button>
                  <button onClick={() => openEditForm(c)}
                    className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-sm text-gray-600">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(c.id, c.name)}
                    className="px-4 py-2 border border-red-200 hover:bg-red-50 rounded-lg text-sm text-red-500">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-gray-800">
                {formMode === 'create' ? 'Create New Company' : 'Edit Company'}
              </h3>
              <button onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input autoFocus
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. ABC Traders Pvt Ltd"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="22AAAAA0000A1Z5"
                  value={form.gstin}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}>
                  <option value="">-- Select State --</option>
                  {states.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Full business address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Financial Year Start
                </label>
                <input type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.financial_year_start}
                  onChange={(e) => setForm({ ...form, financial_year_start: e.target.value })}
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium text-sm disabled:opacity-60">
                  {saving ? 'Saving...' : formMode === 'create' ? 'Create Company' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-600 py-2 rounded-lg text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}