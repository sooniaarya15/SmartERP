'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getCompany, getToken } from '@/lib/store';

const blankRow = () => ({
  stock_item_id: '',
  item_name: '',
  quantity: '',
  rate: '',
  gst_percent: 18,
  gst_amount: 0,
  amount: 0,
});

export default function SalesVoucherPage() {
  const router = useRouter();
  const [company, setCompany] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [header, setHeader] = useState({
    party_ledger_id: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [rows, setRows] = useState([blankRow()]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [itemSearch, setItemSearch] = useState({});
  const [showItemDropdown, setShowItemDropdown] = useState({});

  useEffect(() => {
    if (!getToken()) { router.push('/auth/login'); return; }
    const c = getCompany();
    if (!c) { router.push('/companies'); return; }
    setCompany(c);
    fetchCustomers(c.id);
    fetchStock(c.id);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleSave(); }
      if (e.key === 'Escape') router.push('/vouchers/sales');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [header, rows]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.customer-dropdown'))
        setShowCustomerDropdown(false);
      if (!e.target.closest('.item-dropdown'))
        setShowItemDropdown({});
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchCustomers = async (company_id) => {
    try {
      const { data } = await api.get(`/ledgers?company_id=${company_id}`);
      setCustomers(data.filter((l) => l.ledger_type === 'CUSTOMER'));
    } catch { /* silent */ }
  };

  const fetchStock = async (company_id) => {
    try {
      const { data } = await api.get(`/stock?company_id=${company_id}`);
      setStockItems(data);
    } catch { /* silent */ }
  };

  const selectCustomer = (customer) => {
    setHeader((h) => ({ ...h, party_ledger_id: customer.id }));
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
  };

  const selectItem = (rowIndex, item) => {
    setRows((prev) => {
      const next = [...prev];
      const qty = Number(next[rowIndex].quantity) || 0;
      const rate = Number(item.selling_price);
      const gstPct = Number(item.gst_percent);
      const baseAmount = qty * rate;
      const gstAmount = parseFloat(((baseAmount * gstPct) / 100).toFixed(2));
      next[rowIndex] = {
        ...next[rowIndex],
        stock_item_id: item.id,
        item_name:     item.name,
        rate:          rate,
        gst_percent:   gstPct,
        amount:        baseAmount,
        gst_amount:    gstAmount,
      };
      return next;
    });
    setItemSearch((s) => ({ ...s, [rowIndex]: item.name }));
    setShowItemDropdown((d) => ({ ...d, [rowIndex]: false }));
  };

  const handleRowChange = (idx, field, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      const qty     = Number(field === 'quantity'   ? value : next[idx].quantity)   || 0;
      const rate    = Number(field === 'rate'        ? value : next[idx].rate)       || 0;
      const gstPct  = Number(field === 'gst_percent' ? value : next[idx].gst_percent) || 0;
      const base    = qty * rate;
      const gstAmt  = parseFloat(((base * gstPct) / 100).toFixed(2));
      next[idx].amount     = base;
      next[idx].gst_amount = gstAmt;
      return next;
    });
  };

  const addRow    = () => setRows((r) => [...r, blankRow()]);
  const removeRow = (idx) => {
    if (rows.length === 1) return;
    setRows((r) => r.filter((_, i) => i !== idx));
  };

  const subtotal   = rows.reduce((s, r) => s + (Number(r.amount)     || 0), 0);
  const totalGST   = rows.reduce((s, r) => s + (Number(r.gst_amount) || 0), 0);
  const grandTotal = subtotal + totalGST;

  const handleSave = async () => {
    if (!header.party_ledger_id) { setError('Please select a customer'); return; }
    if (!header.date)             { setError('Please select a date'); return; }
    const validRows = rows.filter((r) => r.stock_item_id && r.quantity && r.rate);
    if (validRows.length === 0)   { setError('Add at least one item with quantity and rate'); return; }
    try {
      setSaving(true);
      setError('');
      await api.post('/vouchers', {
        company_id:      company.id,
        voucher_type:    'SALE',
        date:            header.date,
        party_ledger_id: header.party_ledger_id,
        notes:           header.notes,
        items:           validRows,
      });
      setSuccess('Sales invoice saved!');
      setTimeout(() => router.push('/vouchers/sales'), 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="bg-indigo-700 text-white px-6 py-3 flex justify-between items-center">
        <div>
          <h1 className="font-bold text-lg">Sales Invoice Entry</h1>
          <p className="text-indigo-200 text-xs">{company?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-indigo-300 text-sm hidden md:block">
            Ctrl+S to save • Esc to cancel
          </span>
          <button
            onClick={() => router.push('/vouchers/sales')}
            className="bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded text-sm"
          >
            ← Back
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {success && (
          <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg">
            ✓ {success}
          </div>
        )}
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg flex justify-between">
            ⚠ {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* Header card */}
        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Invoice Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer search */}
            <div className="md:col-span-2 relative customer-dropdown">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Search customer name..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                  setHeader((h) => ({ ...h, party_ledger_id: '' }));
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                autoFocus
              />
              {showCustomerDropdown && customerSearch && filteredCustomers.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      onMouseDown={() => selectCustomer(c)}
                      className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 text-sm border-b border-gray-50 last:border-0"
                    >
                      <span className="font-medium text-gray-800">{c.name}</span>
                      {c.gstin && (
                        <span className="text-xs text-gray-400 ml-2">{c.gstin}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {showCustomerDropdown && customerSearch && filteredCustomers.length === 0 && (
                <div className="absolute z-20 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 px-4 py-3 text-sm text-gray-400">
                  No customer found.{' '}
                  <button
                    className="text-indigo-600 hover:underline"
                    onMouseDown={() => router.push('/masters/ledgers/new')}
                  >
                    Create one →
                  </button>
                </div>
              )}
              {header.party_ledger_id && (
                <p className="text-xs text-green-600 mt-1">✓ Customer selected</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={header.date}
                onChange={(e) =>
                  setHeader((h) => ({ ...h, date: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Notes */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Delivery terms, payment terms, etc."
              value={header.notes}
              onChange={(e) =>
                setHeader((h) => ({ ...h, notes: e.target.value }))
              }
            />
          </div>
        </div>

        {/* Line items table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Items
            </h2>
            <button
              onClick={addRow}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              + Add Row
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600 w-6">#</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600 w-56">Item</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-20">Qty</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-24">Rate (₹)</th>
                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 w-20">GST %</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-24">GST Amt</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-28">Amount (₹)</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-indigo-50/30">
                    <td className="px-3 py-2 text-gray-400 text-xs">{idx + 1}</td>

                    {/* Item search */}
                    <td className="px-3 py-2 relative item-dropdown">
                      <input
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        placeholder="Search item..."
                        value={itemSearch[idx] ?? row.item_name}
                        onChange={(e) => {
                          const v = e.target.value;
                          setItemSearch((s) => ({ ...s, [idx]: v }));
                          setShowItemDropdown((d) => ({ ...d, [idx]: true }));
                          if (!v)
                            setRows((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], stock_item_id: '', item_name: '' };
                              return next;
                            });
                        }}
                        onFocus={() =>
                          setShowItemDropdown((d) => ({ ...d, [idx]: true }))
                        }
                      />
                      {showItemDropdown[idx] && (
                        <div className="absolute z-30 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mt-0.5 max-h-44 overflow-y-auto min-w-64">
                          {stockItems
                            .filter(
                              (s) =>
                                s.name
                                  .toLowerCase()
                                  .includes((itemSearch[idx] || '').toLowerCase()) ||
                                (s.sku || '')
                                  .toLowerCase()
                                  .includes((itemSearch[idx] || '').toLowerCase())
                            )
                            .map((item) => (
                              <button
                                key={item.id}
                                onMouseDown={() => selectItem(idx, item)}
                                className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-xs border-b border-gray-50 last:border-0"
                              >
                                <div className="font-medium text-gray-800">
                                  {item.name}
                                </div>
                                <div className="text-gray-400">
                                  ₹{Number(item.selling_price).toLocaleString('en-IN')} • GST{' '}
                                  {item.gst_percent}% • Stock: {item.opening_stock} {item.unit}
                                </div>
                              </button>
                            ))}
                          {stockItems.filter((s) =>
                            s.name
                              .toLowerCase()
                              .includes((itemSearch[idx] || '').toLowerCase())
                          ).length === 0 && (
                            <div className="px-3 py-2 text-gray-400 text-xs">
                              No items found
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Qty */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        placeholder="0"
                        value={row.quantity}
                        onChange={(e) =>
                          handleRowChange(idx, 'quantity', e.target.value)
                        }
                      />
                    </td>

                    {/* Rate */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        placeholder="0.00"
                        value={row.rate}
                        onChange={(e) =>
                          handleRowChange(idx, 'rate', e.target.value)
                        }
                      />
                    </td>

                    {/* GST % */}
                    <td className="px-3 py-2">
                      <select
                        className="w-full border border-gray-200 rounded px-1 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        value={row.gst_percent}
                        onChange={(e) =>
                          handleRowChange(idx, 'gst_percent', e.target.value)
                        }
                      >
                        {[0, 5, 12, 18, 28].map((r) => (
                          <option key={r} value={r}>{r}%</option>
                        ))}
                      </select>
                    </td>

                    {/* GST Amount */}
                    <td className="px-3 py-2 text-right text-xs text-orange-600 font-mono">
                      ₹{Number(row.gst_amount).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    {/* Amount */}
                    <td className="px-3 py-2 text-right text-xs font-semibold text-gray-800 font-mono">
                      ₹{Number(row.amount).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    {/* Remove row */}
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => removeRow(idx)}
                        className="text-gray-300 hover:text-red-400 text-lg leading-none"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-gray-100">
            <button
              onClick={addRow}
              className="text-sm text-indigo-500 hover:text-indigo-700 font-medium"
            >
              + Add another item
            </button>
          </div>
        </div>

        {/* Totals + Save */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* GST breakup */}
          <div className="flex-1 bg-white rounded-2xl shadow p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              GST Breakup
            </h3>
            <table className="w-full text-sm">
              <tbody>
                {[...new Set(rows.map((r) => r.gst_percent))]
                  .filter(Boolean)
                  .map((pct) => {
                    const rowsForPct = rows.filter(
                      (r) => Number(r.gst_percent) === Number(pct)
                    );
                    const taxable = rowsForPct.reduce(
                      (s, r) => s + Number(r.amount || 0), 0
                    );
                    const gst = rowsForPct.reduce(
                      (s, r) => s + Number(r.gst_amount || 0), 0
                    );
                    return (
                      <tr key={pct} className="border-b border-gray-100">
                        <td className="py-1.5 text-gray-500">GST @ {pct}%</td>
                        <td className="py-1.5 text-right text-gray-500">
                          Taxable: ₹{taxable.toLocaleString('en-IN')}
                        </td>
                        <td className="py-1.5 text-right font-medium text-orange-600">
                          ₹{gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Total box */}
          <div className="w-full md:w-72 bg-white rounded-2xl shadow p-5 flex flex-col justify-between">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-mono">
                  ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-orange-600">
                <span>GST</span>
                <span className="font-mono">
                  ₹{totalGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                <span>Total</span>
                <span className="font-mono">
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm transition disabled:opacity-60"
              >
                {saving ? 'Saving...' : '💾 Save Invoice (Ctrl+S)'}
              </button>
              <button
                onClick={() => router.push('/vouchers/sales')}
                className="w-full border border-gray-300 hover:bg-gray-50 text-gray-600 py-2 rounded-xl text-sm transition"
              >
                Cancel (Esc)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}