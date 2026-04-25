'use client';

import { FormEvent, useState } from 'react';

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string; role: string; trialEndsAt: string | null };
};

export default function LoginPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    const password = String(form.get('password') ?? '').trim();

    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.message ?? 'Credenciais inválidas');
      }
      const data = (await res.json()) as LoginResponse;

      // Buscar loja do lojista
      const storeRes = await fetch(`${apiUrl}/stores/by-owner/${data.user.id}`);
      const myStore = storeRes.ok ? await storeRes.json() : null;

      localStorage.setItem('pm_access_token', data.accessToken);
      localStorage.setItem('pm_user', JSON.stringify(data.user));
      if (myStore) localStorage.setItem('pm_store', JSON.stringify(myStore));

      window.location.href = '/painel';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="cadastro-page">
      <section className="cadastro-card">
        <a href="/" className="cadastro-back">← Voltar</a>
        <h1>Entrar</h1>
        <p>Acesse o painel da sua loja.</p>

        <form className="cadastro-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input name="email" type="email" required placeholder="seu@email.com" />
          </label>
          <label>
            Senha
            <input name="password" type="password" required placeholder="Sua senha" />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {error && <p className="cadastro-error">{error}</p>}

        <small style={{ marginTop: 16, display: 'block', textAlign: 'center' }}>
          Não tem conta?{' '}
          <a href="/cadastro" style={{ color: 'var(--laranja)' }}>Criar grátis</a>
        </small>
      </section>
    </main>
  );
}
