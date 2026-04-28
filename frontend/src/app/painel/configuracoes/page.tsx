'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { lsSet } from '@/hooks/useAuth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

export default function ConfiguracoesPage() {
  const { user, store, token, ready } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    whatsappNumber: '',
    deliveryFee: '',
    minOrderCents: '',
    openingHours: '',
  });

  useEffect(() => {
    if (ready && !user) window.location.href = '/login';
  }, [ready, user]);

  useEffect(() => {
    if (store) {
      setForm({
        name: store.name ?? '',
        description: (store as any).description ?? '',
        whatsappNumber: (store as any).whatsappNumber ?? '',
        deliveryFee: store.deliveryFee != null ? ((store as any).deliveryFee / 100).toFixed(2).replace('.', ',') : '',
        minOrderCents: (store as any).minOrderCents != null ? ((store as any).minOrderCents / 100).toFixed(2).replace('.', ',') : '',
        openingHours: (store as any).openingHours ?? '',
      });
    }
  }, [store]);

  function parseCents(value: string): number {
    return Math.round(parseFloat(value.replace(',', '.') || '0') * 100);
  }

  const handleSave = useCallback(async () => {
    if (!store || !token) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`${API}/stores/${store.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          whatsappNumber: form.whatsappNumber.replace(/\D/g, '') || undefined,
          deliveryFee: parseCents(form.deliveryFee),
          minOrderCents: parseCents(form.minOrderCents),
          openingHours: form.openingHours.trim() || undefined,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        lsSet('pm_store', JSON.stringify({ ...store, ...updated }));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }, [store, token, form]);

  if (!ready || !user || !store) return <div className="painel-loading"><div className="cardapio-spinner" /></div>;

  return (
    <div className="painel-layout">
      <aside className="painel-sidebar">
        <a href="/" className="logo" style={{ textDecoration: 'none', fontSize: 20, display: 'block', marginBottom: 40 }}>
          Pede<span>Mais</span>
        </a>
        <nav className="painel-nav">
          <a href="/painel" className="painel-nav-item">🏠 Início</a>
          <a href="/painel/pedidos" className="painel-nav-item">📋 Pedidos</a>
          <a href="/painel/produtos" className="painel-nav-item">🍔 Produtos</a>
          <a href="/painel/financeiro" className="painel-nav-item">📊 Financeiro</a>
          <a href="/painel/clientes" className="painel-nav-item">👥 Clientes</a>
          <a href="/painel/configuracoes" className="painel-nav-item active">⚙️ Configurações</a>
        </nav>
        <div className="painel-sidebar-footer">
          <a href="/assinar" className="painel-nav-item" style={{ color: 'var(--laranja)' }}>⭐ Planos</a>
        </div>
      </aside>

      <main className="painel-content">
        <div className="painel-topbar">
          <h1 className="painel-page-title">Configurações</h1>
          <button className="painel-btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar alterações'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
          <div className="painel-card">
            <p className="painel-card-label">Informações da loja</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
              <label className="cardapio-label">
                Nome da loja *
                <input className="cardapio-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </label>
              <label className="cardapio-label">
                Descrição
                <input className="cardapio-input" placeholder="Ex: Os melhores hambúrgueres da cidade" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </label>
              <label className="cardapio-label">
                Horário de funcionamento
                <input className="cardapio-input" placeholder="Ex: Seg–Sex 11h–22h · Sáb 11h–23h" value={form.openingHours} onChange={e => setForm(f => ({ ...f, openingHours: e.target.value }))} />
              </label>
            </div>
          </div>

          <div className="painel-card">
            <p className="painel-card-label">WhatsApp e entrega</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
              <label className="cardapio-label">
                Número do WhatsApp
                <input className="cardapio-input" type="tel" placeholder="(11) 99999-9999" value={form.whatsappNumber} onChange={e => setForm(f => ({ ...f, whatsappNumber: e.target.value }))} />
                <span style={{ fontSize: 12, color: '#888' }}>Ao confirmar pedido, o cliente será direcionado para este número.</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label className="cardapio-label">
                  Taxa de entrega (R$)
                  <input className="cardapio-input" inputMode="decimal" placeholder="0,00" value={form.deliveryFee} onChange={e => setForm(f => ({ ...f, deliveryFee: e.target.value }))} />
                </label>
                <label className="cardapio-label">
                  Pedido mínimo (R$)
                  <input className="cardapio-input" inputMode="decimal" placeholder="0,00" value={form.minOrderCents} onChange={e => setForm(f => ({ ...f, minOrderCents: e.target.value }))} />
                </label>
              </div>
            </div>
          </div>

          <div className="painel-card">
            <p className="painel-card-label">Link do cardápio</p>
            <div style={{ marginTop: 12 }}>
              <div className="painel-cardapio-url" style={{ marginBottom: 10 }}>
                {typeof window !== 'undefined' ? window.location.origin : ''}/loja/{store.slug}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={`/loja/${store.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="painel-btn-sm"
                >
                  Ver cardápio ↗
                </a>
                <button
                  className="painel-btn-sm ghost"
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/loja/${store.slug}`)}
                >
                  Copiar link
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
