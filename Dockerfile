# RDCMNATION QUANTUM - Production Docker Image
FROM node:18-alpine

WORKDIR /app

# Copy package.json
COPY package.json .

# Install (no dependencies, but ensures npm compatibility)
RUN npm install --only=production || true

# Copy application files
COPY server-minimal.js .
COPY quantum-trading-bot.js .
COPY manual-signal-generator.js .
COPY market-data-live.js .
COPY monai-integration.js .

# Copy trading engine files
COPY trading-engine-advanced.js .

# Create public directory
RUN mkdir -p public
COPY public/ public/

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "server-minimal.js"]
