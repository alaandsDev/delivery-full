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
  whatsappNumber?: string;
  deliveryFee?: number;
  minOrderCents?: number;
  openingHours?: string;
};

// Helpers com try-catch — localStorage lança em Safari privado e Android antigo
const SCHEMA = 'v1';

function lsGet(key: string): string | null {
  try { return localStorage.getItem(`${key}:${SCHEMA}`); } catch { return null; }
}

function lsSet(key: string, value: string): void {
  try { localStorage.setItem(`${key}:${SCHEMA}`, value); } catch {}
}

function lsRemove(key: string): void {
  try { localStorage.removeItem(`${key}:${SCHEMA}`); } catch {}
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [store, setStore] = useState<AuthStore | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(safeParse<AuthUser>(lsGet('pm_user')));
    setStore(safeParse<AuthStore>(lsGet('pm_store')));
    setToken(lsGet('pm_access_token'));
    setReady(true);
  }, []);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
    const userId = user?.id;
    if (!ready || !userId || !token || !apiUrl) return;

    let cancelled = false;

    async function syncStore() {
      try {
        const res = await fetch(`${apiUrl}/stores/by-owner/${userId}`);
        if (!res.ok) return;
        const freshStore: AuthStore = await res.json();
        if (cancelled) return;

        if (freshStore?.id) {
          setStore(freshStore);
          lsSet('pm_store', JSON.stringify(freshStore));
        } else {
          setStore(null);
          lsRemove('pm_store');
        }
      } catch {
        // mantém estado atual; erro transitório de rede
      }
    }

    void syncStore();
    return () => { cancelled = true; };
  }, [ready, user?.id, token]);

  function logout() {
    lsRemove('pm_user');
    lsRemove('pm_store');
    lsRemove('pm_access_token');
    window.location.href = '/login';
  }

  const trialExpired =
    user?.trialEndsAt ? new Date(user.trialEndsAt).getTime() < Date.now() : false;

  const trialDaysLeft = user?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  return { user, store, token, ready, logout, trialExpired, trialDaysLeft };
}

// Helpers exportados para uso em login/cadastro
export { lsSet, lsRemove, lsGet };
