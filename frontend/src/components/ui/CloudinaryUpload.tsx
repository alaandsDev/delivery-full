'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  currentUrl?: string;
  folder: string;               // ex: "stores/logos" ou "products"
  onUpload: (url: string) => void;
  aspectRatio?: 'square' | 'banner' | 'product';
  maxSizeMB?: number;
}

// Upload direto para Cloudinary (sem passar pelo backend)
// Free tier: 25 GB armazenamento + transformações automáticas
export function CloudinaryUpload({
  currentUrl,
  folder,
  onUpload,
  aspectRatio = 'square',
  maxSizeMB = 5,
}: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cloudName  = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = 'delivery_unsigned'; // unsigned preset criado no Cloudinary

  const handleFile = async (file: File) => {
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Apenas imagens são permitidas');
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Tamanho máximo: ${maxSizeMB}MB`);
      return;
    }

    // Preview local imediato
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', folder);
      // Cloudinary faz resize automático para 1200px e converte para WebP
      formData.append('transformation', 'w_1200,c_limit,q_auto:good,f_webp');

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData },
      );

      if (!res.ok) throw new Error('Upload falhou');

      const data = await res.json();
      setPreview(data.secure_url);
      onUpload(data.secure_url);
      URL.revokeObjectURL(localUrl);
    } catch (err) {
      setError('Erro ao fazer upload. Tente novamente.');
      setPreview(currentUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const dims = {
    square:  'aspect-square w-32',
    banner:  'aspect-[3/1] w-full',
    product: 'aspect-square w-40',
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'relative rounded-xl border-2 border-dashed border-gray-200 overflow-hidden cursor-pointer',
          'hover:border-orange-300 hover:bg-orange-50 transition-colors',
          dims[aspectRatio],
        )}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {preview ? (
          <>
            <Image src={preview} alt="preview" fill className="object-cover" />
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 size={24} className="text-white animate-spin" />
              </div>
            )}
            {!uploading && (
              <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                <Upload size={20} className="text-white" />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
            {uploading
              ? <Loader2 size={24} className="animate-spin text-orange-400" />
              : <Upload size={24} />
            }
            <span className="text-xs text-center px-2">
              {uploading ? 'Enviando...' : 'Clique ou arraste uma imagem'}
            </span>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
      />
    </div>
  );
}
