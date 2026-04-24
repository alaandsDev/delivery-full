export default () => ({
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
    appDomain: process.env.APP_DOMAIN || 'vercel.app',
  },
  database: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-mude-em-producao',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'delivery_unsigned',
  },
  mercadopago: {
    accessToken: process.env.MP_ACCESS_TOKEN,
    webhookSecret: process.env.MP_WEBHOOK_SECRET,
    notificationUrl: process.env.MP_NOTIFICATION_URL,
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.FROM_EMAIL || 'onboarding@resend.dev',
    fromName: process.env.FROM_NAME || 'Delivery SaaS',
  },
});
