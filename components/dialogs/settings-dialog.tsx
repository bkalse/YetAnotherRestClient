"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Settings, Trash2, AlertTriangle, HardDrive } from "lucide-react"
import { StorageManager } from "@/lib/utils/storage"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSettingsChange?: () => void
}

export function SettingsDialog({ open, onOpenChange, onSettingsChange }: SettingsDialogProps) {
  const [settings, setSettings] = useState({
    maxHistoryItems: 50,
    maxHistoryAge: 30,
    autoCleanup: true,
  })
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 0, percentage: 0 })
  const [showClearDialog, setShowClearDialog] = useState<"history" | "all" | null>(null)

  useEffect(() => {
    if (open) {
      const currentSettings = StorageManager.getSettings()
      setSettings(currentSettings)
      setStorageUsage(StorageManager.getStorageUsage())
    }
  }, [open])

  const handleSave = () => {
    StorageManager.saveSettings(settings)
    onSettingsChange?.()
    onOpenChange(false)
  }

  const handleClearHistory = () => {
    StorageManager.clearHistory()
    setStorageUsage(StorageManager.getStorageUsage())
    setShowClearDialog(null)
    onSettingsChange?.()
  }

  const handleClearAllData = () => {
    StorageManager.clearAllData()
    setShowClearDialog(null)
    onSettingsChange?.()
    window.location.reload()
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const getStorageColor = (percentage: number) => {
    if (percentage < 50) return "bg-green-500"
    if (percentage < 80) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </DialogTitle>
            <DialogDescription>Manage your application settings and storage.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Storage Usage */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                <Label className="text-base font-medium">Storage Usage</Label>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Used: {formatBytes(storageUsage.used)}</span>
                  <span>
                    {storageUsage.percentage.toFixed(1)}% of {formatBytes(storageUsage.total)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getStorageColor(storageUsage.percentage)}`}
                    style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}
                  />
                </div>
                {storageUsage.percentage > 80 && (
                  <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Storage is getting full. Consider clearing old data.</span>
                  </div>
                )}
              </div>
            </div>

            {/* History Settings */}
            <div className="space-y-4">
              <Label className="text-base font-medium">History Management</Label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max-history">Max History Items</Label>
                  <Input
                    id="max-history"
                    type="number"
                    min="10"
                    max="200"
                    value={settings.maxHistoryItems}
                    onChange={(e) =>
                      setSettings({ ...settings, maxHistoryItems: Number.parseInt(e.target.value) || 50 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-age">Max Age (days)</Label>
                  <Input
                    id="max-age"
                    type="number"
                    min="1"
                    max="365"
                    value={settings.maxHistoryAge}
                    onChange={(e) => setSettings({ ...settings, maxHistoryAge: Number.parseInt(e.target.value) || 30 })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-cleanup"
                  checked={settings.autoCleanup}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoCleanup: !!checked })}
                />
                <Label htmlFor="auto-cleanup" className="text-sm">
                  Automatically cleanup old history items
                </Label>
              </div>
            </div>

            {/* Data Management */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Data Management</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowClearDialog("history")} className="flex-1">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear History
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setShowClearDialog("all")} className="flex-1">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Data
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear History Confirmation */}
      <AlertDialog open={showClearDialog === "history"} onOpenChange={() => setShowClearDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Clear Request History
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all request history. Your collections and requests will not be affected. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearHistory} className="bg-orange-600 hover:bg-orange-700">
              Clear History
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Data Confirmation */}
      <AlertDialog open={showClearDialog === "all"} onOpenChange={() => setShowClearDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Clear All Data
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete ALL data including collections, requests, history, and settings. This action
              cannot be undone and will reload the application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAllData} className="bg-destructive hover:bg-destructive/90">
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
