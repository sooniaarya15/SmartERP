'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { getCompany, getToken } from '@/lib/store';

export default function LedgerFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isEdit = !!editId;

  const [company, setCompany] = useState(null);
  const [groups, setGroups] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    group_id: '',
    ledger_type: 'CUSTOMER',
    gstin: '',
    phone: '',
    address: '',
    opening_balance: '',
    balance_type: 'DR',
  });

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    const c = getCompany();
    if (!c) { router.push('/companies'); return; }
    setCompany(c);
    fetchGroups(c.id);
    if (isEdit) fetchLedger(editId);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') router.push('/masters/ledgers');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [form]);

  const fetchGroups = async (company_id) => {
    try {
      const { data } = await api.get(`/ledger-groups?company_id=${company_id}`);
      setGroups(data);
    } catch {
    }
  };

  const fetchLedger = async (id) => {
    try {
      const { data } = await api.get(`/ledgers/${id}`);
      setForm({
        name:            data.name || '',
        group_id:        data.group_id || '',
        ledger_type:     data.ledger_type || 'CUSTOMER',
        gstin:           data.gstin || '',
        phone:           data.phone || '',
        address:         data.address || '',
        opening_balance: data.opening_balance || '',
        balance_type:    data.balance_type || 'DR',
      });
    } catch {
      setError('Failed to load ledger data.');
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Ledger name is required'); return; }
    try {
      setSaving(true);
      setError('');
      const payload = { ...form, company_id: company.id };
      if (isEdit) {
        await api.put(`/ledgers/${editId}`, payload);
      } else {
        await api.post('/ledgers', payload);
      }
      setSuccess(isEdit ? 'Ledger updated!' : 'Ledger created!');
      setTimeout(() => router.push('/masters/ledgers'), 800);
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const f = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const typeGroupSuggestion = {
    CUSTOMER: 'Sundry Debtors',
    SUPPLIER: 'Sundry Creditors',
    BANK:     'Bank Accounts',
    CASH:     'Cash-in-Hand',
    EXPENSE:  'Indirect Expenses',
    INCOME:   'Indirect Income',
  };

  if (!company) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p className="text-gray-400">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Top bar */}
      <div className="bg-blue-700 text-white px-6 py-3 flex justify-between items-center">
        <div>
          <h1 className="font-bold text-lg">
            {isEdit ? 'Edit Ledger' : 'Create Ledger'}
          </h1>
          <p className="text-blue-200 text-xs">{company?.name}</p>
        </div>
        <div className="flex gap-3 items-center">
          <span className="text-blue-300 text-sm">Ctrl+S to save • Esc to cancel</span>
          <button
            onClick={() => router.push('/masters/ledgers')}
            className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-sm"
          >
            ← Back
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Success */}
        {success && (
          <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg mb-4">
            ✓ {success}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4 flex justify-between">
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow p-6 space-y-5">

          {/* Ledger Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ledger Name <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Ramesh Kumar, HDFC Bank, Office Rent"
              value={form.name}
              onChange={(e) => f('name', e.target.value)}
            />
          </div>

          {/* Type + Group */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ledger Type
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.ledger_type}
                onChange={(e) => f('ledger_type', e.target.value)}
              >
                <option value="CUSTOMER">Customer (Debtor)</option>
                <option value="SUPPLIER">Supplier (Creditor)</option>
                <option value="BANK">Bank Account</option>
                <option value="CASH">Cash</option>
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Typical group: {typeGroupSuggestion[form.ledger_type]}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Under Group
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.group_id}
                onChange={(e) => f('group_id', e.target.value)}
              >
                <option value="">-- Select Group --</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* GSTIN + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GSTIN
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="22AAAAA0000A1Z5"
                value={form.gstin}
                onChange={(e) => f('gstin', e.target.value.toUpperCase())}
                maxLength={15}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="9876543210"
                value={form.phone}
                onChange={(e) => f('phone', e.target.value)}
                maxLength={10}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Full address"
              value={form.address}
              onChange={(e) => f('address', e.target.value)}
            />
          </div>

          {/* Opening Balance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opening Balance
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                value={form.opening_balance}
                onChange={(e) => f('opening_balance', e.target.value)}
              />
              <select
                className="w-28 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.balance_type}
                onChange={(e) => f('balance_type', e.target.value)}
              >
                <option value="DR">Dr (Debit)</option>
                <option value="CR">Cr (Credit)</option>
              </select>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Dr = amount owed TO you • Cr = amount you OWE
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-60"
            >
              {saving ? 'Saving...' : isEdit ? '💾 Update Ledger (Ctrl+S)' : '💾 Create Ledger (Ctrl+S)'}
            </button>
            <button
              onClick={() => router.push('/masters/ledgers')}
              className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-600 py-2.5 rounded-xl text-sm transition"
            >
              Cancel (Esc)
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}