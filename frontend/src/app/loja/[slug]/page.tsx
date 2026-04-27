'use client';

import { use, useEffect, useState, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

type Store = { id: string; name: string; slug: string; description?: string };
type Category = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  description?: string;
  priceCents: number;
  isActive: boolean;
  categoryId: string;
};
type CartItem = { product: Product; quantity: number };

function fmt(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderError, setOrderError] = useState<string | null>(null);

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
        setProducts(prods.filter((p) => p.isActive));
        if (cats.length > 0) setActiveCat(cats[0].id);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === productId);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((i) => i.product.id !== productId);
      return prev.map((i) => i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i);
    });
  }, []);

  const cartTotal = cart.reduce((s, i) => s + i.product.priceCents * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

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
          items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        }),
      });
      if (!res.ok) throw new Error('Erro ao enviar pedido');
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
      <p style={{ color: '#666' }}>Aguarde a confirmação da loja.</p>
      <button className="cardapio-btn-primary" style={{ marginTop: 24 }} onClick={() => setOrderDone(false)}>
        Fazer outro pedido
      </button>
    </div>
  );

  const productsByCat = (catId: string) => products.filter((p) => p.categoryId === catId);
  const cartQty = (productId: string) => cart.find((i) => i.product.id === productId)?.quantity ?? 0;

  return (
    <div className="cardapio-page">
      {/* Header */}
      <header className="cardapio-header">
        <div className="cardapio-header-inner">
          <div>
            <h1 className="cardapio-store-name">{store.name}</h1>
            {store.description && <p className="cardapio-store-desc">{store.description}</p>}
          </div>
          <span className="cardapio-badge-open">🟢 Aberto</span>
        </div>
      </header>

      {/* Categorias */}
      {categories.length > 0 ? (
        <nav className="cardapio-cats">
          {categories.map((cat) => (
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

      {/* Produtos */}
      <main className="cardapio-main">
        {categories.map((cat) => {
          const prods = productsByCat(cat.id);
          if (prods.length === 0) return null;
          return (
            <section key={cat.id} id={`cat-${cat.id}`} className="cardapio-section">
              <h2 className="cardapio-cat-title">{cat.name}</h2>
              <div className="cardapio-grid">
                {prods.map((prod) => {
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

      {/* Botão flutuante do carrinho */}
      {cartCount > 0 && !cartOpen && !checkoutOpen && (
        <button className="cardapio-cart-fab" onClick={() => setCartOpen(true)}>
          <span>🛒 Ver carrinho ({cartCount})</span>
          <span>{fmt(cartTotal)}</span>
        </button>
      )}

      {/* Drawer do carrinho */}
      {cartOpen && (
        <div className="cardapio-overlay" onClick={() => setCartOpen(false)}>
          <div className="cardapio-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cardapio-drawer-header">
              <h3>Seu carrinho</h3>
              <button className="cardapio-drawer-close" onClick={() => setCartOpen(false)}>✕</button>
            </div>
            <div className="cardapio-drawer-items">
              {cart.map((item) => (
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
              <div className="cardapio-cart-total">
                <span>Total</span>
                <span>{fmt(cartTotal)}</span>
              </div>
              <button className="cardapio-btn-primary" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>
                Finalizar pedido →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de checkout */}
      {checkoutOpen && (
        <div className="cardapio-overlay" onClick={() => setCheckoutOpen(false)}>
          <div className="cardapio-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cardapio-drawer-header">
              <h3>Seus dados</h3>
              <button className="cardapio-drawer-close" onClick={() => setCheckoutOpen(false)}>✕</button>
            </div>
            <div className="cardapio-drawer-items" style={{ gap: 12 }}>
              <label className="cardapio-label">
                Seu nome
                <input
                  className="cardapio-input"
                  type="text"
                  placeholder="Ex: João Silva"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </label>
              <label className="cardapio-label">
                WhatsApp
                <input
                  className="cardapio-input"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </label>
              <div className="cardapio-checkout-summary">
                {cart.map((i) => (
                  <div key={i.product.id} className="cardapio-checkout-line">
                    <span>{i.quantity}x {i.product.name}</span>
                    <span>{fmt(i.product.priceCents * i.quantity)}</span>
                  </div>
                ))}
                <div className="cardapio-checkout-line total">
                  <span>Total</span>
                  <span>{fmt(cartTotal)}</span>
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
                {orderLoading ? 'Enviando...' : '✅ Confirmar pedido'}
              </button>
              <button className="cardapio-btn-ghost" onClick={() => { setCheckoutOpen(false); setCartOpen(true); }}>
                ← Voltar ao carrinho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
