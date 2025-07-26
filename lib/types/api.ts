export interface RequestMethod {
  value: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS"
  label: string
  color: string
}

export interface Header {
  id: string
  key: string
  value: string
  enabled: boolean
}

export interface AuthConfig {
  type: "none" | "bearer" | "basic" | "apikey" | "oauth2"
  bearer?: {
    token: string
  }
  basic?: {
    username: string
    password: string
  }
  apikey?: {
    key: string
    value: string
    addTo: "header" | "query"
  }
  oauth2?: {
    accessToken: string
    tokenType: string
  }
}

export interface RequestConfig {
  id: string
  name: string
  method: RequestMethod["value"]
  url: string
  headers: Header[]
  body: {
    type: "none" | "json" | "form" | "raw"
    content: string
  }
  auth: AuthConfig
  createdAt: string
  updatedAt: string
  collectionId?: string // Track which collection this request belongs to
}

export interface Collection {
  id: string
  name: string
  description?: string
  requests: RequestConfig[]
  folders: Folder[]
  createdAt: string
  updatedAt: string
}

export interface Folder {
  id: string
  name: string
  requests: RequestConfig[]
  createdAt: string
}

export interface ApiResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  data: any
  responseTime: number
  size: number
}

export interface Environment {
  id: string
  name: string
  variables: Record<string, string>
  isActive: boolean
}

export interface RequestHistory {
  id: string
  request: RequestConfig
  response: ApiResponse
  timestamp: string
}
