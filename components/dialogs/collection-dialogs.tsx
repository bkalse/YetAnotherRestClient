"use client"

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
import { AlertTriangle, Edit3 } from "lucide-react"
import type { Collection } from "@/lib/types/api"

interface RenameCollectionDialogProps {
  collection: Collection | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRename: (id: string, newName: string) => void
}

export function RenameCollectionDialog({ collection, open, onOpenChange, onRename }: RenameCollectionDialogProps) {
  const [newName, setNewName] = useState(collection?.name || "")

  const handleRename = () => {
    if (collection && newName.trim()) {
      onRename(collection.id, newName.trim())
      onOpenChange(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && collection) {
      setNewName(collection.name)
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Rename Collection
          </DialogTitle>
          <DialogDescription>
            Enter a new name for "{collection?.name}". This will update the collection name.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="collection-name" className="text-right">
              Name
            </Label>
            <Input
              id="collection-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="col-span-3"
              placeholder="Enter collection name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRename()
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRename} disabled={!newName.trim() || newName.trim() === collection?.name}>
            Rename Collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteCollectionDialogProps {
  collection: Collection | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (id: string) => void
}

export function DeleteCollectionDialog({ collection, open, onOpenChange, onDelete }: DeleteCollectionDialogProps) {
  const [confirmText, setConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const requestCount = collection?.requests?.length || 0
  const expectedText = "DELETE"
  const canDelete = confirmText === expectedText

  const handleDelete = async () => {
    if (collection && canDelete) {
      setIsDeleting(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onDelete(collection.id)
      setIsDeleting(false)
      onOpenChange(false)
      setConfirmText("")
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setConfirmText("")
    }
    onOpenChange(isOpen)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Permanently Delete Collection
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left space-y-3">
            <p>
              You are about to <strong>permanently delete</strong> "{collection?.name}". This action{" "}
              <strong>cannot be undone</strong>.
            </p>

            {requestCount > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">Permanent Data Loss</h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      This will permanently delete{" "}
                      <strong>
                        {requestCount} request{requestCount !== 1 ? "s" : ""}
                      </strong>{" "}
                      and all associated data. This cannot be recovered.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">
                Type <code className="bg-muted px-1 py-0.5 rounded text-destructive font-mono">DELETE</code> to confirm:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="font-mono"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => handleOpenChange(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Permanently Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
