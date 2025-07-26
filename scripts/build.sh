#!/bin/bash

# Build script for all platforms

echo "🚀 Building REST API Client for all platforms..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create electron assets directory if it doesn't exist
echo "🎨 Setting up icon placeholders..."
mkdir -p electron/assets

# Create icon placeholder files
cat > electron/assets/README.txt << 'EOF'
This directory should contain your app icons:
- icon.png (512x512 PNG for Linux)
- icon.ico (Windows ICO file)  
- icon.icns (macOS ICNS file)

You can generate these from a 512x512 PNG using online tools or:
- For ICO: Use online converters or ImageMagick
- For ICNS: Use iconutil on macOS or online converters

For now, the build will use default Electron icons.
EOF

# Create a simple placeholder PNG (base64 encoded 1x1 pixel)
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > electron/assets/icon.png 2>/dev/null || echo "Icon placeholder created"

echo "✅ Icon placeholders created"

# Build Next.js app
echo "🔨 Building Next.js app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build Next.js app"
    exit 1
fi

# Build for all platforms
echo "📱 Building for Windows..."
npm run dist-win

echo "🍎 Building for macOS..."
npm run dist-mac

echo "🐧 Building for Linux..."
npm run dist-linux

echo "✅ Build complete! Check the dist/ folder for installers."
echo "📁 Distribution files:"
ls -la dist/ 2>/dev/null || echo "No dist folder found - check for build errors above"
