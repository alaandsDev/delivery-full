'use client';

import { useEffect, useState } from 'react';

type SavedUser = {
  name: string;
  email: string;
  trialEndsAt: string | null;
};

type SavedStore = {
  name: string;
  slug: string;
};

export default function PainelPage() {
  const [user, setUser] = useState<SavedUser | null>(null);
  const [store, setStore] = useState<SavedStore | null>(null);

  useEffect(() => {
    const rawUser = localStorage.getItem('pm_user');
    const rawStore = localStorage.getItem('pm_store');
    if (rawUser) setUser(JSON.parse(rawUser));
    if (rawStore) setStore(JSON.parse(rawStore));
  }, []);

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

        <a className="btn-primary" href="/">
          Voltar para landing
        </a>
      </section>
    </main>
  );
}

