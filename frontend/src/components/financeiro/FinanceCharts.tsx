'use client';

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

type DailySeries = Array<{
  date: string;
  grossCents: number;
  deliveredCents: number;
  paidCents: number;
  orders: number;
}>;

type Summary = {
  paidSalesCents: number;
  pendingSalesCents: number;
  canceledSalesCents: number;
};

interface FinanceChartsProps {
  chartLabels: string[];
  dailySeries: DailySeries;
  summary: Summary;
}

const moneyTicks = {
  callback: (value: string | number) =>
    Number(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }),
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

export default function FinanceCharts({ chartLabels, dailySeries, summary }: FinanceChartsProps) {
  const revenueLineData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Bruto',
        data: dailySeries.map((row) => row.grossCents / 100),
        borderColor: '#ff4d00',
        backgroundColor: 'rgba(255,77,0,0.18)',
        fill: true,
        tension: 0.35,
        pointRadius: 2,
      },
      {
        label: 'Recebido',
        data: dailySeries.map((row) => row.paidCents / 100),
        borderColor: '#00c853',
        backgroundColor: 'rgba(0,200,83,0.10)',
        fill: false,
        tension: 0.35,
        pointRadius: 2,
      },
    ],
  };

  const ordersBarData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Pedidos',
        data: dailySeries.map((row) => row.orders),
        backgroundColor: 'rgba(13,13,13,0.8)',
        borderRadius: 6,
      },
    ],
  };

  const compositionData = {
    labels: ['Recebido', 'Pendente', 'Cancelado'],
    datasets: [
      {
        data: [
          summary.paidSalesCents / 100,
          summary.pendingSalesCents / 100,
          summary.canceledSalesCents / 100,
        ],
        backgroundColor: ['#00c853', '#ffb300', '#c62828'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <>
      <div className="painel-card" style={{ gridColumn: '1 / -1' }}>
        <p className="painel-card-label">Receita diária</p>
        <div style={{ height: 240 }}>
          <Line data={revenueLineData} options={lineOptions} />
        </div>
      </div>

      <div className="painel-card">
        <p className="painel-card-label">Pedidos por dia</p>
        <div style={{ height: 200 }}>
          <Bar data={ordersBarData} options={barOptions} />
        </div>
      </div>

      <div className="painel-card">
        <p className="painel-card-label">Composição de receita</p>
        <div style={{ height: 200 }}>
          <Doughnut data={compositionData} options={doughnutOptions} />
        </div>
      </div>
    </>
  );
}
