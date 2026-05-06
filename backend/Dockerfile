# ─────────────────────────────────────────
# Stage 1: install production dependencies
# ─────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

# Copy manifests first so layer is cached unless deps change
COPY package.json package-lock.json ./

# Install only production deps (no devDependencies)
RUN npm ci --omit=dev

# ─────────────────────────────────────────
# Stage 2: production image
# ─────────────────────────────────────────
FROM node:22-alpine AS runtime

# Security: run as non-root
RUN addgroup -S myfit && adduser -S myfit -G myfit

WORKDIR /app

# Copy deps from stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY src ./src
COPY package.json ./

# The app reads .env if present, but in Docker we pass everything via env vars.
# Do NOT copy .env into the image.

USER myfit

EXPOSE 3000

# Default: bind to all interfaces so Docker port-mapping works.
# Override via HOST env var if needed.
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "src/server.js"]
