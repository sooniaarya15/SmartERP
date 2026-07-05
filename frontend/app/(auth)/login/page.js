'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { setToken, setUser } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please enter email and password');
      return;
    }
    try {
      setLoading(true);
      setError('');

      // API call to backend  ...
      const { data } = await api.post('/auth/login', form);

      console.log('Login response:', data); // ← debug line

      // Save token
      setToken(data.token);
      setUser(data.user);

      console.log('Token saved:', localStorage.getItem('token')); // ← debug line

      // Go to companies
      router.push('/companies');

    } catch (err) {
      console.error('Login error:', err); // ← debug line
      setError(
        err.response?.data?.error || 'Login failed. Check credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700">SmartERP</h1>
          <p className="text-gray-400 text-sm mt-1">
            Billing, Inventory & Accounting
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold text-sm transition disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Login →'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          No account?{' '}
          <button
            onClick={() => router.push('/register')}
            className="text-blue-600 hover:underline font-medium"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
}