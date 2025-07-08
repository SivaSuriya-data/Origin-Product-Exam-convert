# Local WSL Deployment Guide for getConvertedExams.io

## Prerequisites

### 1. Install Required Tools in WSL

```bash
# Update WSL
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ (using NodeSource repository)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Install Python 3 and pip
sudo apt install python3 python3-pip -y

# Install build essentials
sudo apt install build-essential pkg-config libssl-dev -y
```

### 2. Verify Installations

```bash
# Check versions
node --version    # Should be 18+
npm --version     # Should be 8+
rustc --version   # Should be 1.70+
wasm-pack --version
python3 --version
```

## Setup Instructions

### Step 1: Clone and Navigate to Project

```bash
# If you have the project files, navigate to the directory
cd /path/to/your/project

# Or create a new directory and copy files
mkdir get-converted-exams
cd get-converted-exams
```

### Step 2: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# If you get permission errors, try:
sudo npm install --unsafe-perm=true --allow-root
```

### Step 3: Build Rust WASM Module

```bash
# Navigate to rust-formatter directory
cd rust-formatter

# Build the WASM module
wasm-pack build --target web --out-dir pkg

# Go back to root directory
cd ..
```

### Step 4: Build Python WASM Components

```bash
# Run the Python build script
python3 scripts/build_python_wasm.py
```

### Step 5: Start Development Server

```bash
# Start the Vite development server
npm run dev
```

## Troubleshooting Common Issues

### Issue 1: Rust/WASM Build Errors

```bash
# If you get Rust compilation errors:
rustup update
rustup target add wasm32-unknown-unknown

# Clean and rebuild
cd rust-formatter
cargo clean
wasm-pack build --target web --out-dir pkg
cd ..
```

### Issue 2: Python Module Issues

```bash
# If Python script fails:
sudo apt install python3-dev python3-venv
python3 -m pip install --upgrade pip
```

### Issue 3: Node.js Permission Issues

```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Issue 4: CORS/Headers Issues

The Vite config is already set up with proper headers for WASM. If you still have issues:

```bash
# Try running with specific host
npm run dev -- --host 0.0.0.0
```

## Build for Production

```bash
# Build all components
npm run build:all

# This runs:
# 1. npm run build:wasm (builds Rust WASM)
# 2. npm run build:python (builds Python modules)
# 3. npm run build (builds React app)
```

## Testing the Application

### 1. Access the Application

Once the dev server starts, you'll see output like:
```
Local:   http://localhost:5173/
Network: http://192.168.x.x:5173/
```

Open the local URL in your browser.

### 2. Test Document Processing

1. **Select an Exam**: Choose UPSC, NEET, JEE, CAT, or GATE
2. **Upload Files**: Drag and drop or select document files
3. **Convert**: Click the convert button
4. **Download**: Download the processed ZIP file

### 3. Verify WASM Loading

Check browser console for:
- "Rust WASM module initialized successfully"
- "Pyodide initialized successfully"
- No CORS errors

## Performance Optimization

### 1. Enable WASM Optimization

```bash
# In rust-formatter/Cargo.toml, add:
[profile.release]
opt-level = "s"
lto = true
```

### 2. Preload WASM Modules

The application automatically preloads WASM modules when you select an exam.

## File Structure Verification

Ensure your project has this structure:

```
get-converted-exams/
├── src/
│   ├── components/
│   ├── services/
│   ├── workers/
│   ├── config/
│   └── types/
├── rust-formatter/
│   ├── src/
│   ├── pkg/ (generated)
│   └── Cargo.toml
├── scripts/
├── package.json
└── vite.config.ts
```

## Environment Variables (Optional)

Create a `.env` file in the root directory:

```env
VITE_APP_NAME=getConvertedExams.io
VITE_DEBUG=true
```

## Browser Compatibility

Ensure you're using a modern browser:
- Chrome 88+
- Firefox 89+
- Safari 15+
- Edge 88+

## Memory Considerations

The application loads large WASM modules. Ensure:
- At least 4GB RAM available
- Browser has sufficient memory
- Close other heavy applications

## Development Tips

### 1. Hot Reload

The Vite dev server supports hot reload for:
- React components
- TypeScript files
- CSS changes

For WASM changes, you need to rebuild:
```bash
npm run build:wasm
```

### 2. Debugging

Enable debug mode by adding to browser console:
```javascript
localStorage.setItem('debug', 'true');
```

### 3. Performance Monitoring

Monitor in browser DevTools:
- Network tab for WASM loading
- Console for initialization messages
- Performance tab for processing times

## Common Error Solutions

### "SharedArrayBuffer is not defined"

This means CORS headers aren't set properly. Ensure:
1. Vite config has proper headers
2. You're accessing via localhost (not file://)
3. Browser supports SharedArrayBuffer

### "Module not found" errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### WASM compilation fails

```bash
# Update Rust toolchain
rustup update stable
rustup target add wasm32-unknown-unknown

# Clean and rebuild
cd rust-formatter
cargo clean
wasm-pack build --target web --out-dir pkg
```

## Success Indicators

You'll know everything is working when:

1. ✅ Dev server starts without errors
2. ✅ Browser shows "WebAssembly Ready" status
3. ✅ File upload works
4. ✅ Document analysis completes
5. ✅ File conversion succeeds
6. ✅ ZIP download works

## Next Steps

Once running locally, you can:
1. Test with various document types
2. Verify exam-specific formatting
3. Check file size compliance
4. Test batch processing
5. Validate ZIP file contents

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify all prerequisites are installed
3. Ensure file permissions are correct
4. Try rebuilding WASM modules
5. Clear browser cache and restart

The application should now be fully functional on your local WSL environment!