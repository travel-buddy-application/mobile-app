import { ApiError, ApiResponse } from "@/types/api";
import { config } from "./config";

// HTTP request options
interface RequestOptions {
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

// Default headers
const defaultHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

// Get authentication headers
const getAuthHeaders = (): Record<string, string> => {
  // In a real app, you'd get the token from secure storage
  const token = "your-auth-token"; // Replace with actual token management
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Build full URL
const buildUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return `${config.apiBaseUrl}/${cleanEndpoint}`;
};

// Create request with timeout and retry logic
const createRequest = async (
  url: string,
  options: RequestInit,
  retries = config.api.retryAttempts
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.api.timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // Retry logic for network errors
    if (retries > 0 && error instanceof Error && error.name === "AbortError") {
      console.warn(`Request failed, retrying... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
      return createRequest(url, options, retries - 1);
    }

    throw error;
  }
};

// Parse response
const parseResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get("content-type");

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;

    try {
      if (contentType?.includes("application/json")) {
        const errorData: ApiError = await response.json();
        errorMessage = errorData.message || errorMessage;
      } else {
        errorMessage = (await response.text()) || errorMessage;
      }
    } catch {
      // If we can't parse the error, use the default message
    }

    throw new Error(errorMessage);
  }

  if (contentType?.includes("application/json")) {
    const data: ApiResponse<T> = await response.json();
    return data.data || (data as unknown as T);
  }

  return response.text() as unknown as T;
};

// Generic HTTP request function
const request = async <T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  options: RequestOptions = {}
): Promise<T> => {
  const url = buildUrl(endpoint);
  const headers = {
    ...defaultHeaders,
    ...getAuthHeaders(),
    ...options.headers,
  };

  const requestOptions: RequestInit = {
    method,
    headers,
  };

  if (options.body && method !== "GET") {
    if (typeof options.body === "string") {
      requestOptions.body = options.body;
    } else {
      requestOptions.body = JSON.stringify(options.body);
    }
  }

  try {
    const response = await createRequest(url, requestOptions, options.retries);
    return await parseResponse<T>(response);
  } catch (error) {
    console.error(`API request failed: ${method} ${url}`, error);
    throw error;
  }
};

// HTTP utility functions
export const httpUtils = {
  /**
   * Make a GET request
   */
  get: <T>(
    endpoint: string,
    options: Omit<RequestOptions, "body"> = {}
  ): Promise<T> => {
    return request<T>(endpoint, "GET", options);
  },

  /**
   * Make a POST request
   */
  post: <T>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> => {
    return request<T>(endpoint, "POST", { ...options, body: data });
  },

  /**
   * Make a PUT request
   */
  put: <T>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> => {
    return request<T>(endpoint, "PUT", { ...options, body: data });
  },

  /**
   * Make a PATCH request
   */
  patch: <T>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> => {
    return request<T>(endpoint, "PATCH", { ...options, body: data });
  },

  /**
   * Make a DELETE request
   */
  delete: <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
    return request<T>(endpoint, "DELETE", options);
  },

  /**
   * Upload file with FormData
   */
  uploadFile: async <T>(
    endpoint: string,
    formData: FormData,
    options: Omit<RequestOptions, "body"> = {}
  ): Promise<T> => {
    const url = buildUrl(endpoint);
    const headers = {
      ...getAuthHeaders(),
      ...options.headers,
      // Don't set Content-Type for FormData, let the browser set it with boundary
    };

    const requestOptions: RequestInit = {
      method: "POST",
      headers,
      body: formData,
    };

    try {
      const response = await createRequest(
        url,
        requestOptions,
        options.retries
      );
      return await parseResponse<T>(response);
    } catch (error) {
      console.error(`File upload failed: POST ${url}`, error);
      throw error;
    }
  },

  /**
   * Download file
   */
  downloadFile: async (endpoint: string, filename?: string): Promise<Blob> => {
    const url = buildUrl(endpoint);
    const headers = getAuthHeaders();

    try {
      const response = await createRequest(url, { method: "GET", headers });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();

      // If running in a web environment and filename is provided
      if (filename && typeof document !== "undefined") {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }

      return blob;
    } catch (error) {
      console.error(`File download failed: GET ${url}`, error);
      throw error;
    }
  },
};

// Export individual functions for convenience
export const {
  get,
  post,
  put,
  patch,
  delete: del,
  uploadFile,
  downloadFile,
} = httpUtils;

// Default export
export default httpUtils;
