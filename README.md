# REST API Client - Desktop App

A modern, cross-platform REST API client built with Next.js and Electron.

## Features

- 🚀 Cross-platform support (Windows, macOS, Linux)
- 🎯 Modern UI with resizable panels and collapsible sidebar
- 📁 Collections and request organization
- 🔐 Multiple authentication methods (Bearer, Basic, API Key, OAuth 2.0)
- 📊 Response viewer with formatted JSON, headers, and raw data
- 📈 Request history and environment variables
- ⌨️ Keyboard shortcuts and native menu integration
- 💾 Import/Export functionality
- 🌙 Dark/Light theme support

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Run in development mode:
   \`\`\`bash
   npm run electron-dev
   \`\`\`

### Building

#### Build for all platforms:
\`\`\`bash
npm run dist
\`\`\`

#### Build for specific platforms:
\`\`\`bash
# Windows
npm run dist-win

# macOS  
npm run dist-mac

# Linux
npm run dist-linux
\`\`\`

### Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build Next.js app
- `npm run electron` - Run Electron app
- `npm run electron-dev` - Run in development mode
- `npm run dist` - Build for all platforms
- `npm run pack` - Package without creating installer

## Keyboard Shortcuts

- `Ctrl/Cmd + N` - New Request
- `Ctrl/Cmd + Shift + N` - New Collection
- `Ctrl/Cmd + B` - Toggle Sidebar
- `Ctrl/Cmd + I` - Import Data
- `Ctrl/Cmd + E` - Export Data
- `Ctrl/Cmd + Q` - Quit Application

## File Structure

\`\`\`
├── electron/           # Electron main process files
├── components/         # React components
├── contexts/          # React contexts
├── lib/               # Utilities and types
├── public/            # Static assets
└── scripts/           # Build scripts
\`\`\`

## Distribution

The built applications will be available in the `dist/` folder:

- **Windows**: `.exe` installer
- **macOS**: `.dmg` disk image  
- **Linux**: `.AppImage` and `.deb` packages

## License

MIT License
\`\`\`

I'll continue with the remaining essential files to ensure this is a completely fresh project...
