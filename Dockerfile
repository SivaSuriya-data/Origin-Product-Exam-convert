# Multi-stage build for Rust WASM compilation
FROM rust:1.70 as rust-builder

# Install wasm-pack
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

WORKDIR /app
COPY rust-formatter ./rust-formatter

# Build Rust WASM module
WORKDIR /app/rust-formatter
RUN wasm-pack build --target web --out-dir pkg

# Node.js build stage
FROM node:18-alpine as node-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY public ./public
COPY index.html ./

# Copy built WASM module from rust-builder
COPY --from=rust-builder /app/rust-formatter/pkg ./rust-formatter/pkg

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=node-builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Add headers for WASM and SharedArrayBuffer support
RUN echo 'add_header Cross-Origin-Embedder-Policy require-corp;' > /etc/nginx/conf.d/headers.conf && \
    echo 'add_header Cross-Origin-Opener-Policy same-origin;' >> /etc/nginx/conf.d/headers.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]