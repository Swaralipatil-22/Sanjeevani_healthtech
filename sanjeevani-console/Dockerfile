# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------
FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# Production - runs the standalone server, so node_modules is not shipped
# ---------------------------------------------------------------------------
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup -S sanjeevani && adduser -S sanjeevani -G sanjeevani

COPY --from=build --chown=sanjeevani:sanjeevani /app/.next/standalone ./
COPY --from=build --chown=sanjeevani:sanjeevani /app/.next/static ./.next/static
COPY --from=build --chown=sanjeevani:sanjeevani /app/public ./public

USER sanjeevani

EXPOSE 3000

CMD ["node", "server.js"]
