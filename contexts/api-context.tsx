"use client";

import type React from "react";
import { createContext, useContext, useReducer, useEffect } from "react";
import type {
  Collection,
  RequestConfig,
  RequestHistory,
  Environment,
  ApiResponse,
} from "@/lib/types/api";
import { StorageManager } from "@/lib/utils/storage";
import { ApiClient } from "@/lib/utils/api-client";
import { v4 as uuidv4 } from "uuid";

interface ApiState {
  collections: Collection[];
  currentRequest: RequestConfig | null;
  isRequestModified: boolean;
  history: RequestHistory[];
  environments: Environment[];
  activeEnvironment: Environment | null;
  isLoading: boolean;
  response: ApiResponse | null;
}

type ApiAction =
  | { type: "SET_COLLECTIONS"; payload: Collection[] }
  | { type: "ADD_COLLECTION"; payload: Collection }
  | { type: "UPDATE_COLLECTION"; payload: Collection }
  | { type: "PERMANENT_DELETE_COLLECTION"; payload: string }
  | { type: "RENAME_COLLECTION"; payload: { id: string; name: string } }
  | {
      type: "DELETE_REQUEST_FROM_COLLECTION";
      payload: { collectionId: string; requestId: string };
    }
  | { type: "SET_CURRENT_REQUEST"; payload: RequestConfig | null }
  | { type: "UPDATE_CURRENT_REQUEST"; payload: Partial<RequestConfig> }
  | { type: "SET_REQUEST_MODIFIED"; payload: boolean }
  | {
      type: "ADD_REQUEST_TO_COLLECTION";
      payload: { collectionId: string; request: RequestConfig };
    }
  | {
      type: "UPDATE_REQUEST_IN_COLLECTION";
      payload: { collectionId: string; request: RequestConfig };
    }
  | { type: "SET_HISTORY"; payload: RequestHistory[] }
  | { type: "ADD_TO_HISTORY"; payload: RequestHistory }
  | { type: "SET_ENVIRONMENTS"; payload: Environment[] }
  | { type: "SET_ACTIVE_ENVIRONMENT"; payload: Environment | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_RESPONSE"; payload: ApiResponse | null }
  | {
      type: "LOAD_DATA";
      payload: {
        collections: Collection[];
        history: RequestHistory[];
        environments: Environment[];
        replaceExisting: boolean;
      };
    };

const initialState: ApiState = {
  collections: [],
  currentRequest: null,
  isRequestModified: false,
  history: [],
  environments: [],
  activeEnvironment: null,
  isLoading: false,
  response: null,
};

function generateUniqueCollectionName(
  name: string,
  existingCollections: Collection[]
): string {
  const existingNames = existingCollections.map((c) => c.name);
  let uniqueName = name;
  let counter = 1;

  while (existingNames.includes(uniqueName)) {
    uniqueName = `${name} (${counter})`;
    counter++;
  }

  return uniqueName;
}

function apiReducer(state: ApiState, action: ApiAction): ApiState {
  switch (action.type) {
    case "SET_COLLECTIONS":
      return { ...state, collections: action.payload };

    case "ADD_COLLECTION":
      return { ...state, collections: [...state.collections, action.payload] };

    case "UPDATE_COLLECTION":
      return {
        ...state,
        collections: state.collections.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };

    case "PERMANENT_DELETE_COLLECTION":
      return {
        ...state,
        collections: state.collections.filter((c) => c.id !== action.payload),
      };

    case "RENAME_COLLECTION":
      return {
        ...state,
        collections: state.collections.map((c) =>
          c.id === action.payload.id
            ? {
                ...c,
                name: action.payload.name,
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
      };

    case "DELETE_REQUEST_FROM_COLLECTION":
      return {
        ...state,
        collections: state.collections.map((c) =>
          c.id === action.payload.collectionId
            ? {
                ...c,
                requests: c.requests.filter(
                  (r) => r.id !== action.payload.requestId
                ),
              }
            : c
        ),
      };

    case "SET_CURRENT_REQUEST":
      return {
        ...state,
        currentRequest: action.payload,
        isRequestModified: false,
      };

    case "UPDATE_CURRENT_REQUEST":
      return {
        ...state,
        currentRequest: state.currentRequest
          ? { ...state.currentRequest, ...action.payload }
          : null,
        isRequestModified: true,
      };

    case "SET_REQUEST_MODIFIED":
      return { ...state, isRequestModified: action.payload };

    case "ADD_REQUEST_TO_COLLECTION":
      const newRequest = {
        ...action.payload.request,
        collectionId: action.payload.collectionId,
      };
      return {
        ...state,
        collections: state.collections.map((c) =>
          c.id === action.payload.collectionId
            ? {
                ...c,
                requests: [...c.requests, newRequest],
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
        currentRequest:
          state.currentRequest?.id === newRequest.id
            ? newRequest
            : state.currentRequest,
        isRequestModified: false,
      };

    case "UPDATE_REQUEST_IN_COLLECTION":
      const updatedRequest = {
        ...action.payload.request,
        collectionId: action.payload.collectionId,
      };
      return {
        ...state,
        collections: state.collections.map((c) =>
          c.id === action.payload.collectionId
            ? {
                ...c,
                requests: c.requests.map((r) =>
                  r.id === action.payload.request.id ? updatedRequest : r
                ),
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
        currentRequest:
          state.currentRequest?.id === updatedRequest.id
            ? updatedRequest
            : state.currentRequest,
        isRequestModified: false,
      };

    case "SET_HISTORY":
      return { ...state, history: action.payload };

    case "ADD_TO_HISTORY":
      return { ...state, history: [action.payload, ...state.history] };

    case "SET_ENVIRONMENTS":
      return { ...state, environments: action.payload };

    case "SET_ACTIVE_ENVIRONMENT":
      return { ...state, activeEnvironment: action.payload };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_RESPONSE":
      return { ...state, response: action.payload };

    case "LOAD_DATA":
      const { collections, history, environments, replaceExisting } =
        action.payload;

      let newCollections: Collection[];
      let newHistory: RequestHistory[];
      let newEnvironments: Environment[];

      if (replaceExisting) {
        // Replace all existing data
        newCollections = collections.map((col) => ({
          ...col,
          requests: col.requests.map((req) => ({
            ...req,
            collectionId: col.id,
          })),
        }));
        newHistory = history;
        newEnvironments = environments;
      } else {
        // Merge with existing data
        const mergedCollections = [...state.collections];

        // Add new collections with unique names
        collections.forEach((newCol) => {
          const uniqueName = generateUniqueCollectionName(
            newCol.name,
            mergedCollections
          );
          const collectionWithUniqueId = {
            ...newCol,
            id: uuidv4(), // Generate new ID to avoid conflicts
            name: uniqueName,
            requests: newCol.requests.map((req) => ({
              ...req,
              id: uuidv4(), // Generate new request IDs too
              collectionId: newCol.id,
            })),
          };
          mergedCollections.push(collectionWithUniqueId);
        });

        newCollections = mergedCollections;
        newHistory = [...state.history, ...history];
        newEnvironments = [...state.environments, ...environments];
      }

      return {
        ...state,
        collections: newCollections,
        history: newHistory,
        environments: newEnvironments,
        currentRequest: replaceExisting ? null : state.currentRequest,
        response: replaceExisting ? null : state.response,
      };

    default:
      return state;
  }
}

const ApiContext = createContext<{
  state: ApiState;
  dispatch: React.Dispatch<ApiAction>;
  sendRequest: () => Promise<void>;
  createDefaultRequest: () => RequestConfig;
  saveRequestToCollection: (
    collectionId: string,
    request: RequestConfig
  ) => void;
  updateRequestInCollection: (
    collectionId: string,
    request: RequestConfig
  ) => void;
  createCollectionAndSaveRequest: (collectionName: string) => string;
  deleteRequestFromCollection: (
    collectionId: string,
    requestId: string
  ) => void;
  selectRequestWithUnsavedCheck: (request: RequestConfig) => Promise<boolean>;
  findRequestCollection: (requestId: string) => Collection | null;
  getRequestResponse: (requestId: string) => ApiResponse | null;
  loadCollectionsFromData: (data: any, replaceExisting: boolean) => void;
  handleElectronImport: (filePath: string) => Promise<void>;
  handleElectronExport: (filePath: string) => Promise<void>;
} | null>(null);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(apiReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    const collections = StorageManager.getCollections();
    const history = StorageManager.getHistory();
    const environments = StorageManager.getEnvironments();
    const activeEnvId = StorageManager.getActiveEnvironment();

    // Only add sample collection if no collections exist and no data in localStorage
    if (collections.length === 0) {
      const sampleCollection: Collection = {
        id: uuidv4(),
        name: "My API Collection",
        description: "Sample collection for testing",
        requests: [
          {
            id: uuidv4(),
            name: "Get Users",
            method: "GET",
            url: "https://jsonplaceholder.typicode.com/users",
            headers: [],
            body: { type: "none", content: "" },
            auth: { type: "none" },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: uuidv4(),
            name: "Create User",
            method: "POST",
            url: "https://jsonplaceholder.typicode.com/users",
            headers: [
              {
                id: uuidv4(),
                key: "Content-Type",
                value: "application/json",
                enabled: true,
              },
            ],
            body: {
              type: "json",
              content:
                '{\n  "name": "John Doe",\n  "email": "john@example.com"\n}',
            },
            auth: { type: "none" },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        folders: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add collectionId to requests
      sampleCollection.requests = sampleCollection.requests.map((req) => ({
        ...req,
        collectionId: sampleCollection.id,
      }));

      const updatedCollections = [sampleCollection];
      StorageManager.saveCollections(updatedCollections);
      dispatch({ type: "SET_COLLECTIONS", payload: updatedCollections });
    } else {
      // Ensure all requests have collectionId
      const updatedCollections = collections.map((collection) => ({
        ...collection,
        requests: collection.requests.map((req) => ({
          ...req,
          collectionId: req.collectionId || collection.id,
        })),
      }));

      dispatch({ type: "SET_COLLECTIONS", payload: updatedCollections });
    }

    dispatch({ type: "SET_HISTORY", payload: history });
    dispatch({ type: "SET_ENVIRONMENTS", payload: environments });

    if (activeEnvId) {
      const activeEnv = environments.find((e) => e.id === activeEnvId);
      if (activeEnv) {
        dispatch({ type: "SET_ACTIVE_ENVIRONMENT", payload: activeEnv });
      }
    }
  }, []);

  // Save collections to localStorage whenever they change
  useEffect(() => {
    if (state.collections.length > 0) {
      StorageManager.saveCollections(state.collections);
    }
  }, [state.collections]);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    StorageManager.saveHistory(state.history);
  }, [state.history]);

  // Save environments to localStorage whenever they change
  useEffect(() => {
    StorageManager.saveEnvironments(state.environments);
  }, [state.environments]);

  const createDefaultRequest = (): RequestConfig => ({
    id: uuidv4(),
    name: "New Request",
    method: "GET",
    url: "",
    headers: [],
    body: {
      type: "none",
      content: "",
    },
    auth: {
      type: "none",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const findRequestCollection = (requestId: string): Collection | null => {
    return (
      state.collections.find((collection) =>
        collection.requests.some((request) => request.id === requestId)
      ) || null
    );
  };

  const getRequestResponse = (requestId: string): ApiResponse | null => {
    const historyItem = state.history.find(
      (item) => item.request.id === requestId
    );
    return historyItem?.response || null;
  };

  const saveRequestToCollection = (
    collectionId: string,
    request: RequestConfig
  ) => {
    // Check if request already exists in collection
    const collection = state.collections.find((c) => c.id === collectionId);
    const existingRequest = collection?.requests.find(
      (r) => r.id === request.id
    );

    if (existingRequest) {
      // Update existing request
      dispatch({
        type: "UPDATE_REQUEST_IN_COLLECTION",
        payload: { collectionId, request },
      });
    } else {
      // Add new request
      dispatch({
        type: "ADD_REQUEST_TO_COLLECTION",
        payload: { collectionId, request },
      });
    }
  };

  const updateRequestInCollection = (
    collectionId: string,
    request: RequestConfig
  ) => {
    dispatch({
      type: "UPDATE_REQUEST_IN_COLLECTION",
      payload: { collectionId, request },
    });
  };

  const deleteRequestFromCollection = (
    collectionId: string,
    requestId: string
  ) => {
    dispatch({
      type: "DELETE_REQUEST_FROM_COLLECTION",
      payload: { collectionId, requestId },
    });
  };

  const createCollectionAndSaveRequest = (collectionName: string): string => {
    const newCollection: Collection = {
      id: uuidv4(),
      name: collectionName,
      requests: [],
      folders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch({ type: "ADD_COLLECTION", payload: newCollection });
    return newCollection.id;
  };

  const loadCollectionsFromData = (data: any, replaceExisting: boolean) => {
    const collections = data.collections || [];
    const history = data.history || [];
    const environments = data.environments || [];

    dispatch({
      type: "LOAD_DATA",
      payload: { collections, history, environments, replaceExisting },
    });
  };

  const sendRequest = async () => {
    if (!state.currentRequest) return;

    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_RESPONSE", payload: null });

    try {
      const response = await ApiClient.sendRequest(
        state.currentRequest,
        state.activeEnvironment || undefined
      );

      dispatch({ type: "SET_RESPONSE", payload: response });

      // Add to history
      const historyItem: RequestHistory = {
        id: uuidv4(),
        request: { ...state.currentRequest },
        response,
        timestamp: new Date().toISOString(),
      };

      dispatch({ type: "ADD_TO_HISTORY", payload: historyItem });
    } catch (error) {
      dispatch({ type: "SET_RESPONSE", payload: error as ApiResponse });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const selectRequestWithUnsavedCheck = async (
    request: RequestConfig
  ): Promise<boolean> => {
    if (state.isRequestModified) {
      return new Promise((resolve) => {
        const result = window.confirm(
          "You have unsaved changes. Do you want to discard them and continue?"
        );
        if (result) {
          dispatch({ type: "SET_CURRENT_REQUEST", payload: request });
          // Load the response for this request if it exists
          const response = getRequestResponse(request.id);
          dispatch({ type: "SET_RESPONSE", payload: response });
        }
        resolve(result);
      });
    } else {
      dispatch({ type: "SET_CURRENT_REQUEST", payload: request });
      // Load the response for this request if it exists
      const response = getRequestResponse(request.id);
      dispatch({ type: "SET_RESPONSE", payload: response });
      return true;
    }
  };

  const handleElectronImport = async (filePath: string) => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.readFile(filePath);
        if (result.success && result.data) {
          const data = JSON.parse(result.data);
          loadCollectionsFromData(data, false); // Default to merge
        }
      } catch (error) {
        console.error("Error importing data:", error);
      }
    }
  };

  const handleElectronExport = async (filePath: string) => {
    if (window.electronAPI) {
      try {
        const data = StorageManager.exportData();
        const result = await window.electronAPI.writeFile(
          filePath,
          JSON.stringify(data, null, 2)
        );
        if (!result.success) {
          console.error("Error exporting data:", result.error);
        }
      } catch (error) {
        console.error("Error exporting data:", error);
      }
    }
  };

  return (
    <ApiContext.Provider
      value={{
        state,
        dispatch,
        sendRequest,
        createDefaultRequest,
        saveRequestToCollection,
        updateRequestInCollection,
        createCollectionAndSaveRequest,
        deleteRequestFromCollection,
        selectRequestWithUnsavedCheck,
        findRequestCollection,
        getRequestResponse,
        loadCollectionsFromData,
        handleElectronImport,
        handleElectronExport,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
}
