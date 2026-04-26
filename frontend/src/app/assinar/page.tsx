'use client';

import { useAuth } from '@/hooks/useAuth';

const PLANOS = [
  {
    id: 'basico',
    nome: 'Básico',
    preco: 'R$ 49',
    periodo: '/mês',
    descricao: 'Perfeito pra começar',
    destaque: false,
    features: [
      '1 loja',
      'Cardápio digital ilimitado',
      'Pedidos ilimitados',
      'Notificações em tempo real',
      'Link compartilhável',
      'Suporte por email',
    ],
    cta: 'Assinar Básico',
  },
  {
    id: 'pro',
    nome: 'Pro',
    preco: 'R$ 99',
    periodo: '/mês',
    descricao: 'Para quem quer crescer',
    destaque: true,
    features: [
      'Tudo do Básico',
      'Até 3 lojas',
      'Relatórios de vendas',
      'Integração Pix automático',
      'QR Code do cardápio',
      'Suporte prioritário',
    ],
    cta: 'Assinar Pro',
  },
  {
    id: 'enterprise',
    nome: 'Enterprise',
    preco: 'Sob consulta',
    periodo: '',
    descricao: 'Para redes e franquias',
    destaque: false,
    features: [
      'Lojas ilimitadas',
      'API dedicada',
      'Personalização de marca',
      'Gestor de conta exclusivo',
      'SLA garantido',
      'Treinamento da equipe',
    ],
    cta: 'Falar com vendas',
  },
];

export default function AssinarPage() {
  const { user, trialDaysLeft, trialExpired } = useAuth();

  function handleAssinar(planoId: string) {
    if (planoId === 'enterprise') {
      window.location.href = 'mailto:contato@pedemais.com.br?subject=Enterprise';
      return;
    }
    // Aqui você conecta com Stripe/Mercado Pago futuramente
    alert(`Em breve! Integração de pagamento para o plano ${planoId} será ativada em breve.`);
  }

  return (
    <div className="assinar-page">
      <nav className="painel-assinar-nav">
        <a href="/painel" className="logo" style={{ textDecoration: 'none', fontSize: 20 }}>
          Pede<span style={{ color: 'var(--preto)' }}>Mais</span>
        </a>
        {user && (
          <a href="/painel" className="painel-btn-sm ghost">← Voltar ao painel</a>
        )}
      </nav>

      <div className="assinar-hero">
        {trialExpired ? (
          <>
            <span className="assinar-tag danger">Trial expirado</span>
            <h1 className="display assinar-title">Seu teste acabou.<br />Continue recebendo pedidos.</h1>
            <p className="assinar-sub">Escolha um plano e mantenha sua loja no ar. Sem fidelidade, cancele quando quiser.</p>
          </>
        ) : (
          <>
            {trialDaysLeft > 0 && <span className="assinar-tag">⏳ {trialDaysLeft} dia{trialDaysLeft !== 1 ? 's' : ''} de trial restante{trialDaysLeft !== 1 ? 's' : ''}</span>}
            <h1 className="display assinar-title">Escolha seu plano.<br /><span style={{ color: 'var(--laranja)' }}>Zero taxa no Pix.</span></h1>
            <p className="assinar-sub">Assine antes do trial acabar e garanta continuidade. Sem surpresas na cobrança.</p>
          </>
        )}
      </div>

      <div className="assinar-grid">
        {PLANOS.map((plano) => (
          <div key={plano.id} className={`assinar-card${plano.destaque ? ' destaque' : ''}`}>
            {plano.destaque && <span className="assinar-popular">⭐ Mais popular</span>}
            <p className="assinar-plan-name">{plano.nome}</p>
            <p className="assinar-plan-desc">{plano.descricao}</p>
            <div className="assinar-plan-price">
              <span className="assinar-price-valor">{plano.preco}</span>
              <span className="assinar-price-periodo">{plano.periodo}</span>
            </div>
            <ul className="assinar-features">
              {plano.features.map((f) => (
                <li key={f}>
                  <span className="assinar-check">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              className={`assinar-cta${plano.destaque ? ' primary' : ' ghost'}`}
              onClick={() => handleAssinar(plano.id)}
            >
              {plano.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="assinar-garantia">
        <p>🔒 Pagamento seguro &nbsp;·&nbsp; Cancele quando quiser &nbsp;·&nbsp; Sem multa &nbsp;·&nbsp; Suporte em português</p>
      </div>
    </div>
  );
}
