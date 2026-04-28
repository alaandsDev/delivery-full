'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

type Customer = { id: string; name: string; phone: string; address?: string; createdAt: string };

function fmtPhone(phone: string) {
  const d = phone.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return phone;
}

export default function ClientesPage() {
  const { user, store, token, ready } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { if (ready && !user) window.location.href = '/login'; }, [ready, user]);

  const fetchCustomers = useCallback(async () => {
    if (!store || !token) return;
    const res = await fetch(`${API}/customers?storeId=${store.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setCustomers(await res.json());
    setLoading(false);
  }, [store, token]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search.replace(/\D/g, ''))
  );

  if (!ready || !user || !store) return <div className="painel-loading"><div className="cardapio-spinner" /></div>;

  return (
    <div className="painel-layout">
      <aside className="painel-sidebar">
        <a href="/" className="logo" style={{ textDecoration: 'none', fontSize: 20, display: 'block', marginBottom: 40 }}>
          Pede<span>Mais</span>
        </a>
        <nav className="painel-nav">
          <a href="/painel" className="painel-nav-item">🏠 Início</a>
          <a href="/painel/pedidos" className="painel-nav-item">📋 Pedidos</a>
          <a href="/painel/produtos" className="painel-nav-item">🍔 Produtos</a>
          <a href="/painel/financeiro" className="painel-nav-item">📊 Financeiro</a>
          <a href="/painel/clientes" className="painel-nav-item active">👥 Clientes</a>
          <a href="/painel/configuracoes" className="painel-nav-item">⚙️ Configurações</a>
        </nav>
        <div className="painel-sidebar-footer">
          <a href="/assinar" className="painel-nav-item" style={{ color: 'var(--laranja)' }}>⭐ Planos</a>
        </div>
      </aside>

      <main className="painel-content">
        <div className="painel-topbar">
          <div>
            <h1 className="painel-page-title">Clientes</h1>
            {!loading && <p style={{ color: '#888', fontSize: 14, marginTop: 2 }}>{customers.length} cadastrado{customers.length !== 1 ? 's' : ''}</p>}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <input
            className="cardapio-input"
            style={{ maxWidth: 360 }}
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="painel-loading"><div className="cardapio-spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="painel-empty">
            <p style={{ fontSize: 36 }}>👥</p>
            <p>{search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente ainda. Os clientes aparecem aqui quando fazem o primeiro pedido.'}</p>
          </div>
        ) : (
          <div className="clientes-grid">
            {filtered.map(c => (
              <div key={c.id} className="cliente-card">
                <div className="cliente-avatar">{c.name[0].toUpperCase()}</div>
                <div className="cliente-info">
                  <p className="cliente-name">{c.name}</p>
                  <p className="cliente-phone">📱 {fmtPhone(c.phone)}</p>
                  {c.address && <p className="cliente-address">📍 {c.address}</p>}
                </div>
                <a
                  href={`https://wa.me/55${c.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="painel-btn-sm ghost"
                  style={{ flexShrink: 0 }}
                >
                  WhatsApp
                </a>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
