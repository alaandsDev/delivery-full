'use client';
import { lsSet } from '@/hooks/useAuth';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

type RegisterResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    trialEndsAt: string | null;
  };
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function CadastroPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  const hasApi = Boolean(apiUrl);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    const phone = String(form.get('phone') ?? '').trim();
    const password = String(form.get('password') ?? '').trim();
    const storeName = String(form.get('storeName') ?? '').trim();

    const slug = `${slugify(storeName)}-${Math.floor(Math.random() * 9999)}`;

    try {
      const regResponse = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });

      if (!regResponse.ok) {
        const payload = await regResponse.json().catch(() => ({}));
        throw new Error(payload?.message ?? 'Nao foi possivel criar sua conta');
      }

      const regData = (await regResponse.json()) as RegisterResponse;

      const storeResponse = await fetch(`${apiUrl}/stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${regData.accessToken}`,
        },
        body: JSON.stringify({
          name: storeName,
          slug,
          description: `Loja de ${name}`,
        }),
      });

      if (!storeResponse.ok) {
        const payload = await storeResponse.json().catch(() => ({}));
        throw new Error(payload?.message ?? 'Conta criada, mas nao foi possivel criar a loja');
      }

      const store = await storeResponse.json();

      lsSet('pm_access_token', regData.accessToken);
      lsSet('pm_user', JSON.stringify(regData.user));
      lsSet('pm_store', JSON.stringify(store));

      setSuccess('Conta criada com sucesso. Seu trial de 3 dias ja esta ativo.');
      window.location.href = '/painel';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="cadastro-page">
      <section className="cadastro-card">
        <Link href="/" className="cadastro-back">
          {'<-'} Voltar
        </Link>

        <h1>Crie sua loja gratis</h1>
        <p>Cadastro basico e acesso imediato ao painel por 3 dias de teste.</p>

        {!hasApi && (
          <p className="cadastro-alert" aria-live="polite">Defina NEXT_PUBLIC_API_URL no Vercel para ativar o cadastro.</p>
        )}

        <form className="cadastro-form" onSubmit={handleSubmit}>
          <label>
            Nome
            <input name="name" type="text" required placeholder="Seu nome..." autoComplete="name" />
          </label>

          <label>
            Email
            <input name="email" type="email" required placeholder="seu@email.com..." autoComplete="email" spellCheck={false} />
          </label>

          <label>
            WhatsApp
            <input name="phone" type="tel" required placeholder="(11) 99999-9999..." autoComplete="tel" inputMode="tel" />
          </label>

          <label>
            Nome da loja
            <input name="storeName" type="text" required placeholder="Ex: Burguer do Joao..." autoComplete="organization" />
          </label>

          <label>
            Senha
            <input name="password" type="password" required minLength={6} placeholder="Minimo 6 caracteres..." autoComplete="new-password" />
          </label>

          <button type="submit" disabled={loading || !hasApi}>
            {loading ? 'Criando conta...' : 'Criar conta e iniciar trial'}
          </button>
        </form>

        {error && <p className="cadastro-error" aria-live="polite">{error}</p>}
        {success && <p className="cadastro-success" aria-live="polite">{success}</p>}

        <small style={{ marginTop: 16, display: 'block', textAlign: 'center', color: '#888' }}>
          Já tem uma conta?{' '}
          <a href="/login" style={{ color: 'var(--laranja)', fontWeight: 500 }}>Entrar</a>
        </small>
      </section>
    </main>
  );
}
