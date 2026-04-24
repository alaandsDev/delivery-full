async function getApiStatus() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return {
      ok: false,
      message: 'Defina NEXT_PUBLIC_API_URL para conectar o frontend ao backend.',
    };
  }

  try {
    const response = await fetch(`${apiUrl}/health`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `Backend respondeu com status ${response.status}.`,
      };
    }

    const data = (await response.json()) as { timestamp?: string; status?: string };
    return {
      ok: true,
      message: `API ${data.status ?? 'online'} em ${data.timestamp ?? 'agora'}.`,
    };
  } catch {
    return {
      ok: false,
      message: 'Nao foi possivel consultar o backend agora.',
    };
  }
}

export default async function HomePage() {
  const status = await getApiStatus();

  return (
    <main className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">Delivery SaaS</span>
        <h1>Base pronta para publicar no Vercel, Render e Supabase.</h1>
        <p className="lead">
          Esta versao enxuta coloca o projeto novamente em um estado executavel,
          com frontend Next.js, backend NestJS e banco PostgreSQL no Supabase.
        </p>
        <div className="status-row">
          <div className={`status-pill ${status.ok ? 'ok' : 'warn'}`}>
            {status.ok ? 'Backend conectado' : 'Backend pendente'}
          </div>
          <p>{status.message}</p>
        </div>
      </section>

      <section className="grid">
        <article className="info-card">
          <h2>Frontend</h2>
          <p>Deploy no Vercel com variavel NEXT_PUBLIC_API_URL apontando para o Render.</p>
        </article>
        <article className="info-card">
          <h2>Backend</h2>
          <p>API NestJS com healthcheck em /api/v1/health e Prisma preparado para Supabase.</p>
        </article>
        <article className="info-card">
          <h2>Banco</h2>
          <p>Supabase Postgres usando DATABASE_URL e DIRECT_URL para operacao e migrations.</p>
        </article>
      </section>
    </main>
  );
}
