# ==================================
# MongoDB MCP Server Docker Image
# ==================================

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build
RUN npm prune --production

# ==================================
# Production Image
# ==================================

FROM node:20-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create non-root user for security
RUN addgroup -S mcp && adduser -S mcp -G mcp
USER mcp

# Environment variables (can be overridden at runtime)
ENV NODE_ENV=production
ENV MONGODB_TIMEOUT=30000
ENV SCHEMA_SAMPLE_SIZE=1000
# ENV MONGODB_URI="your-mongodb-connection-string"
# ENV MONGODB_READONLY=true
# ENV MONGODB_DISABLED_TOOLS=drop_database,drop_collection

# Health check disabled for MCP (stdio-based)
# HEALTHCHECK --interval=30s --timeout=3s CMD exit 0

# Entry point
ENTRYPOINT ["node", "dist/index.js"]

# Labels for metadata
LABEL org.opencontainers.image.title="MongoDB MCP Server"
LABEL org.opencontainers.image.description="Model Context Protocol server for MongoDB with 27 tools"
LABEL org.opencontainers.image.source="https://github.com/quocthai0404/mongo-mcp"
LABEL org.opencontainers.image.authors="Thai Phan"
LABEL org.opencontainers.image.licenses="MIT"
