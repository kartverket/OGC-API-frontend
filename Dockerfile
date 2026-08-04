FROM node:26-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
ENV API_BASE_URL=http://localhost:5000
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_SSG=true
ENV NEXT_PUBLIC_MAX_BBOX=4.626095,57.977101,31.125157,71.188325

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM gcr.io/distroless/nodejs26-debian13 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV EXPORT_PROCESSORS=ExportAllGpkgProcessor,ExportCollectionGpkgProcessor,ExportByAreaGpkgProcessor,ExportCollectionCsvProcessor

USER 150:150

COPY --from=builder --chown=150:150 /app/public ./public
COPY --from=builder --chown=150:150 /app/.next/standalone ./
COPY --from=builder --chown=150:150 /app/.next/static ./.next/static

EXPOSE 3000

CMD ["server.js"]
