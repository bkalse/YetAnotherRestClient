import type { Collection, RequestHistory, Environment } from "../types/api"

const STORAGE_KEYS = {
  COLLECTIONS: "api-client-collections",
  HISTORY: "api-client-history",
  ENVIRONMENTS: "api-client-environments",
  ACTIVE_ENVIRONMENT: "api-client-active-environment",
  THEME: "api-client-theme",
} as const

export class StorageManager {
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
      // Keep only last 100 requests
      const limitedHistory = history.slice(-100)
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(limitedHistory))
    } catch (error) {
      console.error("Error saving history:", error)
    }
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

    return {
      collections,
      environments,
      history,
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
      return true
    } catch (error) {
      console.error("Error importing data:", error)
      return false
    }
  }
}
