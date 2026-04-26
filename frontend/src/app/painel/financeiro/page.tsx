'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
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

  const revenueLineData = useMemo(() => {
    return {
      labels: chartLabels,
      datasets: [
        {
          label: 'Bruto',
          data: data?.dailySeries.map((row) => row.grossCents / 100) ?? [],
          borderColor: '#ff4d00',
          backgroundColor: 'rgba(255,77,0,0.18)',
          fill: true,
          tension: 0.35,
          pointRadius: 2,
        },
        {
          label: 'Recebido',
          data: data?.dailySeries.map((row) => row.paidCents / 100) ?? [],
          borderColor: '#00c853',
          backgroundColor: 'rgba(0,200,83,0.10)',
          fill: false,
          tension: 0.35,
          pointRadius: 2,
        },
      ],
    };
  }, [data, chartLabels]);

  const ordersBarData = useMemo(() => {
    return {
      labels: chartLabels,
      datasets: [
        {
          label: 'Pedidos',
          data: data?.dailySeries.map((row) => row.orders) ?? [],
          backgroundColor: 'rgba(13,13,13,0.8)',
          borderRadius: 6,
        },
      ],
    };
  }, [data, chartLabels]);

  const compositionData = useMemo(() => {
    return {
      labels: ['Recebido', 'Pendente', 'Cancelado'],
      datasets: [
        {
          data: [
            (data?.summary.paidSalesCents ?? 0) / 100,
            (data?.summary.pendingSalesCents ?? 0) / 100,
            (data?.summary.canceledSalesCents ?? 0) / 100,
          ],
          backgroundColor: ['#00c853', '#ffb300', '#c62828'],
          borderWidth: 0,
        },
      ],
    };
  }, [data]);

  const moneyTicks = {
    callback: (value: any) =>
      Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }),
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const } },
    scales: { y: { ticks: moneyTicks } },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const } },
  };

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
              <div className="painel-card">
                <p className="painel-card-label">Faturamento Diario</p>
                <div className="finance-chart-box">
                  <Line data={revenueLineData} options={lineOptions} />
                </div>
              </div>

              <div className="painel-card">
                <p className="painel-card-label">Pedidos por Dia</p>
                <div className="finance-chart-box">
                  <Bar data={ordersBarData} options={barOptions} />
                </div>
              </div>

              <div className="painel-card finance-chart-card-full">
                <p className="painel-card-label">Composicao Financeira</p>
                <div className="finance-chart-box doughnut">
                  <Doughnut data={compositionData} options={doughnutOptions} />
                </div>
              </div>
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
