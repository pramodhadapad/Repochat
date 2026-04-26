# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies for tree-sitter
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

# Stage 2: Runtime
FROM node:20-slim

WORKDIR /app

# Install runtime dependencies for tree-sitter
RUN apt-get update && apt-get install -y \
    python3 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Create a non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "index.js"]
