'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

type Order = { id: string; status: string; totalCents: number; createdAt: string; customerName: string };

function fmt(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function PainelPage() {
  const { user, store, token, ready, logout, trialDaysLeft, trialExpired } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (ready && !user) window.location.href = '/login';
  }, [ready, user]);

  const fetchOrders = useCallback(async () => {
    if (!store || !token) return;
    try {
      const res = await fetch(`${API}/orders?storeId=${store.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setOrders(await res.json());
    } finally {
      setLoadingOrders(false);
    }
  }, [store, token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  if (!ready) return <div className="painel-loading"><div className="cardapio-spinner" /></div>;
  if (!user || !store) return <div className="painel-loading"><div className="cardapio-spinner" /></div>;

  const cardapioUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/loja/${store.slug}`;
  const firstName = user?.name?.split(' ')[0] ?? '';

  // Stats calculadas
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const todayRevenue = todayOrders.filter(o => o.status !== 'CANCELED').reduce((s, o) => s + o.totalCents, 0);
  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  const totalRevenue = orders.filter(o => o.status !== 'CANCELED').reduce((s, o) => s + o.totalCents, 0);
  const recentOrders = orders.slice(0, 5);

  const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Pendente', CONFIRMED: 'Confirmado', PREPARING: 'Preparando',
    OUT_FOR_DELIVERY: 'Saiu p/ entrega', DELIVERED: 'Entregue', CANCELED: 'Cancelado',
  };
  const STATUS_COLOR: Record<string, string> = {
    PENDING: '#f59e0b', CONFIRMED: '#3b82f6', PREPARING: '#8b5cf6',
    OUT_FOR_DELIVERY: '#06b6d4', DELIVERED: '#10b981', CANCELED: '#ef4444',
  };

  return (
    <div className="painel-layout">
      <aside className="painel-sidebar">
        <a href="/" className="logo" style={{ textDecoration: 'none', fontSize: 20, display: 'block', marginBottom: 40 }}>
          Pede<span>Mais</span>
        </a>
        <nav className="painel-nav">
          <a href="/painel" className="painel-nav-item active">
            <span className="pni-icon">🏠</span> Início
          </a>
          <a href="/painel/pedidos" className="painel-nav-item">
            <span className="pni-icon">📋</span> Pedidos
            {pendingOrders.length > 0 && <span className="pni-badge">{pendingOrders.length}</span>}
          </a>
          <a href="/painel/produtos" className="painel-nav-item">
            <span className="pni-icon">🍔</span> Produtos
          </a>
        </nav>
        <div className="painel-sidebar-footer">
          <a href="/assinar" className="painel-nav-item" style={{ color: 'var(--laranja)' }}>
            <span className="pni-icon">⭐</span> Planos
          </a>
          <div className="painel-user-info">
            <div className="painel-user-avatar">{firstName[0]}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{user.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{user.email}</div>
            </div>
          </div>
          <button className="painel-logout" onClick={logout}>Sair →</button>
        </div>
      </aside>

      <main className="painel-content">
        {/* Topbar */}
        <div className="painel-topbar">
          <div>
            <h1 className="painel-page-title">Olá, {firstName} 👋</h1>
            <p style={{ color: '#888', fontSize: 14, marginTop: 2 }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          {trialExpired
            ? <a href="/assinar" className="painel-badge danger" style={{ textDecoration: 'none' }}>Trial expirado — Assinar →</a>
            : <a href="/assinar" className="painel-badge" style={{ textDecoration: 'none' }}>⏳ {trialDaysLeft} dia{trialDaysLeft !== 1 ? 's' : ''} de trial</a>
          }
        </div>

        {trialExpired && (
          <div className="painel-alert danger" style={{ marginBottom: 24 }}>
            ⚠️ Seu período de teste expirou.{' '}
            <a href="/assinar" style={{ color: '#c62828', fontWeight: 600 }}>Assine para continuar recebendo pedidos →</a>
          </div>
        )}

        {/* Stats */}
        <div className="painel-stats-grid">
          <div className="painel-stat-card">
            <div className="painel-stat-icon" style={{ background: '#fff0eb' }}>📦</div>
            <div>
              <p className="painel-stat-label">Pedidos hoje</p>
              <p className="painel-stat-value">{loadingOrders ? '—' : todayOrders.length}</p>
            </div>
          </div>
          <div className="painel-stat-card">
            <div className="painel-stat-icon" style={{ background: '#ebfff3' }}>💰</div>
            <div>
              <p className="painel-stat-label">Faturado hoje</p>
              <p className="painel-stat-value">{loadingOrders ? '—' : fmt(todayRevenue)}</p>
            </div>
          </div>
          <div className="painel-stat-card">
            <div className="painel-stat-icon" style={{ background: '#fff8eb' }}>⏳</div>
            <div>
              <p className="painel-stat-label">Pendentes</p>
              <p className="painel-stat-value" style={{ color: pendingOrders.length > 0 ? '#f59e0b' : undefined }}>
                {loadingOrders ? '—' : pendingOrders.length}
              </p>
            </div>
          </div>
          <div className="painel-stat-card">
            <div className="painel-stat-icon" style={{ background: '#f0ebff' }}>📈</div>
            <div>
              <p className="painel-stat-label">Total acumulado</p>
              <p className="painel-stat-value">{loadingOrders ? '—' : fmt(totalRevenue)}</p>
            </div>
          </div>
        </div>

        {/* Cardápio + Recentes */}
        <div className="painel-bottom-grid">
          <div className="painel-card">
            <p className="painel-card-label">Seu cardápio público</p>
            <div className="painel-cardapio-preview">
              <div className="painel-cardapio-url">{cardapioUrl}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <a href={cardapioUrl} target="_blank" rel="noopener noreferrer" className="painel-btn-sm">Abrir ↗</a>
                <button className="painel-btn-sm ghost" onClick={() => { navigator.clipboard.writeText(cardapioUrl); }}>Copiar link</button>
              </div>
            </div>
            <div className="painel-divider" />
            <p className="painel-card-label">Atalhos</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              <a href="/painel/pedidos" className="painel-quicklink">📋 Gerenciar pedidos</a>
              <a href="/painel/produtos" className="painel-quicklink">➕ Adicionar produto</a>
            </div>
          </div>

          <div className="painel-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p className="painel-card-label">Últimos pedidos</p>
              <a href="/painel/pedidos" className="painel-btn-sm ghost">Ver todos</a>
            </div>
            {loadingOrders ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><div className="cardapio-spinner" /></div>
            ) : recentOrders.length === 0 ? (
              <div className="painel-empty-state">
                <p>🛒</p>
                <p>Nenhum pedido ainda.</p>
                <p style={{ fontSize: 13 }}>Compartilhe o link do seu cardápio para começar!</p>
              </div>
            ) : (
              <div className="painel-orders-list">
                {recentOrders.map(order => (
                  <div key={order.id} className="painel-order-row">
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{order.customerName}</p>
                      <p style={{ fontSize: 12, color: '#888' }}>{fmt(order.totalCents)}</p>
                    </div>
                    <span className="painel-order-status" style={{ background: STATUS_COLOR[order.status] + '20', color: STATUS_COLOR[order.status] }}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
