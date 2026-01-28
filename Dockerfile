# Etapa de construcción
FROM node:22-alpine AS builder

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar archivos de dependencias primero (mejor caché)
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar configuración de Prisma
COPY prisma.config.ts ./
COPY prisma ./prisma

# Generar cliente de Prisma
RUN DATABASE_URL="postgresql://dummy:5432/db" pnpm prisma generate

# Copiar configuración de TypeScript y NestJS
COPY tsconfig*.json nest-cli.json ./

# Copiar código fuente
COPY src ./src

# Construir aplicación
RUN pnpm run build

# Etapa de producción
FROM node:22-alpine AS production

# Instalar dependencias del sistema necesarias para Prisma
RUN apk add --no-cache openssl libssl3 libc6-compat

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar solo dependencias de producción
RUN pnpm install --frozen-lockfile --prod

# Copiar archivos compilados
COPY --from=builder /app/dist ./dist

# Copiar archivos de Prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/prisma/schema.prisma ./prisma/
COPY --from=builder /app/prisma/migrations ./prisma/migrations

# Generar cliente de Prisma en producción
RUN DATABASE_URL="postgresql://dummy:5432/db" pnpm prisma generate

# Limpiar caché
RUN pnpm store prune

# Cambiar a usuario no-root por seguridad
USER node

EXPOSE 3000

# Ejecutar migraciones y luego iniciar
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/src/main"]