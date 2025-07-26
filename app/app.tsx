"use client"

import { useState, useEffect } from "react"
import { ApiProvider } from "@/contexts/api-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { RequestBuilder } from "@/components/request/request-builder"
import { ResponseViewer } from "@/components/response/response-viewer"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

// Type declaration for Electron API
declare global {
  interface Window {
    electronAPI?: {
      onMenuNewRequest: (callback: () => void) => void
      onMenuNewCollection: (callback: () => void) => void
      onMenuToggleSidebar: (callback: () => void) => void
      onMenuImport: (callback: (event: any, filePath: string) => void) => void
      onMenuExport: (callback: (event: any, filePath: string) => void) => void
      readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>
      writeFile: (filePath: string, data: string) => Promise<{ success: boolean; error?: string }>
      platform: string
      removeAllListeners: (channel: string) => void
    }
  }
}

export default function Component() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    // Check if running in Electron
    setIsElectron(typeof window !== "undefined" && !!window.electronAPI)

    if (window.electronAPI) {
      // Set up Electron menu event listeners
      window.electronAPI.onMenuToggleSidebar(() => {
        setSidebarCollapsed((prev) => !prev)
      })

      window.electronAPI.onMenuNewRequest(() => {
        // This will be handled by the API context
        window.dispatchEvent(new CustomEvent("electron-new-request"))
      })

      window.electronAPI.onMenuNewCollection(() => {
        // This will be handled by the API context
        window.dispatchEvent(new CustomEvent("electron-new-collection"))
      })

      window.electronAPI.onMenuImport((event, filePath) => {
        // Handle import
        window.dispatchEvent(new CustomEvent("electron-import", { detail: filePath }))
      })

      window.electronAPI.onMenuExport((event, filePath) => {
        // Handle export
        window.dispatchEvent(new CustomEvent("electron-export", { detail: filePath }))
      })

      // Cleanup listeners on unmount
      return () => {
        window.electronAPI?.removeAllListeners("menu-toggle-sidebar")
        window.electronAPI?.removeAllListeners("menu-new-request")
        window.electronAPI?.removeAllListeners("menu-new-collection")
        window.electronAPI?.removeAllListeners("menu-import")
        window.electronAPI?.removeAllListeners("menu-export")
      }
    }
  }, [])

  // Handle keyboard shortcuts for web version
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isElectron) {
        if ((event.ctrlKey || event.metaKey) && event.key === "b") {
          event.preventDefault()
          setSidebarCollapsed((prev) => !prev)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isElectron])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ApiProvider>
        <div className="h-screen flex">
          {/* Collapsible Sidebar */}
          <div className={`transition-all duration-300 ${sidebarCollapsed ? "w-0" : "w-80"} overflow-hidden`}>
            <Sidebar />
          </div>

          {/* Sidebar Toggle Button */}
          <div className="flex flex-col border-r">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-10 w-10 p-0 border-b rounded-none"
              title={sidebarCollapsed ? "Show sidebar (Ctrl+B)" : "Hide sidebar (Ctrl+B)"}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </Button>
          </div>

          {/* Main Content Area with Resizable Panels */}
          <div className="flex-1">
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
                <RequestBuilder />
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
                <ResponseViewer />
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </ApiProvider>
    </ThemeProvider>
  )
}
