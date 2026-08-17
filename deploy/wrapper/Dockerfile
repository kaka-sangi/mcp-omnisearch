FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    UPSTREAM_PORT=8080 \
    OMNISEARCH_LARGE_RESULT_MODE=file

RUN apk add --no-cache curl \
    && addgroup -S mcp && adduser -S mcp -G mcp

COPY --from=deps --chown=mcp:mcp /app/node_modules ./node_modules
COPY --chown=mcp:mcp wrapper.mjs ./wrapper.mjs
COPY --chown=mcp:mcp package.json ./package.json

USER mcp
EXPOSE 3000
HEALTHCHECK --interval=20s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/health || exit 1

CMD ["node", "wrapper.mjs"]
