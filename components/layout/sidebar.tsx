"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import {
  Plus,
  Folder,
  FileText,
  History,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Download,
  Upload,
  Edit3,
  Trash2,
  FolderOpen,
  Settings,
} from "lucide-react"
import { useApi } from "@/contexts/api-context"
import type { Collection, RequestConfig } from "@/lib/types/api"
import { HTTP_METHODS } from "@/lib/constants/methods"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { StorageManager } from "@/lib/utils/storage"
import { RenameCollectionDialog, DeleteCollectionDialog } from "@/components/dialogs/collection-dialogs"
import { LoadCollectionsDialog } from "@/components/dialogs/load-collections-dialog"
import { SettingsDialog } from "@/components/dialogs/settings-dialog"
import { v4 as uuidv4 } from "uuid"

export function Sidebar() {
  const {
    state,
    dispatch,
    createDefaultRequest,
    deleteRequestFromCollection,
    selectRequestWithUnsavedCheck,
    loadCollectionsFromData,
  } = useApi()
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set())
  const [showHistory, setShowHistory] = useState(false)
  const [loadDialogOpen, setLoadDialogOpen] = useState(false)
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; collection: Collection | null }>({
    open: false,
    collection: null,
  })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; collection: Collection | null }>({
    open: false,
    collection: null,
  })
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)

  const toggleCollection = (collectionId: string) => {
    const newExpanded = new Set(expandedCollections)
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId)
    } else {
      newExpanded.add(collectionId)
    }
    setExpandedCollections(newExpanded)
  }

  const createNewCollection = () => {
    const newCollection: Collection = {
      id: uuidv4(),
      name: "New Collection",
      requests: [],
      folders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    dispatch({ type: "ADD_COLLECTION", payload: newCollection })

    // Auto-expand the new collection
    setExpandedCollections((prev) => new Set([...prev, newCollection.id]))
  }

  const createNewRequest = () => {
    const newRequest = createDefaultRequest()
    dispatch({ type: "SET_CURRENT_REQUEST", payload: newRequest })
  }

  const selectRequest = async (request: RequestConfig) => {
    await selectRequestWithUnsavedCheck(request)
  }

  const handleDeleteRequest = (collectionId: string, requestId: string, requestName: string) => {
    if (window.confirm(`Are you sure you want to delete "${requestName}"? This action cannot be undone.`)) {
      deleteRequestFromCollection(collectionId, requestId)

      // If the deleted request is currently selected, clear it
      if (state.currentRequest?.id === requestId) {
        dispatch({ type: "SET_CURRENT_REQUEST", payload: null })
      }
    }
  }

  const getMethodColor = (method: string) => {
    const methodConfig = HTTP_METHODS.find((m) => m.value === method)
    return methodConfig?.color || "text-gray-600 bg-gray-50"
  }

  const exportData = () => {
    const data = StorageManager.exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `api-client-export-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleLoadCollections = (data: any, replaceExisting: boolean) => {
    loadCollectionsFromData(data, replaceExisting)
  }

  const handleRenameCollection = (id: string, newName: string) => {
    dispatch({ type: "RENAME_COLLECTION", payload: { id, name: newName } })
  }

  const handleDeleteCollection = (id: string) => {
    dispatch({ type: "PERMANENT_DELETE_COLLECTION", payload: id })
  }

  const isRequestSelected = (requestId: string) => {
    return state.currentRequest?.id === requestId
  }

  return (
    <div className="w-full h-full border-r bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">API Client</h2>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setLoadDialogOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Load Collections
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportData}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSettingsDialogOpen(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-2">
          <Button onClick={createNewRequest} className="w-full justify-start">
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
          <Button onClick={createNewCollection} variant="outline" className="w-full justify-start bg-transparent">
            <Folder className="w-4 h-4 mr-2" />
            New Collection
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4">
        <div className="space-y-1">
          <Button
            variant={!showHistory ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setShowHistory(false)}
          >
            <Folder className="w-4 h-4 mr-2" />
            Collections
          </Button>
          <Button
            variant={showHistory ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setShowHistory(true)}
          >
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
        </div>
      </div>

      <Separator />

      {/* Content */}
      <ScrollArea className="flex-1">
        {!showHistory ? (
          <div className="p-4">
            {state.collections.length === 0 ? (
              <div className="text-center py-8">
                <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-2">No collections yet</p>
                <p className="text-xs text-muted-foreground mb-4">Create your first collection or load existing ones</p>
                <Button variant="outline" size="sm" onClick={() => setLoadDialogOpen(true)} className="text-xs">
                  <Upload className="w-3 h-3 mr-1" />
                  Load Collections
                </Button>
              </div>
            ) : (
              state.collections.map((collection) => (
                <div key={collection.id} className="mb-4">
                  <div className="flex items-center justify-between p-2 hover:bg-accent rounded group">
                    <div
                      className="flex items-center flex-1 cursor-pointer"
                      onClick={() => toggleCollection(collection.id)}
                    >
                      {expandedCollections.has(collection.id) ? (
                        <ChevronDown className="w-4 h-4 mr-2" />
                      ) : (
                        <ChevronRight className="w-4 h-4 mr-2" />
                      )}
                      {expandedCollections.has(collection.id) ? (
                        <FolderOpen className="w-4 h-4 mr-2" />
                      ) : (
                        <Folder className="w-4 h-4 mr-2" />
                      )}
                      <span className="text-sm font-medium">{collection.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground mr-2">{collection.requests.length}</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            setRenameDialog({ open: true, collection })
                          }}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteDialog({ open: true, collection })
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {expandedCollections.has(collection.id) && (
                    <div className="ml-6 mt-2 space-y-1">
                      {collection.requests.length === 0 ? (
                        <div className="text-xs text-muted-foreground p-2">No requests in this collection</div>
                      ) : (
                        collection.requests.map((request) => (
                          <div
                            key={request.id}
                            className={`flex items-center justify-between p-2 rounded cursor-pointer group transition-colors ${
                              isRequestSelected(request.id)
                                ? "bg-primary/10 border border-primary/20"
                                : "hover:bg-accent"
                            }`}
                          >
                            <div className="flex items-center flex-1" onClick={() => selectRequest(request)}>
                              <FileText className="w-4 h-4 mr-2" />
                              <span className={`text-xs px-2 py-1 rounded mr-2 ${getMethodColor(request.method)}`}>
                                {request.method}
                              </span>
                              <span
                                className={`text-sm truncate ${isRequestSelected(request.id) ? "font-medium" : ""}`}
                              >
                                {request.name}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteRequest(collection.id, request.id, request.name)
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="p-4">
            {state.history.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No request history</p>
                <p className="text-xs text-muted-foreground">Send some requests to see them here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {state.history.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      isRequestSelected(item.request.id) ? "bg-primary/10 border-primary/20" : "hover:bg-accent"
                    }`}
                    onClick={() => selectRequest(item.request)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs px-2 py-1 rounded ${getMethodColor(item.request.method)}`}>
                        {item.request.method}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          item.response.status >= 200 && item.response.status < 300
                            ? "text-green-600 bg-green-50"
                            : "text-red-600 bg-red-50"
                        }`}
                      >
                        {item.response.status}
                      </span>
                    </div>
                    <div className={`text-sm truncate ${isRequestSelected(item.request.id) ? "font-medium" : ""}`}>
                      {item.request.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{item.request.url}</div>
                    <div className="text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Dialogs */}
      <LoadCollectionsDialog
        open={loadDialogOpen}
        onOpenChange={setLoadDialogOpen}
        onLoad={handleLoadCollections}
        existingCollectionsCount={state.collections.length}
      />

      <RenameCollectionDialog
        collection={renameDialog.collection}
        open={renameDialog.open}
        onOpenChange={(open) => setRenameDialog({ open, collection: null })}
        onRename={handleRenameCollection}
      />

      <DeleteCollectionDialog
        collection={deleteDialog.collection}
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, collection: null })}
        onDelete={handleDeleteCollection}
      />
      <SettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        onSettingsChange={() => {
          // Optionally refresh data or show notification
        }}
      />
    </div>
  )
}
