import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// Create a separate axios instance for file uploads with multipart/form-data
const uploadClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds for uploads
});

// Request interceptor - adds auth token
uploadClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface UploadResponse {
  success: boolean;
  url: string;
  message: string;
}

export interface MultipleUploadResponse {
  success: boolean;
  urls: string[];
  count: number;
  message: string;
}

export const uploadApi = {
  /**
   * Upload a single file
   * @param file - File to upload
   * @returns Promise with the uploaded file URL
   */
  uploadSingle: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await uploadClient.post<UploadResponse>(
      "/upload/single",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return data;
  },

  /**
   * Upload multiple files
   * @param files - Array of files to upload
   * @returns Promise with array of uploaded file URLs
   */
  uploadMultiple: async (files: File[]): Promise<MultipleUploadResponse> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const { data } = await uploadClient.post<MultipleUploadResponse>(
      "/upload/multiple",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return data;
  },

  /**
   * Delete a file by filename
   * @param filename - Name of the file to delete
   */
  deleteFile: async (filename: string): Promise<void> => {
    await uploadClient.delete(`/upload/${filename}`);
  },

  /**
   * Extract filename from URL
   * @param url - Full URL of the file (e.g., /uploads/abc123.jpg)
   * @returns The filename (e.g., abc123.jpg)
   */
  extractFilename: (url: string): string => {
    return url.split("/").pop() || "";
  },

  /**
   * Get full URL for an image
   * @param path - Relative path from backend (e.g., /uploads/abc123.jpg)
   * @returns Full URL to the image
   */
  getImageUrl: (path: string | null | undefined): string => {
    if (!path) return "";
    // If it's already a full URL, return as is
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    // Otherwise, prepend the API base URL (without /api)
    const baseUrl = API_BASE_URL.replace("/api", "");
    return `${baseUrl}${path}`;
  },
};
