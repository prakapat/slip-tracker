FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source
COPY server.js ./
COPY public/ ./public/

# Expose port
EXPOSE 3000

CMD ["node", "server.js"]
