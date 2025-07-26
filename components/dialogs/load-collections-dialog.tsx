"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Upload, AlertTriangle, FileText, Folder } from "lucide-react"

interface LoadCollectionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoad: (data: any, replaceExisting: boolean) => void
  existingCollectionsCount: number
}

export function LoadCollectionsDialog({
  open,
  onOpenChange,
  onLoad,
  existingCollectionsCount,
}: LoadCollectionsDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileData, setFileData] = useState<any>(null)
  const [showReplaceDialog, setShowReplaceDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          setFileData(data)
        } catch (error) {
          console.error("Error parsing JSON:", error)
          alert("Invalid JSON file. Please select a valid export file.")
          setSelectedFile(null)
          setFileData(null)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleLoad = () => {
    if (!fileData) return

    if (existingCollectionsCount > 0) {
      setShowReplaceDialog(true)
    } else {
      performLoad(false)
    }
  }

  const performLoad = async (replaceExisting: boolean) => {
    if (!fileData) return

    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)) // Small delay for UX
      onLoad(fileData, replaceExisting)
      onOpenChange(false)
      resetDialog()
    } catch (error) {
      console.error("Error loading data:", error)
      alert("Error loading collections. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetDialog = () => {
    setSelectedFile(null)
    setFileData(null)
    setShowReplaceDialog(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetDialog()
    }
    onOpenChange(isOpen)
  }

  const getFileStats = () => {
    if (!fileData) return null

    const collections = fileData.collections || []
    const totalRequests = collections.reduce((sum: number, col: any) => sum + (col.requests?.length || 0), 0)
    const environments = fileData.environments || []
    const history = fileData.history || []

    return {
      collections: collections.length,
      requests: totalRequests,
      environments: environments.length,
      history: history.length,
    }
  }

  const stats = getFileStats()

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Load Collections
            </DialogTitle>
            <DialogDescription>Load collections, environments, and history from an exported file.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="file-input" className="text-right">
                File
              </Label>
              <div className="col-span-3">
                <Input
                  id="file-input"
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
              </div>
            </div>

            {selectedFile && (
              <div className="col-span-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">{selectedFile.name}</span>
                </div>
                <div className="text-sm text-muted-foreground">Size: {(selectedFile.size / 1024).toFixed(1)} KB</div>
              </div>
            )}

            {stats && (
              <div className="col-span-4 p-4 border rounded-lg">
                <h4 className="font-medium mb-3">File Contents:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-blue-600" />
                    <span>{stats.collections} Collections</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span>{stats.requests} Requests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-purple-600" />
                    <span>{stats.environments} Environments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-orange-600" />
                    <span>{stats.history} History Items</span>
                  </div>
                </div>
              </div>
            )}

            {existingCollectionsCount > 0 && stats && (
              <div className="col-span-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      You have {existingCollectionsCount} existing collections
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                      You can choose to merge with existing data or replace it completely.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleLoad} disabled={!fileData || isLoading}>
              {isLoading ? "Loading..." : "Load Collections"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Choose Load Method
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-3">
              <p>You have existing collections. How would you like to load the new data?</p>

              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium text-green-700 dark:text-green-300">Merge with Existing</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add new collections alongside your existing ones. Duplicate names will be renamed automatically.
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium text-red-700 dark:text-red-300">Replace All Data</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Remove all existing collections and replace with the loaded data. This cannot be undone.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setShowReplaceDialog(false)}>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                setShowReplaceDialog(false)
                performLoad(false)
              }}
              disabled={isLoading}
            >
              Merge with Existing
            </Button>
            <AlertDialogAction
              onClick={() => {
                setShowReplaceDialog(false)
                performLoad(true)
              }}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Replace All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
