'use client';

import { use, useEffect, useState, useCallback, useMemo } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

type Store = {
  id: string; name: string; slug: string; description?: string;
  whatsappNumber?: string; deliveryFee?: number; minOrderCents?: number;
};
type Category = { id: string; name: string };
type Product = { id: string; name: string; description?: string; priceCents: number; isActive: boolean; categoryId: string };
type CartItem = { product: Product; quantity: number };
type CouponResult = { valid: boolean; discountCents: number; coupon: { code: string; discountType: string; discountValue: number } };

function fmt(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function buildWhatsAppMessage(store: Store, cart: CartItem[], customerName: string, customerAddress: string, paymentMethod: string, deliveryFee: number, discount: number) {
  const lines = [
    `🛒 *Novo pedido — ${store.name}*`,
    ``,
    `*Cliente:* ${customerName}`,
    customerAddress ? `*Endereço:* ${customerAddress}` : '',
    ``,
    `*Itens:*`,
    ...cart.map(i => `• ${i.quantity}x ${i.product.name} — ${fmt(i.product.priceCents * i.quantity)}`),
    ``,
    deliveryFee > 0 ? `*Taxa de entrega:* ${fmt(deliveryFee)}` : '',
    discount > 0 ? `*Desconto:* -${fmt(discount)}` : '',
    `*Total: ${fmt(cart.reduce((s, i) => s + i.product.priceCents * i.quantity, 0) + deliveryFee - discount)}*`,
    ``,
    `*Pagamento:* ${paymentMethod === 'pix' ? 'Pix' : paymentMethod === 'cash' ? 'Dinheiro' : 'Cartão'}`,
  ].filter(Boolean).join('\n');
  return encodeURIComponent(lines);
}

export default function CardapioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderDone, setOrderDone] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Dados do cliente
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cash' | 'card'>('pix');
  const [lookingUp, setLookingUp] = useState(false);

  // Cupom
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const storeRes = await fetch(`${API}/stores/by-slug/${slug}`);
        if (!storeRes.ok) { setLoading(false); return; }
        const found: Store = await storeRes.json();
        if (!found) { setLoading(false); return; }
        setStore(found);
        const [catsRes, prodsRes] = await Promise.all([
          fetch(`${API}/categories?storeId=${found.id}`),
          fetch(`${API}/products?storeId=${found.id}`),
        ]);
        const cats: Category[] = await catsRes.json();
        const prods: Product[] = await prodsRes.json();
        setCategories(cats);
        setProducts(prods.filter(p => p.isActive));
        if (cats.length > 0) setActiveCat(cats[0].id);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // Lookup de cliente ao sair do campo de telefone
  async function handlePhoneBlur() {
    if (!store || customerPhone.replace(/\D/g, '').length < 10) return;
    setLookingUp(true);
    try {
      const res = await fetch(`${API}/customers/lookup?storeId=${store.id}&phone=${customerPhone.replace(/\D/g, '')}`);
      if (res.ok) {
        const customer = await res.json();
        if (customer?.name) {
          setCustomerName(customer.name);
          if (customer.address) setCustomerAddress(customer.address);
        }
      }
    } catch {} finally {
      setLookingUp(false);
    }
  }

  async function handleApplyCoupon() {
    if (!store || !couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    setCouponResult(null);
    try {
      const res = await fetch(`${API}/coupons/validate?storeId=${store.id}&code=${couponCode.trim()}&orderCents=${subtotal}`);
      if (!res.ok) {
        const err = await res.json();
        setCouponError(err.message ?? 'Cupom inválido');
        return;
      }
      const data: CouponResult = await res.json();
      setCouponResult(data);
    } catch {
      setCouponError('Erro ao validar cupom');
    } finally {
      setCouponLoading(false);
    }
  }

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === productId);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter(i => i.product.id !== productId);
      return prev.map(i => i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i);
    });
  }, []);

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.product.priceCents * i.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const deliveryFee = store?.deliveryFee ?? 0;
  const discountCents = couponResult?.discountCents ?? 0;
  const total = subtotal + deliveryFee - discountCents;

  async function handleOrder() {
    if (!store || !customerName.trim() || !customerPhone.trim()) return;
    setOrderLoading(true);
    setOrderError(null);
    try {
      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim() || undefined,
          paymentMethod,
          couponCode: couponResult ? couponCode.trim() : undefined,
          items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })),
        }),
      });
      if (!res.ok) throw new Error('Erro ao enviar pedido');

      // Abrir WhatsApp se lojista configurou número
      if (store.whatsappNumber) {
        const msg = buildWhatsAppMessage(store, cart, customerName, customerAddress, paymentMethod, deliveryFee, discountCents);
        const phone = store.whatsappNumber.replace(/\D/g, '');
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
      }

      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
      setOrderDone(true);
    } catch {
      setOrderError('Não foi possível enviar o pedido. Tente novamente.');
    } finally {
      setOrderLoading(false);
    }
  }

  if (loading) return (
    <div className="cardapio-loading">
      <div className="cardapio-spinner" />
      <p>Carregando cardápio...</p>
    </div>
  );

  if (!store) return (
    <div className="cardapio-loading">
      <p style={{ fontSize: 18, fontWeight: 600 }}>Loja não encontrada.</p>
      <a href="/" style={{ color: 'var(--laranja)', marginTop: 12, display: 'block' }}>← Voltar</a>
    </div>
  );

  if (orderDone) return (
    <div className="cardapio-loading">
      <div style={{ fontSize: 56 }}>🎉</div>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, margin: '12px 0 8px' }}>Pedido enviado!</h2>
      <p style={{ color: '#666', textAlign: 'center', maxWidth: 280 }}>
        {store.whatsappNumber
          ? 'O WhatsApp foi aberto com os detalhes do pedido. Aguarde a confirmação da loja.'
          : 'Aguarde a confirmação da loja.'}
      </p>
      <button className="cardapio-btn-primary" style={{ marginTop: 24, maxWidth: 280 }} onClick={() => setOrderDone(false)}>
        Fazer outro pedido
      </button>
    </div>
  );

  const productsByCat = (catId: string) => products.filter(p => p.categoryId === catId);
  const cartQty = (productId: string) => cart.find(i => i.product.id === productId)?.quantity ?? 0;
  const belowMinOrder = store.minOrderCents && subtotal < store.minOrderCents && subtotal > 0;

  return (
    <div className="cardapio-page">
      <header className="cardapio-header">
        <div className="cardapio-header-inner">
          <div>
            <h1 className="cardapio-store-name">{store.name}</h1>
            {store.description && <p className="cardapio-store-desc">{store.description}</p>}
            {store.deliveryFee != null && store.deliveryFee > 0 && (
              <p style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>🛵 Entrega: {fmt(store.deliveryFee)}</p>
            )}
            {store.minOrderCents != null && store.minOrderCents > 0 && (
              <p style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>Pedido mínimo: {fmt(store.minOrderCents)}</p>
            )}
          </div>
          <span className="cardapio-badge-open">🟢 Aberto</span>
        </div>
      </header>

      {categories.length > 0 ? (
        <nav className="cardapio-cats">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`cardapio-cat-btn${activeCat === cat.id ? ' active' : ''}`}
              onClick={() => {
                setActiveCat(cat.id);
                document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              {cat.name}
            </button>
          ))}
        </nav>
      ) : null}

      <main className="cardapio-main">
        {categories.map(cat => {
          const prods = productsByCat(cat.id);
          if (prods.length === 0) return null;
          return (
            <section key={cat.id} id={`cat-${cat.id}`} className="cardapio-section">
              <h2 className="cardapio-cat-title">{cat.name}</h2>
              <div className="cardapio-grid">
                {prods.map(prod => {
                  const qty = cartQty(prod.id);
                  return (
                    <div key={prod.id} className="cardapio-card">
                      <div className="cardapio-card-info">
                        <p className="cardapio-card-name">{prod.name}</p>
                        {prod.description && <p className="cardapio-card-desc">{prod.description}</p>}
                        <p className="cardapio-card-price">{fmt(prod.priceCents)}</p>
                      </div>
                      <div className="cardapio-card-actions">
                        {qty === 0 ? (
                          <button className="cardapio-add-btn" onClick={() => addToCart(prod)}>+</button>
                        ) : (
                          <div className="cardapio-qty-ctrl">
                            <button onClick={() => removeFromCart(prod.id)}>−</button>
                            <span>{qty}</span>
                            <button onClick={() => addToCart(prod)}>+</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
            <p style={{ fontSize: 40 }}>🍽️</p>
            <p style={{ marginTop: 12 }}>Nenhum produto disponível ainda.</p>
          </div>
        ) : null}
      </main>

      {/* FAB carrinho */}
      {cartCount > 0 && !cartOpen && !checkoutOpen ? (
        <button className="cardapio-cart-fab" onClick={() => setCartOpen(true)}>
          <span>🛒 Ver carrinho ({cartCount})</span>
          <span>{fmt(subtotal)}</span>
        </button>
      ) : null}

      {/* Drawer carrinho */}
      {cartOpen ? (
        <div className="cardapio-overlay" onClick={() => setCartOpen(false)}>
          <div className="cardapio-drawer" onClick={e => e.stopPropagation()}>
            <div className="cardapio-drawer-header">
              <h3>Seu carrinho</h3>
              <button className="cardapio-drawer-close" onClick={() => setCartOpen(false)}>✕</button>
            </div>
            <div className="cardapio-drawer-items">
              {cart.map(item => (
                <div key={item.product.id} className="cardapio-cart-item">
                  <div>
                    <p className="cardapio-cart-item-name">{item.product.name}</p>
                    <p className="cardapio-cart-item-price">{fmt(item.product.priceCents)} cada</p>
                  </div>
                  <div className="cardapio-qty-ctrl">
                    <button onClick={() => removeFromCart(item.product.id)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => addToCart(item.product)}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="cardapio-drawer-footer">
              {deliveryFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#888', marginBottom: 4 }}>
                  <span>Taxa de entrega</span><span>{fmt(deliveryFee)}</span>
                </div>
              )}
              <div className="cardapio-cart-total">
                <span>Total</span>
                <span>{fmt(subtotal + deliveryFee)}</span>
              </div>
              {belowMinOrder ? (
                <p style={{ color: '#c62828', fontSize: 13, textAlign: 'center' }}>
                  Pedido mínimo: {fmt(store.minOrderCents!)}
                </p>
              ) : null}
              <button
                className="cardapio-btn-primary"
                disabled={!!belowMinOrder}
                onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
              >
                Finalizar pedido →
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Checkout */}
      {checkoutOpen ? (
        <div className="cardapio-overlay" onClick={() => setCheckoutOpen(false)}>
          <div className="cardapio-drawer" onClick={e => e.stopPropagation()}>
            <div className="cardapio-drawer-header">
              <h3>Finalizar pedido</h3>
              <button className="cardapio-drawer-close" onClick={() => setCheckoutOpen(false)}>✕</button>
            </div>
            <div className="cardapio-drawer-items" style={{ gap: 12 }}>
              {/* Dados do cliente */}
              <label className="cardapio-label">
                WhatsApp *
                <input
                  className="cardapio-input"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  onBlur={handlePhoneBlur}
                />
                {lookingUp && <span style={{ fontSize: 12, color: '#888' }}>Buscando dados...</span>}
              </label>
              <label className="cardapio-label">
                Seu nome *
                <input
                  className="cardapio-input"
                  type="text"
                  placeholder="Ex: João Silva"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </label>
              <label className="cardapio-label">
                Endereço de entrega
                <input
                  className="cardapio-input"
                  type="text"
                  placeholder="Rua, número, bairro"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                />
              </label>

              {/* Pagamento */}
              <div>
                <p className="cardapio-label" style={{ marginBottom: 8 }}>Forma de pagamento</p>
                <div className="cardapio-payment-grid">
                  {(['pix', 'cash', 'card'] as const).map(m => (
                    <button
                      key={m}
                      className={`cardapio-payment-btn${paymentMethod === m ? ' active' : ''}`}
                      onClick={() => setPaymentMethod(m)}
                    >
                      {m === 'pix' ? '💳 Pix' : m === 'cash' ? '💵 Dinheiro' : '💳 Cartão'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cupom */}
              <div>
                <p className="cardapio-label" style={{ marginBottom: 8 }}>Cupom de desconto</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="cardapio-input"
                    style={{ flex: 1 }}
                    placeholder="CODIGO10"
                    value={couponCode}
                    onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); setCouponError(null); }}
                  />
                  <button
                    className="painel-btn-sm"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                  >
                    {couponLoading ? '...' : 'Aplicar'}
                  </button>
                </div>
                {couponResult && (
                  <p style={{ color: '#1b5e20', fontSize: 13, marginTop: 6 }}>
                    ✓ Desconto de {fmt(couponResult.discountCents)} aplicado!
                  </p>
                )}
                {couponError && <p style={{ color: '#c62828', fontSize: 13, marginTop: 6 }}>{couponError}</p>}
              </div>

              {/* Resumo */}
              <div className="cardapio-checkout-summary">
                {cart.map(i => (
                  <div key={i.product.id} className="cardapio-checkout-line">
                    <span>{i.quantity}x {i.product.name}</span>
                    <span>{fmt(i.product.priceCents * i.quantity)}</span>
                  </div>
                ))}
                {deliveryFee > 0 && (
                  <div className="cardapio-checkout-line">
                    <span>Taxa de entrega</span>
                    <span>{fmt(deliveryFee)}</span>
                  </div>
                )}
                {discountCents > 0 && (
                  <div className="cardapio-checkout-line" style={{ color: '#1b5e20' }}>
                    <span>Desconto ({couponCode})</span>
                    <span>-{fmt(discountCents)}</span>
                  </div>
                )}
                <div className="cardapio-checkout-line total">
                  <span>Total</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>
            </div>

            <div className="cardapio-drawer-footer">
              {orderError && <p className="cardapio-error">{orderError}</p>}
              <button
                className="cardapio-btn-primary"
                disabled={orderLoading || !customerName.trim() || !customerPhone.trim()}
                onClick={handleOrder}
              >
                {orderLoading
                  ? 'Enviando...'
                  : store.whatsappNumber
                  ? '📱 Confirmar e abrir WhatsApp'
                  : '✅ Confirmar pedido'}
              </button>
              <button className="cardapio-btn-ghost" onClick={() => { setCheckoutOpen(false); setCartOpen(true); }}>
                ← Voltar ao carrinho
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
