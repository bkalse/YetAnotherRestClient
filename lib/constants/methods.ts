import type { RequestMethod } from "../types/api"

export const HTTP_METHODS: RequestMethod[] = [
  { value: "GET", label: "GET", color: "text-green-600 bg-green-50" },
  { value: "POST", label: "POST", color: "text-blue-600 bg-blue-50" },
  { value: "PUT", label: "PUT", color: "text-orange-600 bg-orange-50" },
  { value: "DELETE", label: "DELETE", color: "text-red-600 bg-red-50" },
  { value: "PATCH", label: "PATCH", color: "text-purple-600 bg-purple-50" },
  { value: "HEAD", label: "HEAD", color: "text-gray-600 bg-gray-50" },
  { value: "OPTIONS", label: "OPTIONS", color: "text-indigo-600 bg-indigo-50" },
]
