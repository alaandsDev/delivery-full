'use client';

import { useEffect, useState } from 'react';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  trialEndsAt: string | null;
};

export type AuthStore = {
  id: string;
  name: string;
  slug: string;
  description?: string;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [store, setStore] = useState<AuthStore | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const rawUser = localStorage.getItem('pm_user');
    const rawStore = localStorage.getItem('pm_store');
    const rawToken = localStorage.getItem('pm_access_token');
    if (rawUser) setUser(JSON.parse(rawUser));
    if (rawStore) setStore(JSON.parse(rawStore));
    if (rawToken) setToken(rawToken);
    setReady(true);
  }, []);

  function logout() {
    localStorage.removeItem('pm_user');
    localStorage.removeItem('pm_store');
    localStorage.removeItem('pm_access_token');
    window.location.href = '/login';
  }

  const trialExpired =
    user?.trialEndsAt ? new Date(user.trialEndsAt).getTime() < Date.now() : false;

  const trialDaysLeft = user?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  return { user, store, token, ready, logout, trialExpired, trialDaysLeft };
}
