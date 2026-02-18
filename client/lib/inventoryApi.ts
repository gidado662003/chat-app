import axios from "axios";
import type {
  Asset,
  AssetHistory,
  InventoryItem,
  InventoryMovement,
  ProcurementBatch,
} from "@/lib/inventoryTypes";

const inventoryApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

export const inventoryAPI = {
  getInventory: async (): Promise<InventoryItem[]> => {
    const res = await inventoryApi.get<{ data: InventoryItem[] }>("/inventory");
    return res.data.data;
  },

  getAssets: async (): Promise<Asset[]> => {
    const res = await inventoryApi.get<Asset[]>("/asset");
    return res.data;
  },

  getBatches: async (): Promise<ProcurementBatch[]> => {
    const res = await inventoryApi.get<ProcurementBatch[]>(
      "/procurement-batches"
    );
    return res.data;
  },

  getBatchById: async (batchId: string): Promise<ProcurementBatch> => {
    const res = await inventoryApi.get<ProcurementBatch>(
      `/procurement-batches/${batchId}`
    );
    return res.data;
  },

  getInventoryMovements: async (
    productId?: string,
  ): Promise<InventoryMovement[]> => {
    const res = await inventoryApi.get<InventoryMovement[]>(
      "/inventory-movements",
      {
        params: productId ? { productId } : undefined,
      },
    );
    return res.data;
  },

  getAssetHistory: async (assetId: string): Promise<AssetHistory[]> => {
    const res = await inventoryApi.get<AssetHistory[]>(
      `/asset-history/${assetId}`,
    );
    return res.data;
  },

  receiveBatch: async (
    batchId: string,
    payload: {
      quantity: number;
      serialNumbers?: string[];
      performedBy?: { name?: string; email?: string };
    }
  ): Promise<ProcurementBatch> => {
    const res = await inventoryApi.post<ProcurementBatch>(
      `/procurement-batches/${batchId}`,
      payload
    );
    return res.data;
  },
};
