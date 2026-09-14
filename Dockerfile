FROM node:22-slim AS builder
WORKDIR /app

# Copied before `npm ci` because its postinstall script (copy-pdf-worker.mjs
# + `prisma generate`) needs scripts/ and prisma/schema.prisma to exist.
COPY . .

RUN npm ci --legacy-peer-deps

ENV DATABASE_URL="file:/app/data/app.db"
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/app.db"

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./next.config.ts

VOLUME /app/data
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start -- -p 3000"]
