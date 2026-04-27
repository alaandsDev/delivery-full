'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStoreSocket } from '@/hooks/useStoreSocket';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

type OrderItem = { id: string; name: string; quantity: number; unitPriceCents: number };
type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  status: string;
  totalCents: number;
  items: OrderItem[];
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  OUT_FOR_DELIVERY: 'Saiu p/ entrega',
  DELIVERED: 'Entregue',
  CANCELED: 'Cancelado',
};

const STATUS_NEXT: Record<string, string | null> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
  DELIVERED: null,
  CANCELED: null,
};

const STATUS_NEXT_LABEL: Record<string, string> = {
  PENDING: 'Confirmar',
  CONFIRMED: 'Iniciar preparo',
  PREPARING: 'Saiu para entrega',
  OUT_FOR_DELIVERY: 'Marcar entregue',
};

function fmt(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PedidosPage() {
  const { user, store, token, ready } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !user) window.location.href = '/login';
  }, [ready, user]);

  const authHeaders = useCallback(
    () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }),
    [token],
  );

  const fetchOrders = useCallback(async () => {
    if (!store || !token) return;
    const res = await fetch(`${API}/orders?storeId=${store.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  }, [store, token]);

  useEffect(() => {
    if (store && token) fetchOrders();
  }, [store, token, fetchOrders]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  }

  useStoreSocket({
    storeId: store?.id,
    token,
    onNewOrder: (order) => {
      setOrders((prev) => {
        if (prev.find((o) => o.id === order.id)) return prev;
        return [order as unknown as Order, ...prev];
      });
      showToast(`Novo pedido de ${order.customerName} - ${fmt(order.totalCents)}`);
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } catch {
      }
    },
    onOrderUpdated: (order) => {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...order } : o)));
    },
  });

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdating(orderId);
    await fetch(`${API}/orders/${orderId}/status/${newStatus}`, {
      method: 'PATCH',
      headers: authHeaders(),
    });
    await fetchOrders();
    setUpdating(null);
  }

  async function cancelOrder(orderId: string) {
    if (!confirm('Cancelar este pedido?')) return;
    await updateStatus(orderId, 'CANCELED');
  }

  const filtered = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);
  const activeCount = orders.filter((o) => !['DELIVERED', 'CANCELED'].includes(o.status)).length;

  if (!ready || !user || !store) {
    return (
      <div className="painel-loading">
        <div className="cardapio-spinner" />
      </div>
    );
  }

  return (
    <div className="painel-layout">
      <aside className="painel-sidebar">
        <a href="/" className="logo" style={{ textDecoration: 'none', fontSize: 20, display: 'block', marginBottom: 32 }}>
          Pede<span style={{ color: 'var(--preto)' }}>Mais</span>
        </a>
        <nav className="painel-nav">
          <a href="/painel" className="painel-nav-item">Inicio</a>
          <a href="/painel/pedidos" className="painel-nav-item active">Pedidos</a>
          <a href="/painel/produtos" className="painel-nav-item">Produtos</a>
          <a href="/painel/financeiro" className="painel-nav-item">Financeiro</a>
        </nav>
      </aside>

      <main className="painel-content">
        {toast && <div className="painel-toast">{toast}</div>}

        <div className="painel-topbar">
          <div>
            <h1 className="painel-page-title">Pedidos</h1>
            {activeCount > 0 && <span className="painel-badge">{activeCount} em aberto</span>}
          </div>
          <button className="painel-btn-sm" onClick={fetchOrders}>Atualizar</button>
        </div>

        <div className="painel-filter-row">
          {['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELED'].map((s) => (
            <button key={s} className={`painel-filter-btn${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'ALL' ? 'Todos' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="painel-loading"><div className="cardapio-spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="painel-empty">
            <p style={{ fontSize: 36 }}>-</p>
            <p>Nenhum pedido {filter !== 'ALL' ? STATUS_LABELS[filter]?.toLowerCase() : ''} ainda.</p>
          </div>
        ) : (
          <div className="pedidos-list">
            {filtered.map((order) => (
              <div key={order.id} className={`pedido-card status-${order.status.toLowerCase()}`}>
                <div className="pedido-card-top">
                  <div>
                    <p className="pedido-customer">{order.customerName}</p>
                    <p className="pedido-phone">{order.customerPhone}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`pedido-status-badge ${order.status.toLowerCase()}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                    <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{fmtDate(order.createdAt)}</p>
                  </div>
                </div>
                <div className="pedido-items">
                  {order.items?.map((item) => (
                    <div key={item.id} className="pedido-item-line">
                      <span>{item.quantity}x {item.name}</span>
                      <span>{fmt(item.unitPriceCents * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="pedido-card-footer">
                  <span className="pedido-total">{fmt(order.totalCents)}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {STATUS_NEXT[order.status] && (
                      <button className="painel-btn-sm" disabled={updating === order.id} onClick={() => updateStatus(order.id, STATUS_NEXT[order.status]!)}>
                        {updating === order.id ? '...' : STATUS_NEXT_LABEL[order.status]}
                      </button>
                    )}
                    {!['DELIVERED', 'CANCELED'].includes(order.status) && (
                      <button className="painel-btn-sm danger" disabled={updating === order.id} onClick={() => cancelOrder(order.id)}>
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}