# Multi-stage build for Rust WASM compilation
FROM rust:1.75 AS rust-builder

# Install wasm-pack
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

WORKDIR /app
COPY rust-formatter ./rust-formatter

# Remove any existing Cargo.lock to avoid version conflicts
RUN rm -f rust-formatter/Cargo.lock

# Build Rust WASM module
WORKDIR /app/rust-formatter
RUN wasm-pack build --target web --out-dir pkg

# Node.js build stage
FROM node:18-alpine AS node-builder

WORKDIR /app

# Copy package files from the Get-Converted-Exams directory
COPY Get-Converted-Exams/package*.json ./
COPY Get-Converted-Exams/tsconfig*.json ./
COPY Get-Converted-Exams/vite.config.js ./

# Install dependencies
RUN npm ci

# Copy source code from Get-Converted-Exams
COPY Get-Converted-Exams/src ./src
COPY Get-Converted-Exams/public ./public
COPY Get-Converted-Exams/index.html ./

# Copy built WASM module from rust-builder
COPY --from=rust-builder /app/rust-formatter/pkg ./rust-formatter/pkg

# Copy other necessary files
COPY scripts ./scripts
COPY src/python_modules ./src/python_modules

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