FROM --platform=linux/amd64 oven/bun:latest AS builder

# Install Python and build tools for native dependencies
USER root
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Create app user and directory
RUN mkdir -p /app && \
  adduser --disabled-password --gecos "" appuser && \
  chown -R appuser:appuser /app

WORKDIR /app
USER appuser

# Copy package files first to leverage Docker cache
COPY --chown=appuser:appuser package.json ./
COPY --chown=appuser:appuser prisma ./prisma/

# Install dependencies
RUN bun install --frozen-lockfile

# Generate Prisma Client with correct binary targets
RUN bunx prisma generate

# Copy source code
COPY --chown=appuser:appuser . .

# Production stage
FROM --platform=linux/amd64 oven/bun:latest

# Install OpenSSL
USER root
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Create app user and directory
RUN mkdir -p /app && \
  adduser --disabled-password --gecos "" appuser && \
  chown -R appuser:appuser /app

WORKDIR /app
USER appuser

# Copy necessary files from builder
COPY --from=builder --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /app/generated ./generated
COPY --from=builder --chown=appuser:appuser /app/package.json ./package.json
COPY --from=builder --chown=appuser:appuser /app/prisma ./prisma
COPY --from=builder --chown=appuser:appuser /app/*.ts ./
COPY --from=builder --chown=appuser:appuser /app/controllers ./controllers
COPY --from=builder --chown=appuser:appuser /app/routes ./routes
COPY --from=builder --chown=appuser:appuser /app/middleware ./middleware

EXPOSE 8000
ENV NODE_ENV=production

CMD ["bun", "run", "index.ts"]
