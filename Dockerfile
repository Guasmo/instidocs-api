# Etapa de construcción
FROM node:22-alpine AS builder

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar configuración de TypeScript y Prisma
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma

# Generar cliente de Prisma
RUN DATABASE_URL="postgresql://dummy:5432/db" pnpm prisma generate

# Copiar código fuente
COPY src ./src

# Construir aplicación
RUN pnpm run build

# Etapa de producción
FROM node:22-alpine AS production

# Instalar dependencias del sistema
RUN apk add --no-cache openssl libssl3 libc6-compat

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar archivos necesarios desde builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/prisma ./prisma

# Instalar solo dependencias de producción
RUN pnpm install --frozen-lockfile --prod

# Generar cliente de Prisma en producción
RUN DATABASE_URL="postgresql://dummy:5432/db" pnpm prisma generate

# Limpiar caché de pnpm
RUN pnpm store prune

# Cambiar a usuario no-root
USER node

EXPOSE 3000

# Ejecutar migraciones y luego iniciar
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/src/main"]