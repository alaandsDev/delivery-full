'use client';

<<<<<<< HEAD
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
=======
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function PainelPage() {
  const { user, store, ready, logout, trialDaysLeft, trialExpired } = useAuth();

  useEffect(() => {
    if (ready && !user) window.location.href = '/login';
  }, [ready, user]);

  if (!ready || !user || !store) {
    return (
      <div className="painel-loading">
        <div className="cardapio-spinner" />
      </div>
    );
  }

  const cardapioUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/loja/${store.slug}`;
  const firstName = user.name ? user.name.split(' ')[0] : '';
>>>>>>> 27588b6e7ed601f3b891c6c8c346986ac447d192

  return (
    <div className="painel-layout">
      <aside className="painel-sidebar">
        <a href="/" className="logo" style={{ textDecoration: 'none', fontSize: 20, display: 'block', marginBottom: 32 }}>
          Pede<span style={{ color: 'var(--preto)' }}>Mais</span>
        </a>

        <nav className="painel-nav">
          <a href="/painel" className="painel-nav-item active">Inicio</a>
          <a href="/painel/pedidos" className="painel-nav-item">Pedidos</a>
          <a href="/painel/produtos" className="painel-nav-item">Produtos</a>
          <a href="/painel/financeiro" className="painel-nav-item">Financeiro</a>
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <a href="/assinar" className="painel-nav-item" style={{ color: 'var(--laranja)', fontWeight: 600 }}>Planos</a>
          <button className="painel-logout" onClick={logout}>Sair</button>
        </div>
      </aside>

      <main className="painel-content">
        <div className="painel-topbar">
          <div>
            <h1 className="painel-page-title">Ola, {firstName}</h1>
            <p style={{ color: '#888', fontSize: 14 }}>{store.name}</p>
          </div>

          {trialExpired ? (
            <a href="/assinar" className="painel-badge danger" style={{ textDecoration: 'none' }}>
              Trial expirado - Assinar agora
            </a>
          ) : (
            <a href="/assinar" className="painel-badge" style={{ textDecoration: 'none' }}>
              {trialDaysLeft} dia{trialDaysLeft !== 1 ? 's' : ''} de trial - Ver planos
            </a>
          )}
        </div>

<<<<<<< HEAD
        <Link className="btn-primary" href="/">
          Voltar para landing
        </Link>
      </section>
    </main>
=======
        {trialExpired && (
          <div className="painel-alert danger">
            Seu periodo de teste expirou.{' '}
            <a href="/assinar" style={{ color: '#c62828', fontWeight: 600 }}>Assine um plano agora</a>
          </div>
        )}

        {!trialExpired && trialDaysLeft <= 1 && (
          <div className="painel-alert">
            Seu trial acaba {trialDaysLeft === 0 ? 'hoje' : 'amanha'}!{' '}
            <a href="/assinar" style={{ color: 'var(--laranja)', fontWeight: 600 }}>Assine agora</a>
          </div>
        )}

        <div className="painel-cards">
          <div className="painel-card">
            <p className="painel-card-label">Cardapio publico</p>
            <p style={{ fontSize: 13, color: '#888', wordBreak: 'break-all', margin: '4px 0 12px' }}>{cardapioUrl}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a href={cardapioUrl} target="_blank" rel="noopener noreferrer" className="painel-btn-sm">Ver cardapio</a>
              <button className="painel-btn-sm ghost" onClick={() => navigator.clipboard.writeText(cardapioUrl)}>Copiar link</button>
            </div>
          </div>

          <div className="painel-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p className="painel-card-label">Atalhos rapidos</p>
            <a href="/painel/pedidos" className="painel-quicklink">Ver pedidos em aberto</a>
            <a href="/painel/produtos" className="painel-quicklink">Adicionar produto</a>
            <a href="/painel/financeiro" className="painel-quicklink">Ver resumo financeiro</a>
            <a href="/assinar" className="painel-quicklink">Ver planos e assinar</a>
          </div>
        </div>
      </main>
    </div>
>>>>>>> 27588b6e7ed601f3b891c6c8c346986ac447d192
  );
}
