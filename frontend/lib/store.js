// ── Token helpers ──────────────────────────────────────────
export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

export const setToken = (t) => {
  if (typeof window !== 'undefined')
    localStorage.setItem('token', t);
};

// ── Active company helpers ──────────────────────────────────
export const getCompany = () => {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem('company') || 'null');
  } catch {
    return null;
  }
};

export const setCompany = (c) => {
  if (typeof window !== 'undefined')
    localStorage.setItem('company', JSON.stringify(c));
};

// ── User helpers ────────────────────────────────────────────
export const getUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

export const setUser = (u) => {
  if (typeof window !== 'undefined')
    localStorage.setItem('user', JSON.stringify(u));
};

// ── Logout ──────────────────────────────────────────────────
export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.clear();
    window.location.href = '/login';
  }
};