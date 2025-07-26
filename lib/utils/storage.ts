import type { Collection, RequestHistory, Environment } from "../types/api"

const STORAGE_KEYS = {
  COLLECTIONS: "api-client-collections",
  HISTORY: "api-client-history",
  ENVIRONMENTS: "api-client-environments",
  ACTIVE_ENVIRONMENT: "api-client-active-environment",
  THEME: "api-client-theme",
  SETTINGS: "api-client-settings",
} as const

interface AppSettings {
  maxHistoryItems: number
  maxHistoryAge: number // in days
  autoCleanup: boolean
  maxResponseSize: number // in bytes
}

const DEFAULT_SETTINGS: AppSettings = {
  maxHistoryItems: 50, // Reduced from 100
  maxHistoryAge: 30, // Keep history for 30 days
  autoCleanup: true,
  maxResponseSize: 1024 * 1024, // 1MB max response size for history
}

export class StorageManager {
  static getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS
    } catch (error) {
      console.error("Error loading settings:", error)
      return DEFAULT_SETTINGS
    }
  }

  static saveSettings(settings: Partial<AppSettings>): void {
    try {
      const currentSettings = this.getSettings()
      const updatedSettings = { ...currentSettings, ...settings }
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings))
    } catch (error) {
      console.error("Error saving settings:", error)
    }
  }

  static getCollections(): Collection[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COLLECTIONS)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error("Error loading collections:", error)
      return []
    }
  }

  static saveCollections(collections: Collection[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections))
    } catch (error) {
      console.error("Error saving collections:", error)
      this.handleQuotaExceeded("collections")
    }
  }

  static getHistory(): RequestHistory[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error("Error loading history:", error)
      return []
    }
  }

  static saveHistory(history: RequestHistory[]): void {
    try {
      const settings = this.getSettings()
      let processedHistory = [...history]

      // Apply limits and cleanup
      if (settings.autoCleanup) {
        processedHistory = this.cleanupHistory(processedHistory, settings)
      }

      // Limit response sizes in history
      processedHistory = processedHistory.map((item) => ({
        ...item,
        response: this.limitResponseSize(item.response, settings.maxResponseSize),
      }))

      // Limit the number of items
      if (processedHistory.length > settings.maxHistoryItems) {
        processedHistory = processedHistory.slice(0, settings.maxHistoryItems)
      }

      // Try to save, with progressive fallbacks
      this.saveHistoryWithFallback(processedHistory)
    } catch (error) {
      console.error("Error saving history:", error)
      this.handleQuotaExceeded("history")
    }
  }

  private static limitResponseSize(response: any, maxSize: number): any {
    const responseStr = JSON.stringify(response)
    if (responseStr.length <= maxSize) {
      return response
    }

    // If response is too large, truncate the data but keep metadata
    const truncatedResponse = {
      ...response,
      data: {
        _truncated: true,
        _originalSize: responseStr.length,
        _message: "Response too large for history storage",
        _preview:
          typeof response.data === "string"
            ? response.data.substring(0, 1000) + "..."
            : JSON.stringify(response.data).substring(0, 1000) + "...",
      },
    }

    return truncatedResponse
  }

  private static saveHistoryWithFallback(history: RequestHistory[]): void {
    const attempts = [
      () => localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history)),
      () => {
        // Fallback 1: Reduce to half the items
        const reduced = history.slice(0, Math.floor(history.length / 2))
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(reduced))
      },
      () => {
        // Fallback 2: Keep only last 10 items with minimal data
        const minimal = history.slice(0, 10).map((item) => ({
          ...item,
          response: {
            status: item.response.status,
            statusText: item.response.statusText,
            headers: {},
            data: { _truncated: true, _message: "Data removed to save space" },
            responseTime: item.response.responseTime,
            size: item.response.size,
          },
        }))
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(minimal))
      },
      () => {
        // Fallback 3: Clear history entirely
        localStorage.removeItem(STORAGE_KEYS.HISTORY)
      },
    ]

    for (let i = 0; i < attempts.length; i++) {
      try {
        attempts[i]()
        if (i > 0) {
          console.warn(`History saved with fallback method ${i}`)
        }
        return
      } catch (error) {
        if (i === attempts.length - 1) {
          console.error("All fallback methods failed:", error)
          throw error
        }
      }
    }
  }

  private static cleanupHistory(history: RequestHistory[], settings: AppSettings): RequestHistory[] {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - settings.maxHistoryAge)

    return history.filter((item) => {
      const itemDate = new Date(item.timestamp)
      return itemDate >= cutoffDate
    })
  }

  static getEnvironments(): Environment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ENVIRONMENTS)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error("Error loading environments:", error)
      return []
    }
  }

  static saveEnvironments(environments: Environment[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ENVIRONMENTS, JSON.stringify(environments))
    } catch (error) {
      console.error("Error saving environments:", error)
      this.handleQuotaExceeded("environments")
    }
  }

  static getActiveEnvironment(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ENVIRONMENT)
  }

  static setActiveEnvironment(environmentId: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ENVIRONMENT, environmentId)
  }

  static exportData() {
    const collections = this.getCollections()
    const environments = this.getEnvironments()
    const history = this.getHistory()
    const settings = this.getSettings()

    return {
      collections,
      environments,
      history,
      settings,
      exportedAt: new Date().toISOString(),
    }
  }

  static importData(data: any): boolean {
    try {
      if (data.collections) {
        this.saveCollections(data.collections)
      }
      if (data.environments) {
        this.saveEnvironments(data.environments)
      }
      if (data.history) {
        this.saveHistory(data.history)
      }
      if (data.settings) {
        this.saveSettings(data.settings)
      }
      return true
    } catch (error) {
      console.error("Error importing data:", error)
      return false
    }
  }

  private static handleQuotaExceeded(dataType: string): void {
    console.warn(`Storage quota exceeded for ${dataType}. Attempting cleanup...`)

    // Try to free up space by cleaning old history
    if (dataType !== "history") {
      try {
        const history = this.getHistory()
        const reducedHistory = history.slice(0, 20) // Keep only 20 most recent
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(reducedHistory))
        console.log("Cleaned up history to free space")
      } catch (error) {
        console.error("Failed to cleanup history:", error)
      }
    }

    // Show user notification
    if (typeof window !== "undefined") {
      const message = `Storage is full! ${dataType === "history" ? "History" : "Data"} may not be saved properly. Consider clearing old data.`

      // Try to show a user-friendly notification
      if (window.confirm(`${message}\n\nWould you like to clear old history to free up space?`)) {
        localStorage.removeItem(STORAGE_KEYS.HISTORY)
        window.location.reload()
      }
    }
  }

  static getStorageUsage(): { used: number; total: number; percentage: number } {
    try {
      let used = 0
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length
        }
      }

      // Estimate total quota (usually 5-10MB, we'll use 5MB as conservative estimate)
      const total = 5 * 1024 * 1024 // 5MB in bytes
      const percentage = (used / total) * 100

      return { used, total, percentage }
    } catch (error) {
      return { used: 0, total: 5 * 1024 * 1024, percentage: 0 }
    }
  }

  static clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY)
    } catch (error) {
      console.error("Error clearing history:", error)
    }
  }

  static clearAllData(): void {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.error("Error clearing all data:", error)
    }
  }
}
