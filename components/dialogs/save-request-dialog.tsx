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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Plus } from "lucide-react"
import type { Collection, RequestConfig } from "@/lib/types/api"

interface SaveRequestDialogProps {
  request: RequestConfig | null
  collections: Collection[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (collectionId: string, request: RequestConfig) => void
  onCreateCollection: (name: string) => string
}

export function SaveRequestDialog({
  request,
  collections,
  open,
  onOpenChange,
  onSave,
  onCreateCollection,
}: SaveRequestDialogProps) {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("")
  const [newCollectionName, setNewCollectionName] = useState("")
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [requestName, setRequestName] = useState(request?.name || "")

  const activeCollections = collections.filter((c) => !c.deleted)

  const handleSave = () => {
    if (!request) return

    let collectionId = selectedCollectionId

    // Create new collection if needed
    if (isCreatingNew && newCollectionName.trim()) {
      collectionId = onCreateCollection(newCollectionName.trim())
    }

    if (collectionId && requestName.trim()) {
      const updatedRequest = {
        ...request,
        name: requestName.trim(),
        updatedAt: new Date().toISOString(),
      }
      onSave(collectionId, updatedRequest)
      onOpenChange(false)

      // Reset form
      setSelectedCollectionId("")
      setNewCollectionName("")
      setIsCreatingNew(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && request) {
      setRequestName(request.name)
      setSelectedCollectionId("")
      setNewCollectionName("")
      setIsCreatingNew(false)
    }
    onOpenChange(isOpen)
  }

  const canSave =
    requestName.trim() && ((isCreatingNew && newCollectionName.trim()) || (!isCreatingNew && selectedCollectionId))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            Save Request
          </DialogTitle>
          <DialogDescription>Choose a collection to save this request to, or create a new one.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="request-name" className="text-right">
              Name
            </Label>
            <Input
              id="request-name"
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              className="col-span-3"
              placeholder="Enter request name"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Collection</Label>
            <div className="col-span-3 space-y-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={!isCreatingNew ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsCreatingNew(false)}
                  className="flex-1"
                >
                  Existing
                </Button>
                <Button
                  type="button"
                  variant={isCreatingNew ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsCreatingNew(true)}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New
                </Button>
              </div>

              {!isCreatingNew ? (
                <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCollections.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No collections available. Create a new one.
                      </div>
                    ) : (
                      activeCollections.map((collection) => (
                        <SelectItem key={collection.id} value={collection.id}>
                          {collection.name} ({collection.requests.length} requests)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Enter new collection name"
                />
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Save Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
