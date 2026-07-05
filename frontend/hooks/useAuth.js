'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getCompany } from '@/lib/store';

export default function useAuth(requireCompany = false) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace('/login');
      return;
    }

    if (requireCompany) {
      const c = getCompany();
      if (!c) {
        router.replace('/companies');
        return;
      }
      setCompany(c);
    }

    setReady(true);
  }, []);

  return { ready, company };
}