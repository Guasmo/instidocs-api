# Etapa de construcción
FROM node:22-alpine AS builder

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar package.json primero
COPY package.json ./

# Instalar dependencias (sin frozen-lockfile para regenerar)
RUN pnpm install --no-frozen-lockfile

# Copiar configuración de Prisma
COPY prisma.config.ts ./
COPY prisma ./prisma

# Generar cliente de Prisma
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" pnpm prisma generate

# Copiar configuración de TypeScript y NestJS
COPY tsconfig*.json nest-cli.json ./

# Copiar código fuente
COPY src ./src

# Construir aplicación
RUN pnpm run build

# Verificar que dist existe
RUN ls -la dist/ && ls -la dist/src/

# Etapa de producción
FROM node:22-alpine AS production

# Instalar dependencias del sistema
RUN apk add --no-cache openssl libssl3 libc6-compat

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar package.json
COPY package.json ./

# Instalar solo dependencias de producción (sin frozen-lockfile)
RUN pnpm install --prod --no-frozen-lockfile

# Copiar archivos compilados desde builder
COPY --from=builder /app/dist ./dist

# Copiar archivos de Prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/prisma ./prisma

# Generar cliente de Prisma en producción
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" pnpm prisma generate

# Limpiar caché
RUN pnpm store prune

# Cambiar a usuario no-root
USER node

EXPOSE 3000

# Script de inicio
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/src/main.js"]
