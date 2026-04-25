'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function PainelPage() {
  const { user, store, ready, logout, trialDaysLeft, trialExpired } = useAuth();

  useEffect(() => {
    if (ready && !user) window.location.href = '/login';
  }, [ready, user]);

  if (!ready || !user || !store) return <div className="painel-loading"><div className="cardapio-spinner" /></div>;

  const cardapioUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/loja/${store.slug}`;

  return (
    <div className="painel-layout">
      <aside className="painel-sidebar">
        <a href="/" className="logo" style={{ textDecoration: 'none', fontSize: 20, display: 'block', marginBottom: 32 }}>
          Pede<span style={{ color: 'var(--preto)' }}>Mais</span>
        </a>
        <nav className="painel-nav">
          <a href="/painel" className="painel-nav-item active">🏠 Início</a>
          <a href="/painel/pedidos" className="painel-nav-item">📋 Pedidos</a>
          <a href="/painel/produtos" className="painel-nav-item">🍔 Produtos</a>
        </nav>
        <button className="painel-logout" onClick={logout}>Sair →</button>
      </aside>

      <main className="painel-content">
        <div className="painel-topbar">
          <div>
            <h1 className="painel-page-title">Olá, {user.name.split(' ')[0]} 👋</h1>
            <p style={{ color: '#888', fontSize: 14 }}>{store.name}</p>
          </div>
          {trialExpired ? (
            <span className="painel-badge danger">Trial expirado</span>
          ) : (
            <span className="painel-badge">{trialDaysLeft} dia{trialDaysLeft !== 1 ? 's' : ''} de trial</span>
          )}
        </div>

        {trialExpired && (
          <div className="painel-alert danger">
            ⚠️ Seu período de teste expirou. Para continuar recebendo pedidos, assine um plano.
          </div>
        )}

        <div className="painel-cards">
          <div className="painel-card">
            <p className="painel-card-label">Cardápio público</p>
            <p className="painel-card-value" style={{ fontSize: 14, wordBreak: 'break-all' }}>{cardapioUrl}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <a href={cardapioUrl} target="_blank" rel="noopener noreferrer" className="painel-btn-sm">Ver cardápio ↗</a>
              <button className="painel-btn-sm ghost" onClick={() => navigator.clipboard.writeText(cardapioUrl)}>Copiar link</button>
            </div>
          </div>

          <div className="painel-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p className="painel-card-label">Atalhos rápidos</p>
            <a href="/painel/pedidos" className="painel-quicklink">📋 Ver pedidos em aberto</a>
            <a href="/painel/produtos" className="painel-quicklink">➕ Adicionar produto</a>
          </div>
        </div>
      </main>
    </div>
  );
}
