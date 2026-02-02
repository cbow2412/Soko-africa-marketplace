# Use Node 22 Alpine for a lightweight footprint
FROM node:22-alpine AS builder

# Install pnpm for faster, more reliable builds
RUN npm install -g pnpm

WORKDIR /app

# Copy only dependency files first to leverage Docker cache
COPY pnpm-lock.yaml package.json ./

# Install all dependencies (including devDeps for build)
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the application (Vite + Server Build)
RUN pnpm run build

# Compile the worker with correct TSC syntax
# We use --outDir and --rootDir to ensure the file lands at dist/server/workers/heartbeat-sync-v2.js
RUN npx tsc server/workers/heartbeat-sync-v2.ts \
    --outDir dist \
    --rootDir . \
    --module commonjs \
    --target ES2020 \
    --esModuleInterop \
    --skipLibCheck \
    --moduleResolution node

# Rename to .cjs for ESM compatibility
RUN mv dist/server/workers/heartbeat-sync-v2.js dist/server/workers/heartbeat-sync-v2.cjs

# MANDATORY VERIFICATION: Build will fail here if worker is missing
RUN test -f dist/server/workers/heartbeat-sync-v2.cjs && echo "✅ Worker verified at dist/server/workers/heartbeat-sync-v2.cjs"

# Production Stage
FROM node:22-alpine

RUN npm install -g pnpm && apk add --no-cache dumb-init

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port Railway expects
EXPOSE 3000

# Use dumb-init to handle signals correctly
ENTRYPOINT ["dumb-init", "--"]

# Start the stabilized production server
CMD ["node", "dist/server/index.js"]
