// =============================================================
// RedisService — Upstash Redis (FREE: 10k req/dia grátis)
// Substitui Redis Cloud/ElastiCache sem custo
// =============================================================
import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;

  constructor(private config: ConfigService) {
    const redisUrl = config.get<string>('REDIS_URL') ?? '';

    // Upstash usa rediss:// (TLS obrigatório no free tier)
    this.client = new Redis(redisUrl, {
      tls: redisUrl?.startsWith('rediss://') ? {} : undefined,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => Math.min(times * 100, 3000),
      lazyConnect: false,
    });

    this.client.on('connect', () => this.logger.log('✅ Redis (Upstash) conectado'));
    this.client.on('error', (e: Error) => this.logger.error('Redis error:', e.message));
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // ── Cache helpers ─────────────────────────────────────────
  async get<T>(key: string): Promise<T | null> {
    const val = await this.client.get(key);
    if (!val) return null;
    try { return JSON.parse(val); } catch { return val as unknown as T; }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) await this.client.del(...keys);
  }

  // ── Rate limiting simples ─────────────────────────────────
  async incrementWithExpiry(key: string, ttl: number): Promise<number> {
    const count = await this.client.incr(key);
    if (count === 1) await this.client.expire(key, ttl);
    return count;
  }
}
