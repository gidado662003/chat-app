import axios from "axios";
import type { AdminChat, AdminMessage, AdminUser } from "@/lib/adminTypes";

export const adminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

adminApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle global errors
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        console.error("Session expired. Redirecting...");
        if (typeof window !== "undefined") {
          window.location.href = "/admin/login";
        }
      }

      if (status === 403) {
        console.error("Permission denied.");
      }
    }

    return Promise.reject(error);
  },
);

export const adminAPI = {
  login: async (credentials: { username: string; password: string }) => {
    const res = await adminApi.post("/admin/login", credentials);
    return res.data as { message: string };
  },
  checkAuth: async () => {
    const res = await adminApi.get("/admin/check-auth");
    return res.data as { message: string };
  },

  // Users
  getUsers: async () => {
    const res = await adminApi.get("/admin/users");
    return res.data as AdminUser[];
  },
  createUser: async (payload: {
    username: string;
    email: string;
    password: string;
  }) => {
    const res = await adminApi.post("/admin/users", payload);
    return res.data as unknown;
  },
  updateUser: async (
    id: string,
    payload: { username?: string; email?: string; password?: string },
  ) => {
    const res = await adminApi.put(`/admin/users/${id}`, payload);
    return res.data as unknown;
  },
  deleteUser: async (id: string) => {
    const res = await adminApi.delete(`/admin/users/${id}`);
    return res.data as unknown;
  },

  // Chats
  getChats: async () => {
    const res = await adminApi.get("/admin/chats");
    return res.data as AdminChat[];
  },
  getChat: async (id: string) => {
    const res = await adminApi.get(`/admin/chats/${id}`);
    return res.data as AdminChat;
  },
  getChatMessages: async (chatId: string) => {
    const res = await adminApi.get(`/admin/chats/${chatId}/messages`);
    return res.data as AdminMessage[];
  },
  deleteChat: async (id: string) => {
    const res = await adminApi.delete(`/admin/chats/${id}`);
    return res.data as unknown;
  },
  deleteMessage: async (chatId: string, messageId: string) => {
    const res = await adminApi.put(
      `/admin/chats/${chatId}/messages/${messageId}/soft-delete`,
    );
    return res.data as unknown;
  },
  undeleteMessage: async (chatId: string, messageId: string) => {
    const res = await adminApi.put(
      `/admin/chats/${chatId}/messages/${messageId}/undelete`,
    );
    return res.data as unknown;
  },
  deleteMessagePermanent: async (chatId: string, messageId: string) => {
    const res = await adminApi.delete(
      `/admin/chats/${chatId}/messages/${messageId}/permanent`,
    );
    return res.data as unknown;
  },
};
