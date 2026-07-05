'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/store';
import useAuth from '@/hooks/useAuth';

const MENU = [
  {
    title: 'Masters',
    color: 'blue',
    icon: '📋',
    items: [
      { label: 'Ledger', path: '/masters/ledgers', shortcut: 'L' },
      { label: 'Stock Items', path: '/masters/stock', shortcut: 'S' },
    ],
  },
  {
    title: 'Transactions',
    color: 'green',
    icon: '📄',
    items: [
      { label: 'Sales Entry', path: '/vouchers/sales/new', shortcut: 'F8' },
      { label: 'Purchase Entry', path: '/vouchers/purchase/new', shortcut: 'F9' },
      { label: 'Sales List', path: '/vouchers/sales', shortcut: '' },
      { label: 'Purchase List', path: '/vouchers/purchase', shortcut: '' },
    ],
  },
  {
    title: 'Reports',
    color: 'purple',
    icon: '📊',
    items: [
      { label: 'Ledger Report', path: '/reports/ledger', shortcut: '' },
      { label: 'Stock Summary', path: '/reports/stock', shortcut: '' },
      { label: 'Sales Register', path: '/reports/sales', shortcut: '' },
      { label: 'Trial Balance', path: '/reports/trial', shortcut: '' },
    ],
  },
  {
    title: 'GST',
    color: 'orange',
    icon: '🧾',
    items: [
      { label: 'GST Summary', path: '/gst/summary', shortcut: '' },
      { label: 'GSTR-1', path: '/gst/gstr1', shortcut: '' },
    ],
  },
];

const colorMap = {
  blue: 'bg-blue-50 border-blue-200 hover:border-blue-400',
  green: 'bg-green-50 border-green-200 hover:border-green-400',
  purple: 'bg-purple-50 border-purple-200 hover:border-purple-400',
  orange: 'bg-orange-50 border-orange-200 hover:border-orange-400',
};

const headerColorMap = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  purple: 'bg-purple-600',
  orange: 'bg-orange-500',
};

export default function DashboardPage() {
  const router = useRouter();

  const { ready, company } = useAuth(true);

  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    if (!ready) return;

    const tick = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN'));
    };

    tick();

    const id = setInterval(tick, 1000);

    return () => clearInterval(id);
  }, [ready]);

  if (!ready || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

// Main dashboard — only renders after auth confirmed
return (
  <div className="min-h-screen bg-gray-100">

    {/* ── Top bar ── */}
    <div className="bg-blue-800 text-white px-6 py-3 flex justify-between items-center shadow-lg">
      <div>
        <h1 className="text-lg font-bold">SmartERP</h1>
        <p className="text-blue-300 text-xs">Gateway of SmartERP</p>
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold">{company.name}</p>
        {company.gstin && (
          <p className="text-blue-300 text-xs">GSTIN: {company.gstin}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs text-blue-300">
            {new Date().toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
            })}
          </p>
          <p className="text-sm font-mono">{currentTime}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/companies')}
            className="text-xs bg-blue-700 hover:bg-blue-600 px-3 py-1.5 rounded"
          >
            Switch Company
          </button>
          <button
            onClick={logout}
            className="text-xs bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    </div>

    {/* ── Welcome bar ── */}
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <p className="text-sm text-gray-500">
        Welcome to{' '}
        <span className="font-semibold text-gray-800">{company.name}</span>.
        Use the menu below or keyboard shortcuts to navigate.
      </p>
    </div>

    {/* ── Menu grid ── */}
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {MENU.map((section) => (
          <div
            key={section.title}
            className={`rounded-xl border-2 overflow-hidden ${colorMap[section.color]}`}
          >
            {/* Section header */}
            <div className={`${headerColorMap[section.color]} px-4 py-3 flex items-center gap-2`}>
              <span className="text-lg">{section.icon}</span>
              <h2 className="text-white font-semibold tracking-wide text-sm uppercase">
                {section.title}
              </h2>
            </div>

            {/* Section links */}
            <div className="p-3 space-y-1">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => router.push(item.path)}
                  className="w-full flex justify-between items-center px-4 py-2.5 rounded-lg hover:bg-white hover:shadow-sm transition text-left group"
                >
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {item.label}
                  </span>
                  {item.shortcut && (
                    <span className="text-xs bg-white border border-gray-200 text-gray-400 px-2 py-0.5 rounded font-mono">
                      {item.shortcut}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Keyboard shortcuts bar ── */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 px-6 py-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Keyboard Shortcuts
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-500">
          {[
            ['F8', 'New Sales Entry'],
            ['F9', 'New Purchase Entry'],
            ['Ctrl+S', 'Save in any form'],
            ['Esc', 'Cancel / Go back'],
            ['Alt+C', 'Create new record'],
            ['Alt+D', 'Delete selected'],
            ['Tab', 'Next field'],
            ['Alt+F4', 'Logout'],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded font-mono text-gray-600">
                {key}
              </span>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

  </div>
);
}