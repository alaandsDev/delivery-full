'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

type Category = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  description?: string;
  priceCents: number;
  isActive: boolean;
  categoryId: string;
};

function fmt(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getApiMessage(payload: any, fallback: string) {
  const msg = payload?.message;
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof payload?.error === 'string' && payload.error.trim()) return payload.error;
  return fallback;
}

export default function ProdutosPage() {
  const { user, store, token, ready } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', description: '', priceInput: '', categoryId: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [savingCat, setSavingCat] = useState(false);

  useEffect(() => {
    if (ready && !user) window.location.href = '/login';
  }, [ready, user]);

  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  const fetchData = useCallback(async () => {
    if (!store) return;
    setPageError(null);

    try {
      const [catsRes, prodsRes] = await Promise.all([
        fetch(`${API}/categories?storeId=${store.id}`),
        fetch(`${API}/products?storeId=${store.id}`),
      ]);

      if (!catsRes.ok || !prodsRes.ok) {
        throw new Error('Nao foi possivel carregar produtos e categorias');
      }

      setCategories(await catsRes.json());
      setProducts(await prodsRes.json());
    } catch (e) {
      setPageError(e instanceof Error ? e.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => {
    if (store) fetchData();
  }, [store, fetchData]);

  function openNewProduct() {
    setEditingProduct(null);
    setForm({ name: '', description: '', priceInput: '', categoryId: categories[0]?.id ?? '' });
    setFormError(null);
    setModalOpen(true);
  }

  function openEditProduct(prod: Product) {
    setEditingProduct(prod);
    setForm({
      name: prod.name,
      description: prod.description ?? '',
      priceInput: (prod.priceCents / 100).toFixed(2).replace('.', ','),
      categoryId: prod.categoryId,
    });
    setFormError(null);
    setModalOpen(true);
  }

  function handlePriceInput(value: string) {
    const digits = value.replace(/\D/g, '');
    if (!digits) {
      setForm((f) => ({ ...f, priceInput: '' }));
      return;
    }
    setForm((f) => ({ ...f, priceInput: (parseInt(digits, 10) / 100).toFixed(2).replace('.', ',') }));
  }

  async function saveProduct() {
    if (!store) return;
    if (!form.name.trim()) {
      setFormError('Informe o nome do produto');
      return;
    }
    if (!form.categoryId) {
      setFormError('Selecione uma categoria');
      return;
    }

    const digits = form.priceInput.replace(/\D/g, '');
    const priceCents = parseInt(digits || '0', 10);
    if (priceCents < 1) {
      setFormError('Informe um preco valido');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (editingProduct) {
        const res = await fetch(`${API}/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({
            name: form.name.trim(),
            description: form.description.trim(),
            priceCents,
            categoryId: form.categoryId,
          }),
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(getApiMessage(payload, 'Nao foi possivel atualizar produto'));
        }
      } else {
        const res = await fetch(`${API}/products`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            storeId: store.id,
            name: form.name.trim(),
            description: form.description.trim(),
            priceCents,
            categoryId: form.categoryId,
          }),
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(getApiMessage(payload, 'Nao foi possivel criar produto'));
        }
      }

      await fetchData();
      setModalOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(prod: Product) {
    const res = await fetch(`${API}/products/${prod.id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ isActive: !prod.isActive }),
    });

    if (res.ok) await fetchData();
  }

  async function saveCategory() {
    if (!store || !catName.trim()) return;

    setSavingCat(true);
    setFormError(null);

    try {
      const res = await fetch(`${API}/categories`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ storeId: store.id, name: catName.trim() }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(getApiMessage(payload, 'Nao foi possivel criar categoria'));
      }

      await fetchData();
      setCatName('');
      setCatModalOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Erro ao criar categoria');
    } finally {
      setSavingCat(false);
    }
  }

  if (!ready || !user || !store) {
    return (
      <div className="painel-loading">
        <div className="cardapio-spinner" />
      </div>
    );
  }

  const productsByCat = (catId: string) => products.filter((p) => p.categoryId === catId);

  return (
    <div className="painel-layout">
      <aside className="painel-sidebar">
        <a href="/" className="logo" style={{ textDecoration: 'none', fontSize: 20, display: 'block', marginBottom: 32 }}>
          Pede<span style={{ color: 'var(--preto)' }}>Mais</span>
        </a>
        <nav className="painel-nav">
          <a href="/painel" className="painel-nav-item">Inicio</a>
          <a href="/painel/pedidos" className="painel-nav-item">Pedidos</a>
          <a href="/painel/produtos" className="painel-nav-item active">Produtos</a>
          <a href="/painel/financeiro" className="painel-nav-item">Financeiro</a>
        </nav>
      </aside>

      <main className="painel-content">
        <div className="painel-topbar">
          <h1 className="painel-page-title">Produtos</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="painel-btn-sm ghost" onClick={() => setCatModalOpen(true)}>
              + Categoria
            </button>
            <button className="painel-btn-sm" onClick={openNewProduct} disabled={categories.length === 0}>
              + Produto
            </button>
          </div>
        </div>

        {pageError && <div className="painel-alert danger">{pageError}</div>}

        {categories.length === 0 && !loading && (
          <div className="painel-alert">Crie uma categoria primeiro para organizar seus produtos.</div>
        )}

        {loading ? (
          <div className="painel-loading">
            <div className="cardapio-spinner" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {categories.map((cat) => (
              <div key={cat.id}>
                <div className="produtos-cat-header">
                  <h2 className="produtos-cat-title">{cat.name}</h2>
                  <span style={{ fontSize: 13, color: '#888' }}>{productsByCat(cat.id).length} produto(s)</span>
                </div>

                {productsByCat(cat.id).length === 0 ? (
                  <p style={{ color: '#aaa', fontSize: 14, padding: '12px 0' }}>Nenhum produto nesta categoria ainda.</p>
                ) : (
                  <div className="produtos-list">
                    {productsByCat(cat.id).map((prod) => (
                      <div key={prod.id} className={`produto-item${prod.isActive ? '' : ' inactive'}`}>
                        <div className="produto-info">
                          <p className="produto-name">{prod.name}</p>
                          {prod.description && <p className="produto-desc">{prod.description}</p>}
                          <p className="produto-price">{fmt(prod.priceCents)}</p>
                        </div>
                        <div className="produto-actions">
                          <button className="painel-btn-sm ghost" onClick={() => openEditProduct(prod)}>
                            Editar
                          </button>
                          <button className={`painel-btn-sm ${prod.isActive ? 'ghost' : ''}`} onClick={() => toggleActive(prod)}>
                            {prod.isActive ? 'Ocultar' : 'Ativar'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <div className="cardapio-overlay" onClick={() => setModalOpen(false)}>
          <div className="painel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cardapio-drawer-header">
              <h3>{editingProduct ? 'Editar produto' : 'Novo produto'}</h3>
              <button className="cardapio-drawer-close" onClick={() => setModalOpen(false)}>x</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 0' }}>
              <label className="cardapio-label">
                Nome *
                <input className="cardapio-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </label>
              <label className="cardapio-label">
                Descricao
                <input className="cardapio-input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </label>
              <label className="cardapio-label">
                Preco (R$) *
                <input className="cardapio-input" value={form.priceInput} onChange={(e) => handlePriceInput(e.target.value)} inputMode="numeric" />
              </label>
              <label className="cardapio-label">
                Categoria *
                <select className="cardapio-input" value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              {formError && <p style={{ color: '#c62828', fontSize: 13 }}>{formError}</p>}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="cardapio-btn-primary" onClick={saveProduct} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button className="cardapio-btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {catModalOpen && (
        <div className="cardapio-overlay" onClick={() => setCatModalOpen(false)}>
          <div className="painel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cardapio-drawer-header">
              <h3>Nova categoria</h3>
              <button className="cardapio-drawer-close" onClick={() => setCatModalOpen(false)}>x</button>
            </div>
            <div style={{ padding: '16px 0' }}>
              <label className="cardapio-label">
                Nome
                <input className="cardapio-input" value={catName} onChange={(e) => setCatName(e.target.value)} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="cardapio-btn-primary" onClick={saveCategory} disabled={savingCat || !catName.trim()}>
                {savingCat ? 'Salvando...' : 'Criar categoria'}
              </button>
              <button className="cardapio-btn-ghost" onClick={() => setCatModalOpen(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


