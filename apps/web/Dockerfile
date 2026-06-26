# UniERP Web — production image.
# Build from the repo root:  docker build -f apps/web/Dockerfile -t unerp-web .
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install --frozen-lockfile

# Prisma client is a transitive dep of shared types used by the web app.
RUN pnpm --filter @unerp/database exec prisma generate \
 && pnpm --filter @unerp/web build

FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 3000
CMD ["pnpm", "--filter", "@unerp/web", "start"]
