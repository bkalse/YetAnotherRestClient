"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Send, Save } from "lucide-react"
import { useApi } from "@/contexts/api-context"
import { HTTP_METHODS } from "@/lib/constants/methods"
import { SaveRequestDialog } from "@/components/dialogs/save-request-dialog"
import type { Header, AuthConfig } from "@/lib/types/api"
import { v4 as uuidv4 } from "uuid"

export function RequestBuilder() {
  const {
    state,
    dispatch,
    sendRequest,
    saveRequestToCollection,
    updateRequestInCollection,
    createCollectionAndSaveRequest,
    findRequestCollection,
  } = useApi()
  const [activeTab, setActiveTab] = useState("headers")
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)

  if (!state.currentRequest) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">No request selected</h3>
          <p className="text-muted-foreground">Create a new request or select one from the sidebar</p>
        </div>
      </div>
    )
  }

  const updateRequest = (updates: any) => {
    dispatch({ type: "UPDATE_CURRENT_REQUEST", payload: updates })
  }

  const addHeader = () => {
    const newHeader: Header = {
      id: uuidv4(),
      key: "",
      value: "",
      enabled: true,
    }
    updateRequest({
      headers: [...state.currentRequest!.headers, newHeader],
    })
  }

  const updateHeader = (id: string, updates: Partial<Header>) => {
    updateRequest({
      headers: state.currentRequest!.headers.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    })
  }

  const removeHeader = (id: string) => {
    updateRequest({
      headers: state.currentRequest!.headers.filter((h) => h.id !== id),
    })
  }

  const updateAuth = (updates: Partial<AuthConfig>) => {
    updateRequest({
      auth: { ...state.currentRequest!.auth, ...updates },
    })
  }

  const handleSave = () => {
    if (!state.currentRequest) return

    // Check if this request is already saved in a collection
    const existingCollection = findRequestCollection(state.currentRequest.id)

    if (existingCollection && state.currentRequest.collectionId) {
      // Request is already saved, just update it
      const updatedRequest = {
        ...state.currentRequest,
        updatedAt: new Date().toISOString(),
      }
      updateRequestInCollection(existingCollection.id, updatedRequest)
    } else {
      // Request is not saved yet, show the save dialog
      setSaveDialogOpen(true)
    }
  }

  const handleSaveToCollection = (collectionId: string, request: any) => {
    saveRequestToCollection(collectionId, request)
  }

  const handleCreateCollection = (name: string): string => {
    return createCollectionAndSaveRequest(name)
  }

  const isRequestSaved = !!state.currentRequest.collectionId && !!findRequestCollection(state.currentRequest.id)

  return (
    <div className="flex-1 flex flex-col">
      {/* Request URL Bar */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2 mb-4">
          <Input
            placeholder="Request name"
            value={state.currentRequest.name}
            onChange={(e) => updateRequest({ name: e.target.value })}
            className="max-w-xs"
          />
          <Button
            variant={state.isRequestModified ? "default" : "outline"}
            size="sm"
            onClick={handleSave}
            disabled={!state.currentRequest.name.trim()}
          >
            <Save className="w-4 h-4 mr-2" />
            {isRequestSaved && state.isRequestModified ? "Save Changes" : isRequestSaved ? "Saved" : "Save"}
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Select value={state.currentRequest.method} onValueChange={(value) => updateRequest({ method: value })}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HTTP_METHODS.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  <span className={`px-2 py-1 rounded text-xs ${method.color}`}>{method.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Enter request URL"
            value={state.currentRequest.url}
            onChange={(e) => updateRequest({ url: e.target.value })}
            className="flex-1"
          />

          <Button onClick={sendRequest} disabled={state.isLoading || !state.currentRequest.url}>
            <Send className="w-4 h-4 mr-2" />
            {state.isLoading ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>

      {/* Request Configuration */}
      <div className="flex-1 p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="auth">Auth</TabsTrigger>
            <TabsTrigger value="params">Params</TabsTrigger>
          </TabsList>

          <TabsContent value="headers" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Headers</CardTitle>
                <Button onClick={addHeader} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Header
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {state.currentRequest.headers.map((header) => (
                    <div key={header.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={header.enabled}
                        onCheckedChange={(checked) => updateHeader(header.id, { enabled: !!checked })}
                      />
                      <Input
                        placeholder="Key"
                        value={header.key}
                        onChange={(e) => updateHeader(header.id, { key: e.target.value })}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Value"
                        value={header.value}
                        onChange={(e) => updateHeader(header.id, { value: e.target.value })}
                        className="flex-1"
                      />
                      <Button onClick={() => removeHeader(header.id)} size="sm" variant="ghost">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="body" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Request Body</CardTitle>
                <Select
                  value={state.currentRequest.body.type}
                  onValueChange={(value) =>
                    updateRequest({
                      body: { ...state.currentRequest!.body, type: value },
                    })
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="raw">Raw</SelectItem>
                    <SelectItem value="form">Form Data</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {state.currentRequest.body.type !== "none" && (
                  <Textarea
                    placeholder={
                      state.currentRequest.body.type === "json" ? '{\n  "key": "value"\n}' : "Enter request body"
                    }
                    value={state.currentRequest.body.content}
                    onChange={(e) =>
                      updateRequest({
                        body: { ...state.currentRequest!.body, content: e.target.value },
                      })
                    }
                    className="min-h-[200px] font-mono"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auth" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Authentication</CardTitle>
                <Select
                  value={state.currentRequest.auth.type}
                  onValueChange={(value) => updateAuth({ type: value as any })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Auth</SelectItem>
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                    <SelectItem value="basic">Basic Auth</SelectItem>
                    <SelectItem value="apikey">API Key</SelectItem>
                    <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {state.currentRequest.auth.type === "bearer" && (
                  <div>
                    <Label htmlFor="bearer-token">Token</Label>
                    <Input
                      id="bearer-token"
                      placeholder="Enter bearer token"
                      value={state.currentRequest.auth.bearer?.token || ""}
                      onChange={(e) =>
                        updateAuth({
                          bearer: { token: e.target.value },
                        })
                      }
                    />
                  </div>
                )}

                {state.currentRequest.auth.type === "basic" && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="basic-username">Username</Label>
                      <Input
                        id="basic-username"
                        placeholder="Enter username"
                        value={state.currentRequest.auth.basic?.username || ""}
                        onChange={(e) =>
                          updateAuth({
                            basic: {
                              ...state.currentRequest!.auth.basic,
                              username: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="basic-password">Password</Label>
                      <Input
                        id="basic-password"
                        type="password"
                        placeholder="Enter password"
                        value={state.currentRequest.auth.basic?.password || ""}
                        onChange={(e) =>
                          updateAuth({
                            basic: {
                              ...state.currentRequest!.auth.basic,
                              password: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {state.currentRequest.auth.type === "apikey" && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="apikey-key">Key</Label>
                      <Input
                        id="apikey-key"
                        placeholder="Enter key name"
                        value={state.currentRequest.auth.apikey?.key || ""}
                        onChange={(e) =>
                          updateAuth({
                            apikey: {
                              ...state.currentRequest!.auth.apikey,
                              key: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="apikey-value">Value</Label>
                      <Input
                        id="apikey-value"
                        placeholder="Enter API key"
                        value={state.currentRequest.auth.apikey?.value || ""}
                        onChange={(e) =>
                          updateAuth({
                            apikey: {
                              ...state.currentRequest!.auth.apikey,
                              value: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Add to</Label>
                      <Select
                        value={state.currentRequest.auth.apikey?.addTo || "header"}
                        onValueChange={(value) =>
                          updateAuth({
                            apikey: {
                              ...state.currentRequest!.auth.apikey,
                              addTo: value as "header" | "query",
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="header">Header</SelectItem>
                          <SelectItem value="query">Query Params</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {state.currentRequest.auth.type === "oauth2" && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="oauth-token">Access Token</Label>
                      <Input
                        id="oauth-token"
                        placeholder="Enter access token"
                        value={state.currentRequest.auth.oauth2?.accessToken || ""}
                        onChange={(e) =>
                          updateAuth({
                            oauth2: {
                              ...state.currentRequest!.auth.oauth2,
                              accessToken: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="oauth-type">Token Type</Label>
                      <Input
                        id="oauth-type"
                        placeholder="Bearer"
                        value={state.currentRequest.auth.oauth2?.tokenType || "Bearer"}
                        onChange={(e) =>
                          updateAuth({
                            oauth2: {
                              ...state.currentRequest!.auth.oauth2,
                              tokenType: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="params" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Query Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Query parameters will be extracted from the URL automatically.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Only show save dialog for new/unsaved requests */}
      {!isRequestSaved && (
        <SaveRequestDialog
          request={state.currentRequest}
          collections={state.collections}
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          onSave={handleSaveToCollection}
          onCreateCollection={handleCreateCollection}
        />
      )}
    </div>
  )
}
