import axios from "axios";
import type {
  Asset,
  AssetHistory,
  InventoryItem,
  InventoryMovement,
  ProcurementBatch,
} from "@/lib/inventoryTypes";
import type { AssetGroup } from "@/lib/inventoryTypes";

type AssetMeta = {
  serialNumber: string;
  condition: "NEW" | "GOOD" | "FAIR" | "DAMAGED";
  category: "equipment" | "consumable" | "other";
  ownership: "COMPANY" | "CUSTOMER";
  purchaseDate: string;
  notes: string;
};

const inventoryApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api",
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

  getAssetsByID: async (assetId: string): Promise<Asset> => {
    const res = await inventoryApi.get<Asset>(`/asset/${assetId}`);
    return res.data;
  },

  getAssetsSummary: async (payload: { location?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (payload.location) params.append("location", payload.location);
    if (payload.search) params.append("search", payload.search);

    const res = await inventoryApi.get<AssetGroup[]>(
      `/asset/summary?${params.toString()}`,
    );

    return res.data;
  },

  createMovement: async (payload: any) => {
    const res = await inventoryApi.post("/asset/movements", payload);
    return res.data;
  },

  getAssetsByProduct: async (
    productId: string,
    search?: string,
  ): Promise<Asset[]> => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);

    const res = await inventoryApi.get<Asset[]>(
      `/asset/product/${productId}?${params.toString()}`,
    );
    return res.data;
  },

  getBatches: async (): Promise<ProcurementBatch[]> => {
    const res = await inventoryApi.get<ProcurementBatch[]>(
      "/procurement-batches",
    );
    return res.data;
  },

  getBatchById: async (batchId: string): Promise<ProcurementBatch> => {
    const res = await inventoryApi.get<ProcurementBatch>(
      `/procurement-batches/${batchId}`,
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
      `/asset/movements/history/${assetId}`,
    );
    return res.data;
  },

  getAssetMovementsData: async (assetId: string, userSearch?: string) => {
    const params = new URLSearchParams();

    if (userSearch) params.append("userSearch", userSearch);

    const res = await inventoryApi.get(
      `/asset/movements/${assetId}?${params.toString()}`,
    );
    return res.data;
  },

  receiveBatch: async (
    batchId: string,
    payload: {
      quantity: number;
      serialNumbers?: string[];
      assetMetas?: AssetMeta[];
    },
  ): Promise<ProcurementBatch> => {
    const res = await inventoryApi.post<ProcurementBatch>(
      `/procurement-batches/${batchId}`,
      payload,
    );
    return res.data;
  },

  addSupplier: async (payload: {
    name: string;
    contactInfo: { email: string; phone: string; address: string };
  }) => {
    const res = await inventoryApi.post("/suppliers", payload);
    return res.data;
  },

  getSuppliers: async (search?: string) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);

    const res = await inventoryApi.get("/suppliers", { params });
    return res.data;
  },
};
