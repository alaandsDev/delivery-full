import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <nav>
        <Link href="/" className="logo">
          Pede<span>Mais</span>
        </Link>
        <Link href="/cadastro" className="nav-cta">
          Criar loja gratis -&gt;
        </Link>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-left reveal visible">
            <div className="hero-badge">Novo em 2024</div>
            <h1 className="display hero-title">
              Pare de pagar
              <br />
              <span className="risco">27%</span> pro
              <br />
              <span className="destaque">iFood.</span>
            </h1>
            <p className="hero-sub">
              Tenha seu proprio cardapio digital, receba pedidos direto no Pix e fique com <strong>100% do lucro</strong>. Sua loja no ar em 5 minutos.
            </p>
            <div className="hero-cta-group">
              <Link href="/cadastro" className="btn-primary">
                Criar minha loja gratis
              </Link>
              <a href="#como-funciona" className="btn-ghost">
                Ver como funciona
              </a>
            </div>
          </div>

          <div className="hero-visual reveal visible">
            <div className="phone-mockup">
              <div className="float-badge badge-1">
                <div>
                  <div style={{ fontSize: 11, color: '#888' }}>Novo pedido</div>
                  <div style={{ fontWeight: 600 }}>R$ 52,00 - Pix</div>
                </div>
              </div>
              <div className="float-badge badge-2">
                <div>
                  <div style={{ fontSize: 11, color: '#888' }}>Hoje</div>
                  <div style={{ fontWeight: 600 }}>R$ 847 faturado</div>
                </div>
              </div>
              <div className="float-badge badge-3">
                <div style={{ fontWeight: 600, fontSize: 12 }}>Taxa: 0% no Pix</div>
              </div>

              <div className="phone-frame">
                <div className="phone-notch"></div>
                <div className="phone-screen">
                  <div className="screen-content">
                    <div className="screen-header">
                      <div className="store-name">Joao Burguer</div>
                      <div className="store-info">Hamburgueria artesanal - Centro</div>
                      <span className="screen-badge-open">Aberto agora</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#999', padding: '4px 0' }}>MAIS PEDIDOS</div>
                    <div className="screen-product">
                      <div className="product-img">P1</div>
                      <div className="product-info">
                        <div className="name">Classico Smash</div>
                        <div className="price">R$ 28,00</div>
                      </div>
                      <div className="product-add">+</div>
                    </div>
                    <div className="screen-product">
                      <div className="product-img">P2</div>
                      <div className="product-info">
                        <div className="name">Combo Duplo</div>
                        <div className="price">R$ 42,00</div>
                      </div>
                      <div className="product-add">+</div>
                    </div>
                    <div className="screen-product">
                      <div className="product-img">P3</div>
                      <div className="product-info">
                        <div className="name">Milkshake</div>
                        <div className="price">R$ 16,00</div>
                      </div>
                      <div className="product-add">+</div>
                    </div>
                    <div className="screen-cart">
                      <span>2 itens</span>
                      <span style={{ fontWeight: 700 }}>Ver carrinho - R$ 70,00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="taxa-section">
          <div className="reveal visible">
            <h2 className="display taxa-title">
              O iFood cobra
              <br />
              <span className="num">27%</span>
              de cada pedido.
            </h2>
            <p className="taxa-sub">Num mes com R$ 15.000 em vendas, voce entrega R$ 4.050 pra eles. Todo mes.</p>
          </div>
        </section>

        <section className="section" id="como-funciona">
          <div className="reveal visible">
            <span className="section-tag">Como funciona</span>
            <h2 className="display section-title">
              Do cadastro ao
              <br />
              primeiro pedido.
            </h2>
            <p className="section-sub">Sem tecnico, sem programador. Voce configura em poucos minutos.</p>
          </div>
        </section>

        <section className="faq-section">
          <div className="faq-inner">
            <h2 className="display faq-title reveal visible">
              Perguntas
              <br />
              frequentes.
            </h2>

            <div className="faq-item open reveal visible">
              <div className="faq-q">
                <span>Preciso saber programar pra usar?</span>
                <div className="faq-icon">+</div>
              </div>
              <div className="faq-a">Nao. Tudo funciona pelo navegador, sem instalar nada.</div>
            </div>

            <div className="faq-item reveal visible">
              <div className="faq-q">
                <span>Posso cancelar a qualquer momento?</span>
                <div className="faq-icon">+</div>
              </div>
              <div className="faq-a">Sim, sem fidelidade e sem multa.</div>
            </div>
          </div>
        </section>

        <section className="cta-final" id="cadastro">
          <div className="reveal visible">
            <h2 className="display">
              Sua loja no ar
              <br />
              hoje. <span style={{ color: 'var(--laranja)' }}>Gratis.</span>
            </h2>
            <p>Sem cartao de credito. Sem contrato. Sem taxa no Pix.</p>
            <Link href="/cadastro" className="btn-primary" style={{ fontSize: 18, padding: '18px 40px', margin: '0 auto', display: 'inline-flex' }}>
              Criar minha loja agora
            </Link>
          </div>
        </section>
      </main>

      <footer>
        <p>© 2024 PedeMais</p>
      </footer>
    </>
  );
}
