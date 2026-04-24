import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;
  private uploadPreset: string;

  constructor(private config: ConfigService) {
    this.cloudName    = config.get<string>('CLOUDINARY_CLOUD_NAME') ?? '';
    this.apiKey       = config.get<string>('CLOUDINARY_API_KEY') ?? '';
    this.apiSecret    = config.get<string>('CLOUDINARY_API_SECRET') ?? '';
    this.uploadPreset = config.get<string>('CLOUDINARY_UPLOAD_PRESET') ?? 'delivery_unsigned';
  }

  async uploadImage(buffer: Buffer, folder: string, publicId?: string): Promise<{ url: string; publicId: string }> {
    const base64 = `data:image/webp;base64,${buffer.toString('base64')}`;
    const formData = new FormData();
    formData.append('file', base64);
    formData.append('folder', folder);
    formData.append('upload_preset', this.uploadPreset);
    if (publicId) formData.append('public_id', publicId);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`, {
      method: 'POST', body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      this.logger.error('Cloudinary error:', err);
      throw new BadRequestException('Erro ao fazer upload da imagem');
    }
    const data = await res.json() as { secure_url: string; public_id: string };
    return { url: data.secure_url, publicId: data.public_id };
  }

  getUnsignedUploadParams(folder: string) {
    return { cloudName: this.cloudName, uploadPreset: this.uploadPreset, folder };
  }

  getThumbnail(url: string): string {
    return url.replace('/upload/', '/upload/w_400,h_400,c_fill/');
  }
}