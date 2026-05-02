# ─────────────────────────────────────────
# Stage 1: install deps (incl. dev for build)
# ─────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ─────────────────────────────────────────
# Stage 2: build
# ─────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
RUN npm run build

# ─────────────────────────────────────────
# Stage 3: runtime (standalone Next output)
# ─────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

RUN addgroup -S myfit && adduser -S myfit -G myfit

COPY --from=builder /app/public ./public
COPY --from=builder --chown=myfit:myfit /app/.next/standalone ./
COPY --from=builder --chown=myfit:myfit /app/.next/static ./.next/static

USER myfit
EXPOSE 3001

ENV HOSTNAME=0.0.0.0
ENV PORT=3001
ENV NODE_ENV=production

CMD ["node", "server.js"]
