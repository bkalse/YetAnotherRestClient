"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useApi } from "@/contexts/api-context"
import { Clock, Database, CheckCircle, XCircle } from "lucide-react"

export function ResponseViewer() {
  const { state } = useApi()
  const [activeTab, setActiveTab] = useState("body")

  if (!state.response) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">No response yet</h3>
          <p className="text-muted-foreground">Send a request to see the response here</p>
        </div>
      </div>
    )
  }

  const formatJson = (data: any) => {
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-600 bg-green-50"
    if (status >= 300 && status < 400) return "text-yellow-600 bg-yellow-50"
    if (status >= 400 && status < 500) return "text-orange-600 bg-orange-50"
    if (status >= 500) return "text-red-600 bg-red-50"
    return "text-gray-600 bg-gray-50"
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Response Status Bar */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {state.response.status >= 200 && state.response.status < 300 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <Badge className={getStatusColor(state.response.status)}>
                {state.response.status} {state.response.statusText}
              </Badge>
            </div>

            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{state.response.responseTime}ms</span>
            </div>

            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Database className="w-4 h-4" />
              <span>{formatSize(state.response.size)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Response Content */}
      <div className="flex-1 p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="body">Response Body</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="raw">Raw</TabsTrigger>
          </TabsList>

          <TabsContent value="body" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Response Body</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {typeof state.response.data === "object"
                      ? formatJson(state.response.data)
                      : String(state.response.data)}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="headers" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Response Headers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(state.response.headers).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="font-medium text-sm">{key}</span>
                      <span className="text-sm text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="raw" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Raw Response</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {JSON.stringify(
                      {
                        status: state.response.status,
                        statusText: state.response.statusText,
                        headers: state.response.headers,
                        data: state.response.data,
                        responseTime: state.response.responseTime,
                        size: state.response.size,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
