const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require("electron")
const fs = require("fs").promises
const path = require("path")
const isDev = process.env.NODE_ENV === "development"

// Keep a global reference of the window object
let mainWindow

// File system handlers
ipcMain.handle("read-file", async (event, filePath) => {
  try {
    const data = await fs.readFile(filePath, "utf8")
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle("write-file", async (event, filePath, data) => {
  try {
    await fs.writeFile(filePath, data, "utf8")
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

function createWindow() {
  // Check for icon file, use default if not found
  let iconPath = null
  try {
    const possibleIconPath = path.join(__dirname, "assets", "icon.png")
    if (require("fs").existsSync(possibleIconPath)) {
      iconPath = possibleIconPath
    }
  } catch (error) {
    console.log("No custom icon found, using default")
  }

  // Create the browser window
  const windowOptions = {
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, "preload.js"),
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    show: false,
  }

  // Add icon if available
  if (iconPath) {
    windowOptions.icon = iconPath
  }

  mainWindow = new BrowserWindow(windowOptions)

  // Load the app
  const startUrl = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "../.next/server/pages/index.html")}`

  mainWindow.loadURL(startUrl)

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow.show()

    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: "deny" }
  })

  // Create application menu
  createMenu()
}

function createMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "New Request",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            mainWindow.webContents.send("menu-new-request")
          },
        },
        {
          label: "New Collection",
          accelerator: "CmdOrCtrl+Shift+N",
          click: () => {
            mainWindow.webContents.send("menu-new-collection")
          },
        },
        { type: "separator" },
        {
          label: "Import",
          accelerator: "CmdOrCtrl+I",
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ["openFile"],
              filters: [{ name: "JSON Files", extensions: ["json"] }],
            })

            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow.webContents.send("menu-import", result.filePaths[0])
            }
          },
        },
        {
          label: "Export",
          accelerator: "CmdOrCtrl+E",
          click: async () => {
            const result = await dialog.showSaveDialog(mainWindow, {
              defaultPath: `api-client-export-${new Date().toISOString().split("T")[0]}.json`,
              filters: [{ name: "JSON Files", extensions: ["json"] }],
            })

            if (!result.canceled && result.filePath) {
              mainWindow.webContents.send("menu-export", result.filePath)
            }
          },
        },
        { type: "separator" },
        {
          label: "Quit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit()
          },
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectall" },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Toggle Sidebar",
          accelerator: "CmdOrCtrl+B",
          click: () => {
            mainWindow.webContents.send("menu-toggle-sidebar")
          },
        },
        { type: "separator" },
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About REST API Client",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "About REST API Client",
              message: "REST API Client",
              detail: "A modern REST API client built with Next.js and Electron\nVersion 1.0.0",
            })
          },
        },
        {
          label: "Learn More",
          click: () => {
            shell.openExternal("https://github.com/your-repo/rest-api-client")
          },
        },
      ],
    },
  ]

  // macOS specific menu adjustments
  if (process.platform === "darwin") {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    })

    // Window menu
    template[4].submenu = [
      { role: "close" },
      { role: "minimize" },
      { role: "zoom" },
      { type: "separator" },
      { role: "front" },
    ]
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// App event handlers
app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Security: Prevent new window creation
app.on("web-contents-created", (event, contents) => {
  contents.on("new-window", (event, navigationUrl) => {
    event.preventDefault()
    shell.openExternal(navigationUrl)
  })
})
