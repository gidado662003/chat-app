import axios from "axios";
import { AllDataResponse } from "@/lib/internalRequestTypes";

export const requestApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

requestApi.interceptors.response.use(
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
          window.location.href = "http://10.10.253.3:8000/";
        }
      }

      if (status === 403) {
        console.error("Permission denied.");
      }
    }

    return Promise.reject(error);
  },
);

export const internlRequestAPI = {
  countList: async () => {
    try {
      const res = requestApi.get("/internalrequest/list");
      return res;
    } catch (error) {
      console.error("Count List failed", error);
    }
  },

  allData: async ({
    search,
    status,
    bank,
    cursorTimestamp,
    cursorId,
    startDate,
    endDate,
  }: {
    search?: string;
    status?: string;
    bank?: string;
    cursorTimestamp?: string;
    cursorId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      const res = await requestApi.get<AllDataResponse>(
        `/internalrequest/allrequest`,
        {
          params: {
            search,
            status,
            bank,
            cursorTimestamp,
            cursorId,
            startDate,
            endDate,
          },
        },
      );
      return res.data;
    } catch (error) {
      console.error("Fetch all data failed", error);
      throw error;
    }
  },
  dataById: async (id: string) => {
    try {
      const res = await requestApi.get(`/internalrequest/allrequest/${id}`);
      return res.data;
    } catch (error) {
      console.error("Fetch all data failed", error);
      throw error;
    }
  },
  createRequest: async (request: any) => {
    try {
      const formData = new FormData();

      formData.append("title", request.title);
      formData.append("location", request.location);
      formData.append("category", request.category);
      formData.append("requestedOn", request.requestedOn);

      formData.append("accountToPay", JSON.stringify(request.accountToPay));
      formData.append("items", JSON.stringify(request.items));

      request.attachement.forEach((file: any) => {
        formData.append("attachement", file);
      });
      const res = await requestApi.post("/internalrequest/create", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    } catch (error) {
      console.error("Create request failed", error);
      throw error;
    }
  },
  updateRequest: async (id: string, request: any) => {
    try {
      const res = await requestApi.put(
        `/internalrequest/update/${id}`,
        request,
      );
      return res.data;
    } catch (error) {
      console.error("Create request failed", error);
      throw error;
    }
  },
  getDashboardData: async () => {
    try {
      const res = await requestApi.get("/internalrequest/dashboard/metrics");
      return res.data;
    } catch (error) {
      console.error("Get dashboard data failed", error);
      throw error;
    }
  },
};
// /internalrequest/allrequest
