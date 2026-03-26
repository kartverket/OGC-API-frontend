FROM oven/bun:1.3.9-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS builder
WORKDIR /app
ENV API_BASE_URL=http://localhost:5000
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_SSG=true

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN bun run build

# For production, remove -dev from image (non-root and no shell)
FROM oven/bun:1.3.9-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

USER 150:150

COPY --from=builder --chown=150:150 /app/public ./public
COPY --from=builder --chown=150:150 /app/.next/standalone ./
COPY --from=builder --chown=150:150 /app/.next/static ./.next/static

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
     CMD ["bun","-e","fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["bun", "server.js"]
