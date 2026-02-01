_# Stage 1: Dependencies
FROM node:22-alpine AS deps
# Install dependencies required for native modules
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm globally for easy access
RUN npm install -g pnpm

# Copy only essential package manager files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for the build process)
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy dependencies from the previous stage
COPY --from=deps /app/node_modules ./node_modules
# Copy the entire application source code
COPY . .

# Build the application, creating the `dist` directory
RUN pnpm run build

# Prune development dependencies to reduce image size
RUN pnpm prune --prod

# Stage 3: Production Runner
FROM node:22-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Create a non-root user for enhanced security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the necessary production assets from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Set ownership of the application files to the non-root user
RUN chown -R nextjs:nodejs /app

# Switch to the non-root user
USER nextjs

# Expose the application port
EXPOSE 3000

# Health check to ensure the application is running correctly
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Command to start the application server
CMD ["node", "dist/server/index.js"]
_
