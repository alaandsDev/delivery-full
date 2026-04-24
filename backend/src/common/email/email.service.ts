// =============================================================
// EmailService — Resend (FREE: 3.000 emails/mês grátis)
// Substitui SendGrid/Mailgun sem custo
// =============================================================
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor(private config: ConfigService) {
    this.apiKey    = config.get('RESEND_API_KEY');
    this.fromEmail = config.get('FROM_EMAIL') || 'onboarding@resend.dev';
    this.fromName  = config.get('FROM_NAME') || 'Delivery SaaS';
  }

  private async send(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn('RESEND_API_KEY não configurado — e-mail ignorado');
      return false;
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: [to],
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        this.logger.error('Resend error:', err);
        return false;
      }

      return true;
    } catch (err) {
      this.logger.error('Erro ao enviar email:', err.message);
      return false;
    }
  }

  // ── Boas-vindas ao novo lojista ───────────────────────────
  async sendWelcomeMerchant(to: string, name: string, storeSlug: string) {
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#f97316;padding:32px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">Bem-vindo, ${name}!</h1>
        </div>
        <div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px">
          <p style="color:#374151;font-size:16px">Sua loja foi criada com sucesso!</p>
          <p style="color:#6b7280">Acesse seu cardápio em:</p>
          <a href="https://${storeSlug}.vercel.app"
             style="display:inline-block;background:#f97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:8px 0">
            Abrir minha loja
          </a>
          <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="color:#9ca3af;font-size:12px">Plano Grátis ativo — 50 pedidos/mês incluídos.</p>
        </div>
      </div>`;
    return this.send(to, `Sua loja ${storeSlug} está online!`, html);
  }

  // ── Novo pedido para o lojista ────────────────────────────
  async sendNewOrderAlert(to: string, orderNumber: number, total: number, items: string[]) {
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#1f2937">Novo pedido #${orderNumber}</h2>
        <p style="font-size:24px;font-weight:700;color:#f97316">R$ ${total.toFixed(2)}</p>
        <ul style="color:#374151">${items.map(i => `<li>${i}</li>`).join('')}</ul>
        <p style="color:#6b7280;font-size:14px">Acesse o painel para confirmar.</p>
      </div>`;
    return this.send(to, `Novo pedido #${orderNumber} — R$ ${total.toFixed(2)}`, html);
  }

  // ── Status do pedido para o cliente ──────────────────────
  async sendOrderStatus(to: string, orderNumber: number, status: string, storeName: string) {
    const msgs: Record<string, { subject: string; body: string }> = {
      CONFIRMED:        { subject: 'Pedido confirmado!', body: 'Seu pedido foi confirmado e está sendo preparado.' },
      PREPARING:        { subject: 'Preparando seu pedido', body: 'Seu pedido está sendo preparado com carinho.' },
      OUT_FOR_DELIVERY: { subject: 'Saiu para entrega!', body: 'Seu pedido está a caminho.' },
      DELIVERED:        { subject: 'Pedido entregue!', body: 'Bom apetite! Obrigado por pedir em ' + storeName },
      CANCELED:         { subject: 'Pedido cancelado', body: 'Seu pedido foi cancelado.' },
    };

    const msg = msgs[status];
    if (!msg) return;

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#1f2937">Pedido #${orderNumber}</h2>
        <p style="color:#374151">${msg.body}</p>
        <p style="color:#9ca3af;font-size:12px">${storeName}</p>
      </div>`;
    return this.send(to, msg.subject, html);
  }
}
