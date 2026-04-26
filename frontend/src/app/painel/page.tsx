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
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <a href="/assinar" className="painel-nav-item" style={{ color: 'var(--laranja)', fontWeight: 600 }}>⭐ Planos</a>
          <button className="painel-logout" onClick={logout}>Sair →</button>
        </div>
      </aside>

      <main className="painel-content">
        <div className="painel-topbar">
          <div>
            <h1 className="painel-page-title">Olá, {user.name.split(' ')[0]} 👋</h1>
            <p style={{ color: '#888', fontSize: 14 }}>{store.name}</p>
          </div>
          {trialExpired ? (
            <a href="/assinar" className="painel-badge danger" style={{ textDecoration: 'none' }}>Trial expirado — Assinar agora →</a>
          ) : (
            <a href="/assinar" className="painel-badge" style={{ textDecoration: 'none' }}>
              {trialDaysLeft} dia{trialDaysLeft !== 1 ? 's' : ''} de trial — Ver planos
            </a>
          )}
        </div>

        {trialExpired && (
          <div className="painel-alert danger">
            ⚠️ Seu período de teste expirou. Para continuar recebendo pedidos,{' '}
            <a href="/assinar" style={{ color: '#c62828', fontWeight: 600 }}>assine um plano agora</a>.
          </div>
        )}

        {!trialExpired && trialDaysLeft <= 1 && (
          <div className="painel-alert">
            ⏳ Seu trial acaba {trialDaysLeft === 0 ? 'hoje' : 'amanhã'}!{' '}
            <a href="/assinar" style={{ color: 'var(--laranja)', fontWeight: 600 }}>Assine agora para não perder pedidos →</a>
          </div>
        )}

        <div className="painel-cards">
          <div className="painel-card">
            <p className="painel-card-label">Cardápio público</p>
            <p style={{ fontSize: 13, color: '#888', wordBreak: 'break-all', margin: '4px 0 12px' }}>{cardapioUrl}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={cardapioUrl} target="_blank" rel="noopener noreferrer" className="painel-btn-sm">Ver cardápio ↗</a>
              <button className="painel-btn-sm ghost" onClick={() => navigator.clipboard.writeText(cardapioUrl)}>Copiar link</button>
            </div>
          </div>

          <div className="painel-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p className="painel-card-label">Atalhos rápidos</p>
            <a href="/painel/pedidos" className="painel-quicklink">📋 Ver pedidos em aberto</a>
            <a href="/painel/produtos" className="painel-quicklink">➕ Adicionar produto</a>
            <a href="/assinar" className="painel-quicklink">⭐ Ver planos e assinar</a>
          </div>
        </div>
      </main>
    </div>
  );
}
