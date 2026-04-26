'use client';

import Link from 'next/link';
import { useState } from 'react';

type SavedUser = {
  name: string;
  email: string;
  trialEndsAt: string | null;
};

type SavedStore = {
  name: string;
  slug: string;
};

function readStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function PainelPage() {
  const [user] = useState<SavedUser | null>(() => readStorage<SavedUser>('pm_user'));
  const [store] = useState<SavedStore | null>(() => readStorage<SavedStore>('pm_store'));

  return (
    <main className="cadastro-page">
      <section className="cadastro-card">
        <h1>Painel do Lojista</h1>
        <p>Conta criada com sucesso.</p>

        <div className="painel-box">
          <p>
            <strong>Usuario:</strong>
            {' '}
            {user?.name ?? '-'}
          </p>
          <p>
            <strong>Email:</strong>
            {' '}
            {user?.email ?? '-'}
          </p>
          <p>
            <strong>Loja:</strong>
            {' '}
            {store?.name ?? '-'}
          </p>
          <p>
            <strong>Slug:</strong>
            {' '}
            {store?.slug ?? '-'}
          </p>
          <p>
            <strong>Trial ate:</strong>
            {' '}
            {user?.trialEndsAt ? new Date(user.trialEndsAt).toLocaleString('pt-BR') : '-'}
          </p>
        </div>

        <Link className="btn-primary" href="/">
          Voltar para landing
        </Link>
      </section>
    </main>
  );
}
