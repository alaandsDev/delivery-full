'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import dynamic from 'next/dynamic';

const FinanceCharts = dynamic(
  () => import('@/components/financeiro/FinanceCharts'),
  {
    ssr: false,
    loading: () => (
      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', padding: 40 }}>
        <div className="cardapio-spinner" />
      </div>
    ),
  },
);

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

type FinanceResponse = {
  periodDays: number;
  store: { id: string; name: string; slug: string };
  summary: {
    grossSalesCents: number;
    deliveredSalesCents: number;
    paidSalesCents: number;
    pendingSalesCents: number;
    canceledSalesCents: number;
    ordersCount: number;
    deliveredOrdersCount: number;
    canceledOrdersCount: number;
    averageTicketCents: number;
  };
  dailySeries: Array<{
    date: string;
    grossCents: number;
    deliveredCents: number;
    paidCents: number;
    orders: number;
  }>;
};

function money(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function brDate(isoDate: string) {
  const [_, m, d] = isoDate.split('-');
  return `${d}/${m}`;
}

export default function FinanceiroPage() {
  const { ready, user, store, token } = useAuth();
  const [periodDays, setPeriodDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FinanceResponse | null>(null);

  useEffect(() => {
    if (ready && !user) window.location.href = '/login';
  }, [ready, user]);

  const fetchData = useCallback(async () => {
    if (!token || !store?.id) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/finance/summary?days=${periodDays}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const msg = typeof payload?.message === 'string' ? payload.message : 'Erro ao carregar financeiro';
        throw new Error(msg);
      }

      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar financeiro');
    } finally {
      setLoading(false);
    }
  }, [periodDays, store?.id, token]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const bestDay = useMemo(() => {
    if (!data?.dailySeries?.length) return null;
    return [...data.dailySeries].sort((a, b) => b.grossCents - a.grossCents)[0];
  }, [data]);

  const chartLabels = useMemo(() => data?.dailySeries.map((row) => brDate(row.date)) ?? [], [data]);

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
          <a href="/painel/pedidos" className="painel-nav-item">Pedidos</a>
          <a href="/painel/produtos" className="painel-nav-item">Produtos</a>
          <a href="/painel/financeiro" className="painel-nav-item active">Financeiro</a>
        </nav>
      </aside>

      <main className="painel-content">
        <div className="painel-topbar">
          <div>
            <h1 className="painel-page-title">Financeiro</h1>
            <p style={{ color: '#888', fontSize: 14 }}>Relatorios financeiros da loja {store.name}</p>
          </div>
          <div className="painel-filter-row" style={{ marginBottom: 0 }}>
            {[7, 30, 90].map((d) => (
              <button key={d} className={`painel-filter-btn${periodDays === d ? ' active' : ''}`} onClick={() => setPeriodDays(d)}>
                {d} dias
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="painel-loading" style={{ minHeight: 260 }}>
            <div className="cardapio-spinner" />
          </div>
        )}

        {error && <div className="painel-alert danger">{error}</div>}

        {!loading && data && (
          <>
            <div className="painel-cards">
              <div className="painel-card">
                <p className="painel-card-label">Faturamento Bruto</p>
                <p className="painel-card-value">{money(data.summary.grossSalesCents)}</p>
              </div>
              <div className="painel-card">
                <p className="painel-card-label">Recebido</p>
                <p className="painel-card-value">{money(data.summary.paidSalesCents)}</p>
              </div>
              <div className="painel-card">
                <p className="painel-card-label">Pendente</p>
                <p className="painel-card-value">{money(data.summary.pendingSalesCents)}</p>
              </div>
              <div className="painel-card">
                <p className="painel-card-label">Ticket Medio</p>
                <p className="painel-card-value">{money(data.summary.averageTicketCents)}</p>
              </div>
              <div className="painel-card">
                <p className="painel-card-label">Pedidos Totais</p>
                <p className="painel-card-value">{data.summary.ordersCount}</p>
              </div>
              <div className="painel-card">
                <p className="painel-card-label">Cancelados</p>
                <p className="painel-card-value">{data.summary.canceledOrdersCount}</p>
              </div>
            </div>

            <div className="finance-charts-grid">
              <FinanceCharts
                chartLabels={chartLabels}
                dailySeries={data.dailySeries}
                summary={data.summary}
              />
            </div>

            {bestDay && (
              <div className="painel-alert" style={{ marginTop: 16 }}>
                Melhor dia no periodo: <strong>{brDate(bestDay.date)}</strong> com <strong>{money(bestDay.grossCents)}</strong> em vendas.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
