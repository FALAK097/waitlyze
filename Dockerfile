# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm --force
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Stage 2: Build application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Stage 3: Run application
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /next.config.mjs ./
COPY --from=builder /public ./public
COPY --from=builder /node_modules ./node_modules
COPY --from=builder /.next ./.next

EXPOSE 3000
CMD ["pnpm", "start"]