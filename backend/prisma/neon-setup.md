// =============================================================
// schema.prisma — otimizado para Neon.tech (serverless)
// Adicione ?pgbouncer=true na DATABASE_URL para connection pooling
// =============================================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  // Neon usa connection pooling via PgBouncer
  // Na sua DATABASE_URL adicione: ?pgbouncer=true&connect_timeout=15
  directUrl = env("DATABASE_URL_UNPOOLED") // para migrations
}
