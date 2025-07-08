#!/bin/bash

# Setup script for getConvertedExams.io on WSL
# Run this script to automatically set up the development environment

set -e

echo "🚀 Setting up getConvertedExams.io on WSL..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check and install Node.js
echo -e "${YELLOW}📦 Checking Node.js installation...${NC}"
if ! command_exists node; then
    echo -e "${YELLOW}Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js is installed: $NODE_VERSION${NC}"
fi

# Check and install Rust
echo -e "${YELLOW}🦀 Checking Rust installation...${NC}"
if ! command_exists rustc; then
    echo -e "${YELLOW}Installing Rust...${NC}"
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
else
    RUST_VERSION=$(rustc --version)
    echo -e "${GREEN}✅ Rust is installed: $RUST_VERSION${NC}"
fi

# Check and install wasm-pack
echo -e "${YELLOW}📦 Checking wasm-pack installation...${NC}"
if ! command_exists wasm-pack; then
    echo -e "${YELLOW}Installing wasm-pack...${NC}"
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
else
    WASM_PACK_VERSION=$(wasm-pack --version)
    echo -e "${GREEN}✅ wasm-pack is installed: $WASM_PACK_VERSION${NC}"
fi

# Check and install Python
echo -e "${YELLOW}🐍 Checking Python installation...${NC}"
if ! command_exists python3; then
    echo -e "${YELLOW}Installing Python...${NC}"
    sudo apt install python3 python3-pip -y
else
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✅ Python is installed: $PYTHON_VERSION${NC}"
fi

# Install build essentials
echo -e "${YELLOW}🔧 Installing build essentials...${NC}"
sudo apt update
sudo apt install build-essential pkg-config libssl-dev -y

# Install Node.js dependencies
echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
npm install

# Add wasm32 target for Rust
echo -e "${YELLOW}🎯 Adding wasm32 target...${NC}"
rustup target add wasm32-unknown-unknown

# Build Rust WASM module
echo -e "${YELLOW}🦀 Building Rust WASM module...${NC}"
cd rust-formatter
wasm-pack build --target web --out-dir pkg
cd ..

# Build Python WASM components
echo -e "${YELLOW}🐍 Building Python WASM components...${NC}"
python3 scripts/build_python_wasm.py

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file...${NC}"
    cat > .env << EOF
VITE_APP_NAME=getConvertedExams.io
VITE_DEBUG=true
EOF
fi

echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "   1. Run: ${YELLOW}npm run dev${NC}"
echo -e "   2. Open: ${YELLOW}http://localhost:5173${NC}"
echo -e "   3. Test the application with sample documents"

echo -e "${BLUE}📝 Useful commands:${NC}"
echo -e "   • Start dev server: ${YELLOW}npm run dev${NC}"
echo -e "   • Build for production: ${YELLOW}npm run build:all${NC}"
echo -e "   • Rebuild WASM only: ${YELLOW}npm run build:wasm${NC}"
echo -e "   • View logs: Check browser console"

echo -e "${GREEN}✅ Ready to start development!${NC}"