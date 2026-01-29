# ===================================
# Etapa 1: Builder (Construcción)
# ===================================
FROM node:22-alpine AS builder

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json ./

# Instalar todas las dependencias (dev + prod)
RUN pnpm install --no-frozen-lockfile

# Copiar Prisma
COPY prisma.config.ts ./
COPY prisma ./prisma

# Generar cliente Prisma
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" pnpm prisma generate

# Copiar configuración TypeScript/NestJS
COPY tsconfig*.json nest-cli.json ./

# Copiar código fuente
COPY src ./src

# Compilar aplicación
RUN pnpm run build

# Verificar que main.js existe
RUN test -f dist/src/main.js && echo "✅ Build successful: main.js found"

# ===================================
# Etapa 2: Production (Runtime)
# ===================================
FROM node:22-alpine AS production

# Instalar dependencias del sistema para Prisma
RUN apk add --no-cache openssl libssl3 libc6-compat

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar package.json
COPY package.json ./

# Instalar SOLO dependencias de producción + prisma para migraciones
RUN pnpm install --prod --no-frozen-lockfile && \
    pnpm add prisma

# Copiar código compilado desde builder
COPY --from=builder /app/dist ./dist

# Copiar Prisma schema y migraciones
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/prisma ./prisma

# ⭐ Copiar cliente Prisma ya generado (CLAVE)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Crear directorios necesarios
RUN mkdir -p /app/images /app/documents

# Dar permisos al usuario node
RUN chown -R node:node /app

# Cambiar a usuario no-root por seguridad
USER node

# Exponer puerto
EXPOSE 3000

# Ejecutar migraciones e iniciar aplicación
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/src/main.js"]