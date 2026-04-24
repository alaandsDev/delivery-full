export default function CadastroPage() {
  return (
    <main className="cadastro-page">
      <section className="cadastro-card">
        <a href="/" className="cadastro-back">
          <- Voltar
        </a>

        <h1>Crie sua loja gratis</h1>
        <p>
          Preencha os dados e fale com nosso time no WhatsApp para ativar sua
          loja ainda hoje.
        </p>

        <form
          className="cadastro-form"
          action="https://wa.me/5500000000000"
          method="get"
          target="_blank"
        >
          <label>
            Nome
            <input name="nome" type="text" required placeholder="Seu nome" />
          </label>

          <label>
            WhatsApp
            <input
              name="telefone"
              type="tel"
              required
              placeholder="(11) 99999-9999"
            />
          </label>

          <label>
            Nome da loja
            <input
              name="loja"
              type="text"
              required
              placeholder="Ex: Burguer do Joao"
            />
          </label>

          <button type="submit">Quero ativar minha loja</button>
        </form>

        <small>
          Troque o numero do WhatsApp no arquivo
          {' '}
          <code>src/app/cadastro/page.tsx</code>
          {' '}
          para o seu numero.
        </small>
      </section>
    </main>
  );
}
