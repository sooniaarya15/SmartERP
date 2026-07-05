'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { getCompany, getToken } from '@/lib/store';

export default function StockFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isEdit = !!editId;

  const [company, setCompany] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    sku: '',
    unit: 'PCS',
    gst_percent: '18',
    purchase_price: '',
    selling_price: '',
    opening_stock: '0',
  });

  useEffect(() => {
    if (!getToken()) { router.push('/auth/login'); return; }
    const c = getCompany();
    if (!c) { router.push('/companies'); return; }
    setCompany(c);
    if (isEdit) fetchItem(editId);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleSave(); }
      if (e.key === 'Escape') router.push('/masters/stock');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [form]);

  const fetchItem = async (id) => {
    try {
      const { data } = await api.get(`/stock/${id}`);
      setForm({
        name:           data.name || '',
        sku:            data.sku || '',
        unit:           data.unit || 'PCS',
        gst_percent:    String(data.gst_percent || 18),
        purchase_price: String(data.purchase_price || ''),
        selling_price:  String(data.selling_price || ''),
        opening_stock:  String(data.opening_stock || 0),
      });
    } catch {
      setError('Failed to load stock item.');
    }
  };

  const handleSave = async () => {
    if (!form.name.trim())   { setError('Item name is required'); return; }
    if (!form.selling_price) { setError('Selling price is required'); return; }
    try {
      setSaving(true);
      setError('');
      const payload = { ...form, company_id: company.id };
      if (isEdit) {
        await api.put(`/stock/${editId}`, payload);
      } else {
        await api.post('/stock', payload);
      }
      setSuccess(isEdit ? 'Item updated!' : 'Item created!');
      setTimeout(() => router.push('/masters/stock'), 800);
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const f = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const margin =
    form.purchase_price && form.selling_price
      ? (
          ((Number(form.selling_price) - Number(form.purchase_price)) /
            Number(form.purchase_price)) *
          100
        ).toFixed(1)
      : null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="bg-green-700 text-white px-6 py-3 flex justify-between items-center">
        <div>
          <h1 className="font-bold text-lg">
            {isEdit ? 'Edit Stock Item' : 'Create Stock Item'}
          </h1>
          <p className="text-green-200 text-xs">{company?.name}</p>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="text-green-300">Ctrl+S to save • Esc to cancel</span>
          <button
            onClick={() => router.push('/masters/stock')}
            className="bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded"
          >
            ← Back
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {success && (
          <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg mb-4">
            ✓ {success}
          </div>
        )}
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4 flex justify-between">
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow p-6 space-y-5">
          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. Dell Laptop 15 inch, Basmati Rice 5kg"
              value={form.name}
              onChange={(e) => f('name', e.target.value)}
            />
          </div>

          {/* SKU + Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU Code
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 uppercase"
                placeholder="DELL-001"
                value={form.sku}
                onChange={(e) => f('sku', e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.unit}
                onChange={(e) => f('unit', e.target.value)}
              >
                <option value="PCS">PCS (Pieces)</option>
                <option value="KG">KG (Kilograms)</option>
                <option value="LTR">LTR (Litres)</option>
                <option value="MTR">MTR (Metres)</option>
                <option value="BOX">BOX</option>
                <option value="PKT">PKT (Packet)</option>
                <option value="BAG">BAG</option>
                <option value="NOS">NOS (Numbers)</option>
                <option value="SET">SET</option>
              </select>
            </div>
          </div>

          {/* GST Rate buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GST Rate
            </label>
            <div className="flex gap-2">
              {['0', '5', '12', '18', '28'].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => f('gst_percent', rate)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                    form.gst_percent === rate
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Price (₹)
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
                value={form.purchase_price}
                onChange={(e) => f('purchase_price', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selling Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
                value={form.selling_price}
                onChange={(e) => f('selling_price', e.target.value)}
              />
            </div>
          </div>

          {/* Live margin */}
          {margin !== null && (
            <div
              className={`rounded-lg px-4 py-2 text-sm flex justify-between ${
                Number(margin) >= 0
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              <span>Profit Margin</span>
              <span className="font-semibold">{margin}%</span>
            </div>
          )}

          {/* Opening Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opening Stock (qty)
            </label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="0"
              value={form.opening_stock}
              onChange={(e) => f('opening_stock', e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter quantity on hand at the start of the financial year
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-60"
            >
              {saving
                ? 'Saving...'
                : isEdit
                ? '💾 Update Item (Ctrl+S)'
                : '💾 Create Item (Ctrl+S)'}
            </button>
            <button
              onClick={() => router.push('/masters/stock')}
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