import axios from "axios";

const api = axios.create({
  // NOTE:
  // - In production behind Apache, set NEXT_PUBLIC_API_URL to "/api"
  //   (or to "https://your-domain/api") so all requests go through the
  //   reverse proxy on port 3000.
  // - In local development, set NEXT_PUBLIC_API_URL to
  //   "http://localhost:5001/api" (matching the Express port).
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = sessionStorage.getItem("erp_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - user must re-authenticate via Laravel ERP
      console.log("Token expired - user must re-authenticate via Laravel ERP");
    }
    return Promise.reject(error);
  },
);

// Authentication API functions
export const authAPI = {
  syncUserProfile: async () => {
    try {
      const response = await api.post("/user/sync");
      return response.data;
    } catch (error) {
      console.error("Sync user profile error:", error);
      throw error;
    }
  },
};

// User management functions
export async function getAllusers(search) {
  try {
    const response = await api.get("/user", {
      params: search ? { search } : {},
    });
    return response.data;
  } catch (error) {
    console.error("Get users error:", error);
    throw error;
  }
}

export async function getUserBYId(id) {
  try {
    const response = await api.get(`/user/${id}`);
    return response.data;
  } catch (error) {
    console.error("Get user error:", error);
    throw error;
  }
}

// Chat API functions
export async function createOrGetPrivateChat(otherUserId) {
  try {
    const response = await api.post("/chats/private", { otherUserId });
    return response.data;
  } catch (error) {
    console.error("Create or get private chat error:", error);
    throw error;
  }
}

export async function getPrivateChatById(id) {
  try {
    const response = await api.get(`/chats/${id}`);
    return response.data;
  } catch (error) {
    console.error("Get user error:", error);
    throw error;
  }
}

export async function getGroupInfo(chatId) {
  try {
    const response = await api.get(`/chats/group/${chatId}`);
    return response.data;
  } catch (error) {
    console.error("Get group info error:", error);
    throw error;
  }
}

export async function createGroupChat(groupData) {
  try {
    const response = await api.post("/chats/group", {
      groupName: groupData.groupName,
      groupDescription: groupData.groupDescription,
    });
    return response.data;
  } catch (error) {
    console.error("Create group chat error:", error);
    throw error;
  }
}

export async function getUserChats(query) {
  try {
    const response = await api.get(`/chats/user/chats?search=${query}`);
    return response.data;
  } catch (error) {
    console.error("Get user chats error:", error);
    throw error;
  }
}

export async function pinChat(chatId, messageId, action) {
  try {
    const response = await api.post("chats/pinMessage", {
      chatId,
      messageId,
      action,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to pIn message:", error);
    throw error;
  }
}

// Group API functions
export async function addUserToGroup(groupData) {
  try {
    const response = await api.put("/chats/group", {
      userId: groupData.userId,
      chatId: groupData.chatId,
    });
    return response.data;
  } catch (error) {
    console.error("Add user to group error:", error);
    throw error;
  }
}

export async function updateGroupAdmin(groupData) {
  try {
    const response = await api.post("/chats/group/admin", {
      userId: groupData.userId,
      chatId: groupData.chatId,
    });
    return response.data;
  } catch (error) {
    console.error("Update group admin error:", error);
    throw error;
  }
}

// Tickets API functions
export async function listTickets(params) {
  try {
    const response = await api.get("/chats/tickets", { params });
    return response.data;
  } catch (error) {
    console.error("List tickets error:", error);
    throw error;
  }
}

export async function getTicket(ticketId) {
  try {
    const response = await api.get(`/chats/tickets/${ticketId}`);
    return response.data;
  } catch (error) {
    console.error("Get ticket error:", error);
    throw error;
  }
}

export async function getTicketMessages(ticketId, limit) {
  try {
    const response = await api.get(`/chats/tickets/${ticketId}/messages`, {
      params: limit ? { limit } : {},
    });
    return response.data;
  } catch (error) {
    console.error("Get ticket messages error:", error);
    throw error;
  }
}

export async function uploadFile(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/chats/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Upload file error:", error);
    throw error;
  }
}

export async function getChatMesssages(chatId, cursorTimestamp, cursorId) {
  try {
    const response = await api.post(
      "/messages",
      { chatId },
      {
        params: {
          cursorTimestamp: cursorTimestamp || "",
          cursorId: cursorId || "",
        },
      },
    );
    return response;
  } catch (error) {
    console.error("Get message error", error);
    throw error;
  }
}

export async function deleteMessage(messageId) {
  try {
    const response = await api.put("/messages/delete", { messageId });
    return response.data;
  } catch (error) {
    console.error("Delete message error:", error);
    throw error;
  }
}

export async function isAuthenticated() {
  try {
    const response = await api.get("/user/is-authenticated");
    return response.data;
  } catch (error) {
    console.error("Is authenticated error:", error);
    throw error;
  }
}
