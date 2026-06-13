# --- Stage 1: Build & Install Dependencies ---
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Cài đặt dependency production
RUN npm install --omit=dev

# --- Stage 2: Runtime Environment ---
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=5000

# Copy node_modules và code nguồn từ builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY server.js ./

USER node

EXPOSE 5000

CMD ["node", "server.js"]
