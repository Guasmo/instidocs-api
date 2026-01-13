# Etapa de construcción
FROM node:22-alpine AS builder
RUN npm -g install pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma

RUN DATABASE_URL="postgresql://dummy:5432/db" pnpx prisma generate
COPY . .

RUN pnpm run build

# Etapa de producción
FROM node:22-alpine AS production

RUN apk add --no-cache openssl libssl3 libc6-compat
RUN npm -g install pnpm

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist

COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/prisma ./prisma

RUN pnpm install --frozen-lockfile --prod
RUN pnpm store prune

RUN DATABASE_URL="postgresql://dummy:5432/db" pnpx prisma generate

# Crear directorio para archivos subidos
RUN mkdir -p /app/images && \
    chown -R node:node /app/images && \
    chmod -R 755 /app/images

USER node

EXPOSE 3000

CMD ["sh", "-c", "pnpm run start:prod"]