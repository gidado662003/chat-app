import axios from "axios";
import { UploadFilePayload } from "./documentsTypes";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const documentsApi = {
  getDepartments: async () => {
    try {
      const response = await api.get("/departments");
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getCategories: async () => {
    try {
      const response = await api.get(`/document-categories`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  createCategory: async (name: string) => {
    try {
      const response = await api.post("/document-categories", { name });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  uploadFile: async (formData: FormData) => {
    try {
      const response = await api.post("/document/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getFilesByCategory: async (category: string | string[]) => {
    try {
      const response = await api.get(`/document/files/${category}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
