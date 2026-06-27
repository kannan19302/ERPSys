# UniERP API — production image.
# Build from the repo root:  docker build -f apps/api/Dockerfile -t unerp-api .
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Install all workspace deps (cached on lockfile changes).
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install --frozen-lockfile

# Generate Prisma client + build the API and its workspace deps.
RUN pnpm --filter @unerp/database exec prisma generate \
 && pnpm --filter @unerp/database build \
 && pnpm --filter @unerp/shared build \
 && pnpm --filter @unerp/auth build \
 && pnpm --filter @unerp/api build

FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app
ENV NODE_ENV=production
# Built workspace (dist + node_modules incl. generated Prisma client).
COPY --from=builder /app ./
EXPOSE 3001
# Liveness/readiness probes: GET /health and GET /api/v1/ready
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/api/dist/main.js"]
