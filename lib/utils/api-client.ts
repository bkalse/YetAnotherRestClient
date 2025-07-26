import type { RequestConfig, ApiResponse, Environment } from "../types/api"

export class ApiClient {
  static async sendRequest(request: RequestConfig, environment?: Environment): Promise<ApiResponse> {
    const startTime = Date.now()

    try {
      // Replace environment variables in URL
      let processedUrl = request.url
      if (environment) {
        Object.entries(environment.variables).forEach(([key, value]) => {
          processedUrl = processedUrl.replace(new RegExp(`{{${key}}}`, "g"), value)
        })
      }

      // Prepare headers
      const headers: Record<string, string> = {}

      // Add custom headers
      request.headers
        .filter((h) => h.enabled && h.key && h.value)
        .forEach((h) => {
          let value = h.value
          if (environment) {
            Object.entries(environment.variables).forEach(([key, val]) => {
              value = value.replace(new RegExp(`{{${key}}}`, "g"), val)
            })
          }
          headers[h.key] = value
        })

      // Add auth headers
      this.addAuthHeaders(headers, request.auth, environment)

      // Prepare request options
      const options: RequestInit = {
        method: request.method,
        headers,
      }

      // Add body for non-GET requests
      if (request.method !== "GET" && request.body.type !== "none") {
        if (request.body.type === "json") {
          headers["Content-Type"] = "application/json"
          let bodyContent = request.body.content
          if (environment) {
            Object.entries(environment.variables).forEach(([key, value]) => {
              bodyContent = bodyContent.replace(new RegExp(`{{${key}}}`, "g"), value)
            })
          }
          options.body = bodyContent
        } else {
          options.body = request.body.content
        }
      }

      const response = await fetch(processedUrl, options)
      const responseTime = Date.now() - startTime

      // Get response headers
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      // Get response data
      const contentType = response.headers.get("content-type") || ""
      let data: any

      if (contentType.includes("application/json")) {
        try {
          data = await response.json()
        } catch {
          data = await response.text()
        }
      } else {
        data = await response.text()
      }

      // Calculate response size
      const size = new Blob([JSON.stringify(data)]).size

      return {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data,
        responseTime,
        size,
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      throw {
        status: 0,
        statusText: "Network Error",
        headers: {},
        data: { error: error instanceof Error ? error.message : "Unknown error" },
        responseTime,
        size: 0,
      }
    }
  }

  private static addAuthHeaders(
    headers: Record<string, string>,
    auth: RequestConfig["auth"],
    environment?: Environment,
  ): void {
    switch (auth.type) {
      case "bearer":
        if (auth.bearer?.token) {
          let token = auth.bearer.token
          if (environment) {
            Object.entries(environment.variables).forEach(([key, value]) => {
              token = token.replace(new RegExp(`{{${key}}}`, "g"), value)
            })
          }
          headers["Authorization"] = `Bearer ${token}`
        }
        break

      case "basic":
        if (auth.basic?.username && auth.basic?.password) {
          const credentials = btoa(`${auth.basic.username}:${auth.basic.password}`)
          headers["Authorization"] = `Basic ${credentials}`
        }
        break

      case "apikey":
        if (auth.apikey?.key && auth.apikey?.value) {
          if (auth.apikey.addTo === "header") {
            let value = auth.apikey.value
            if (environment) {
              Object.entries(environment.variables).forEach(([key, val]) => {
                value = value.replace(new RegExp(`{{${key}}}`, "g"), val)
              })
            }
            headers[auth.apikey.key] = value
          }
        }
        break

      case "oauth2":
        if (auth.oauth2?.accessToken) {
          const tokenType = auth.oauth2.tokenType || "Bearer"
          headers["Authorization"] = `${tokenType} ${auth.oauth2.accessToken}`
        }
        break
    }
  }
}
