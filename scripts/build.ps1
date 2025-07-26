# PowerShell build script for Windows

Write-Host "🚀 Building REST API Client for all platforms..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Create electron assets directory if it doesn't exist
Write-Host "🎨 Setting up icon placeholders..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "electron\assets" | Out-Null

# Create icon placeholder files
$iconReadme = @"
This directory should contain your app icons:
- icon.png (512x512 PNG for Linux)
- icon.ico (Windows ICO file)  
- icon.icns (macOS ICNS file)

You can generate these from a 512x512 PNG using online tools or:
- For ICO: Use online converters or ImageMagick
- For ICNS: Use iconutil on macOS or online converters

For now, the build will use default Electron icons.
"@

Set-Content -Path "electron\assets\README.txt" -Value $iconReadme

# Create a minimal placeholder icon file
$placeholderIcon = @"
This is a placeholder for the app icon.
Replace this file with actual icon files:
- icon.png (512x512 PNG)
- icon.ico (Windows ICO)
- icon.icns (macOS ICNS)
"@

Set-Content -Path "electron\assets\icon.png" -Value $placeholderIcon

Write-Host "✅ Icon placeholders created" -ForegroundColor Green

# Build Next.js app
Write-Host "🔨 Building Next.js app..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build Next.js app" -ForegroundColor Red
    exit 1
}

# Build for all platforms
Write-Host "📱 Building for Windows..." -ForegroundColor Yellow
npm run dist-win

Write-Host "🍎 Building for macOS..." -ForegroundColor Yellow
npm run dist-mac

Write-Host "🐧 Building for Linux..." -ForegroundColor Yellow
npm run dist-linux

Write-Host "✅ Build complete! Check the dist/ folder for installers." -ForegroundColor Green

# List distribution files
if (Test-Path "dist") {
    Write-Host "📁 Distribution files:" -ForegroundColor Cyan
    Get-ChildItem dist | Format-Table Name, Length, LastWriteTime
} else {
    Write-Host "No dist folder found - check for build errors above" -ForegroundColor Yellow
}
