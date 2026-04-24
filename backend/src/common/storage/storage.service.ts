// =============================================================
// StorageService — Cloudinary (FREE TIER: 25 GB grátis)
// Substitui o AWS S3 completamente, sem custo
// =============================================================
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor(private config: ConfigService) {
    this.cloudName = config.get('cloudinary.cloudName');
    this.apiKey     = config.get('cloudinary.apiKey');
    this.apiSecret  = config.get('cloudinary.apiSecret');
  }

  // ── Upload de imagem (buffer) com resize automático ────────
  async uploadImage(
    buffer: Buffer,
    folder: string,
    publicId?: string,
    maxWidth = 1200,
  ): Promise<UploadResult> {
    const base64 = `data:image/webp;base64,${buffer.toString('base64')}`;

    const formData = new FormData();
    formData.append('file', base64);
    formData.append('folder', folder);
    formData.append('upload_preset', this.config.get('cloudinary.uploadPreset'));
    formData.append('transformation', JSON.stringify([
      { width: maxWidth, crop: 'limit', quality: 'auto:good', fetch_format: 'webp' },
    ]));
    if (publicId) formData.append('public_id', publicId);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
      { method: 'POST', body: formData },
    );

    if (!res.ok) {
      const err = await res.json();
      this.logger.error('Cloudinary upload error:', err);
      throw new BadRequestException('Erro ao fazer upload da imagem');
    }

    const data = await res.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
    };
  }

  // ── Upload via URL pré-assinada (cliente faz upload direto) ─
  // No Cloudinary free, usamos upload preset unsigned diretamente do browser
  getUnsignedUploadParams(folder: string) {
    return {
      cloudName: this.cloudName,
      uploadPreset: this.config.get('cloudinary.uploadPreset'),
      folder,
      // O cliente usa esses params com a Cloudinary Upload Widget
      // ou fetch direto para https://api.cloudinary.com/v1_1/{cloud}/upload
    };
  }

  // ── Deletar imagem ─────────────────────────────────────────
  async deleteImage(publicId: string): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await this.generateSignature(`public_id=${publicId}&timestamp=${timestamp}`);

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', String(timestamp));
    formData.append('api_key', this.apiKey);
    formData.append('signature', signature);

    await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`,
      { method: 'POST', body: formData },
    );
  }

  // ── Gerar URL transformada (resize on-the-fly) ─────────────
  getTransformedUrl(originalUrl: string, width: number, height?: number): string {
    // Cloudinary permite transformações via URL
    // Ex: https://res.cloudinary.com/cloud/image/upload/w_400,h_300,c_fill/pasta/imagem.jpg
    const transform = height
      ? `w_${width},h_${height},c_fill`
      : `w_${width},c_scale`;
    return originalUrl.replace('/upload/', `/upload/${transform}/`);
  }

  // ── Thumbnail 400x400 ─────────────────────────────────────
  getThumbnail(url: string): string {
    return this.getTransformedUrl(url, 400, 400);
  }

  private async generateSignature(params: string): Promise<string> {
    // Usa Web Crypto API (disponível no Node 18+)
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.apiSecret);
    const messageData = encoder.encode(params);
    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    return Buffer.from(signature).toString('hex');
  }
}
