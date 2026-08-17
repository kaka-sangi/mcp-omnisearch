FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
COPY wrapper.js ./wrapper.js
RUN npm install --omit=dev --no-audit --no-fund

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    UPSTREAM_PORT=8080 \
    OMNISEARCH_LARGE_RESULT_MODE=file

RUN apk add --no-cache curl \
    && addgroup -S mcp && adduser -S mcp -G mcp

COPY --from=build --chown=mcp:mcp /app/node_modules ./node_modules
COPY --from=build --chown=mcp:mcp /app/wrapper.js ./wrapper.js

USER mcp
EXPOSE 3000
HEALTHCHECK --interval=20s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/health || exit 1

CMD ["node", "wrapper.js"]
