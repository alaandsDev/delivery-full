'use client';

import { useEffect, useRef } from 'react';

export default function HomePage() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach(el => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <>
      {/* NAV */}
      <nav className="landing-nav">
        <a href="/" className="logo">Pede<span>Mais</span></a>
        <div className="nav-links">
          <a href="#como-funciona" className="nav-link">Como funciona</a>
          <a href="#precos" className="nav-link">Preços</a>
          <a href="/login" className="nav-link">Entrar</a>
          <a href="/cadastro" className="nav-cta">Criar loja grátis →</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-left reveal">
            <div className="lp-eyebrow">
              <span className="lp-dot" />
              Cardápio digital • Zero taxa no Pix
            </div>
            <h1 className="lp-h1">
              Pare de pagar <br />
              <em>R$&nbsp;4.050</em> por mês<br />
              pro iFood.
            </h1>
            <p className="lp-sub">
              Tenha seu próprio cardápio digital. Receba pedidos direto no Pix e fique com <strong>100% do lucro</strong>. Sua loja no ar em menos de 5 minutos.
            </p>
            <div className="lp-hero-actions">
              <a href="/cadastro" className="lp-btn-primary">Criar minha loja grátis</a>
              <a href="#como-funciona" className="lp-btn-ghost">Ver como funciona</a>
            </div>
            <div className="lp-trust">
              <div className="lp-trust-item">✓ 3 dias grátis</div>
              <div className="lp-trust-item">✓ Sem cartão</div>
              <div className="lp-trust-item">✓ Cancele quando quiser</div>
            </div>
          </div>

          <div className="lp-hero-right reveal">
            <div className="lp-mockup">
              <div className="lp-mockup-pill new-order">
                <span className="lp-pill-icon">🛒</span>
                <div>
                  <div className="lp-pill-label">Novo pedido</div>
                  <div className="lp-pill-value">R$ 52,00 · Pix confirmado</div>
                </div>
              </div>
              <div className="lp-mockup-pill faturado">
                <span className="lp-pill-icon">📈</span>
                <div>
                  <div className="lp-pill-label">Hoje</div>
                  <div className="lp-pill-value">R$ 847 faturados</div>
                </div>
              </div>
              <div className="lp-phone">
                <div className="lp-phone-bar">
                  <div className="lp-phone-dot" /><div className="lp-phone-dot" /><div className="lp-phone-dot" />
                </div>
                <div className="lp-phone-screen">
                  <div className="lp-screen-header">
                    <div className="lp-screen-store">🍔 João Burguer</div>
                    <span className="lp-screen-open">● Aberto</span>
                  </div>
                  <div className="lp-screen-cats">
                    <span className="lp-cat active">Burguers</span>
                    <span className="lp-cat">Bebidas</span>
                    <span className="lp-cat">Sobremesas</span>
                  </div>
                  {[
                    { n: 'Smash Clássico', p: 'R$ 28,00', e: '🍔' },
                    { n: 'Combo Duplo', p: 'R$ 42,00', e: '🍟' },
                    { n: 'Milkshake', p: 'R$ 16,00', e: '🥤' },
                  ].map(item => (
                    <div key={item.n} className="lp-screen-item">
                      <span className="lp-item-emoji">{item.e}</span>
                      <div className="lp-item-info">
                        <div className="lp-item-name">{item.n}</div>
                        <div className="lp-item-price">{item.p}</div>
                      </div>
                      <button className="lp-item-add">+</button>
                    </div>
                  ))}
                  <div className="lp-screen-cart">
                    <span>2 itens</span>
                    <span>Ver carrinho · R$ 70,00 →</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NÚMERO IMPACTO */}
      <section className="lp-impact">
        <div className="lp-impact-inner reveal">
          <div className="lp-impact-num">27%</div>
          <div className="lp-impact-text">
            <p className="lp-impact-big">É o que o iFood tira de cada pedido seu.</p>
            <p className="lp-impact-small">Em R$ 15.000 de vendas por mês, você entrega <strong>R$ 4.050</strong> pra eles. Todo. Mês. Com o PedeMais, essa grana fica no seu bolso.</p>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="lp-steps" id="como-funciona">
        <div className="lp-steps-inner">
          <div className="reveal">
            <span className="lp-tag">Como funciona</span>
            <h2 className="lp-h2">Do cadastro ao<br />primeiro pedido.</h2>
            <p className="lp-section-sub">Sem técnico, sem programador. Você configura em minutos.</p>
          </div>
          <div className="lp-steps-grid">
            {[
              { n: '01', title: 'Crie sua conta', desc: 'Cadastro em 2 minutos. Nome, email, senha e o nome da sua loja. Pronto.' },
              { n: '02', title: 'Monte seu cardápio', desc: 'Adicione categorias e produtos com foto, descrição e preço. Interface simples, sem complicação.' },
              { n: '03', title: 'Compartilhe o link', desc: 'Você recebe um link único da sua loja. Cole no WhatsApp, Instagram, onde quiser.' },
              { n: '04', title: 'Receba no Pix', desc: 'Cliente faz o pedido, paga no Pix e você recebe na hora. 0% de taxa.' },
            ].map(step => (
              <div key={step.n} className="lp-step-card reveal">
                <div className="lp-step-num">{step.n}</div>
                <h3 className="lp-step-title">{step.title}</h3>
                <p className="lp-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-features">
        <div className="lp-features-inner">
          <div className="reveal">
            <span className="lp-tag dark">O que está incluído</span>
            <h2 className="lp-h2 light">Tudo que você precisa.<br />Nada que você não precisa.</h2>
          </div>
          <div className="lp-features-grid">
            {[
              { icon: '📱', title: 'Cardápio digital', desc: 'Link próprio da sua loja, abre em qualquer celular, sem precisar instalar app.' },
              { icon: '⚡', title: 'Pedidos em tempo real', desc: 'Notificação instantânea com som quando chega um novo pedido no painel.' },
              { icon: '💸', title: '0% de taxa', desc: 'Receba direto no seu Pix. Nós não tocamos no seu dinheiro.' },
              { icon: '🎛️', title: 'Painel completo', desc: 'Gerencie produtos, categorias, pedidos e status tudo em um lugar.' },
              { icon: '🔗', title: 'Link compartilhável', desc: 'Cole no WhatsApp, bio do Instagram, Google Meu Negócio. Funciona em qualquer lugar.' },
              { icon: '📊', title: 'Histórico de pedidos', desc: 'Veja todos os pedidos, filtre por status e acompanhe o desempenho da loja.' },
            ].map(f => (
              <div key={f.title} className="lp-feature-card reveal">
                <div className="lp-feature-icon">{f.icon}</div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREÇOS */}
      <section className="lp-pricing" id="precos">
        <div className="lp-pricing-inner">
          <div className="reveal" style={{ textAlign: 'center' }}>
            <span className="lp-tag">Preços</span>
            <h2 className="lp-h2">Simples e sem surpresa.</h2>
            <p className="lp-section-sub">Comece grátis por 3 dias. Depois escolha o plano.</p>
          </div>
          <div className="lp-pricing-grid">
            <div className="lp-price-card reveal">
              <p className="lp-price-name">Básico</p>
              <div className="lp-price-val">R$ 49<span>/mês</span></div>
              <ul className="lp-price-list">
                <li>✓ 1 loja</li>
                <li>✓ Cardápio ilimitado</li>
                <li>✓ Pedidos ilimitados</li>
                <li>✓ Notificações em tempo real</li>
                <li>✓ Suporte por email</li>
              </ul>
              <a href="/cadastro" className="lp-btn-price">Começar grátis</a>
            </div>
            <div className="lp-price-card destaque reveal">
              <span className="lp-price-badge">Mais popular</span>
              <p className="lp-price-name">Pro</p>
              <div className="lp-price-val">R$ 99<span>/mês</span></div>
              <ul className="lp-price-list">
                <li>✓ Até 3 lojas</li>
                <li>✓ Tudo do Básico</li>
                <li>✓ Relatórios de vendas</li>
                <li>✓ Pix automático integrado</li>
                <li>✓ QR Code do cardápio</li>
                <li>✓ Suporte prioritário</li>
              </ul>
              <a href="/cadastro" className="lp-btn-price primary">Começar grátis</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="lp-faq">
        <div className="lp-faq-inner">
          <div className="reveal">
            <h2 className="lp-h2">Perguntas frequentes.</h2>
          </div>
          <div className="lp-faq-list">
            {[
              { q: 'Preciso saber programar para usar?', a: 'Não. Tudo funciona pelo navegador, sem instalar nada. Se você sabe usar WhatsApp, sabe usar o PedeMais.' },
              { q: 'Como o cliente faz o pedido?', a: 'Você compartilha o link do seu cardápio. O cliente abre no celular, escolhe os itens, informa o nome e confirma. Você recebe o pedido em tempo real no painel.' },
              { q: 'O PedeMais cobra taxa por pedido?', a: 'Não. Cobramos apenas a mensalidade do plano. Cada pedido que entra é 100% seu.' },
              { q: 'Posso cancelar a qualquer momento?', a: 'Sim, sem fidelidade e sem multa. Cancele quando quiser, sem burocracia.' },
              { q: 'Funciona para qualquer tipo de loja?', a: 'Sim. Hamburguerias, pizzarias, açaís, marmitarias, docerias — qualquer estabelecimento que venda pelo delivery.' },
            ].map((item, i) => (
              <details key={i} className="lp-faq-item reveal">
                <summary className="lp-faq-q">{item.q}<span className="lp-faq-arrow">↓</span></summary>
                <p className="lp-faq-a">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="lp-cta-final">
        <div className="lp-cta-inner reveal">
          <h2 className="lp-h2 light">Sua loja no ar hoje.<br /><span style={{ color: 'var(--laranja)' }}>Grátis.</span></h2>
          <p className="lp-cta-sub">Sem cartão de crédito. Sem contrato. Sem taxa no Pix.</p>
          <a href="/cadastro" className="lp-btn-primary large">Criar minha loja agora →</a>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <a href="/" className="logo">Pede<span style={{ color: '#fff' }}>Mais</span></a>
          <p>© 2025 PedeMais · Todos os direitos reservados</p>
          <div className="lp-footer-links">
            <a href="/login">Entrar</a>
            <a href="/cadastro">Cadastrar</a>
            <a href="/assinar">Planos</a>
          </div>
        </div>
      </footer>
    </>
  );
}
