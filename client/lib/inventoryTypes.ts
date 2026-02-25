export type Product = {
  _id: string;
  name: string;
  description?: string;
  category?: "equipment" | "consumable" | "other";
  unit?: string;
  status?: string;
  trackIndividually?: boolean;
};

export type EmployeeDTO = {
  id: number;
  name: string;
  department?: {
    id: number;
    name: string;
  };
};

export type InventoryItem = {
  _id: string;
  product: Product;
  quantity: number;
  location: string;
  lastUpdated: string;
};

export type ProcurementBatch = {
  _id: string;
  product: Product;
  requisition?: { _id: string; requisitionNumber?: string } | null;
  expectedQuantity: number;
  receivedQuantity: number;
  status: "awaiting_receipt" | "partially_received" | "received";
  location?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Asset = {
  _id: string;
  product: {
    _id: string;
    name: string;
    unit: string;
    status?: string;
    trackIndividually?: boolean;
    createdAt?: string;
    updatedAt?: string;
    category?: string;
  };
  batch?: string;
  serialNumber?: string;
  category?: string;
  supplier?: string;
  status: "IN_STOCK" | "ASSIGNED" | "UNDER_MAINTENANCE" | "RETIRED";
  condition?: string;
  purchaseDate?: string;
  ownership?: string;
  movements?: Array<{
    toHolderSnapshot?: any | null;
    _id: string;
    type: string;
    performedAt: string;
  }>;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  holderType?: string;
};
// Grouped summary data returned by /asset/summary
export type AssetGroup = {
  productId: string;
  productName: string;
  category?: string;
  total: number;
  inStock: number;
  assigned: number;
  underMaintenance: number;
  retired: number;
  locations: string[];
};

export type InventoryMovement = {
  _id: string;
  product: Product;
  type: "PROCUREMENT" | "SALE" | "TRANSFER" | "ADJUSTMENT" | "RETURN";
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reference?: { _id: string } | null;
  referenceModel?: string;
  location?: string;
  performedBy?: {
    name?: string;
    email?: string;
  };
  notes?: string;
  createdAt: string;
};

export type AssetEventType =
  | "ASSIGN"
  | "TRANSFER"
  | "RETURN"
  | "MAINTENANCE"
  | "DISPOSE";

export type HolderType = "EMPLOYEE" | "DEPARTMENT" | "EXTERNAL";

export interface HolderSnapshot {
  id: string;
  name: string;
  email?: string;
}

export interface PerformedBySnapshot {
  id: string;
  name: string;
  email?: string;
}

export interface AssetHistory {
  _id: string;
  asset: string;

  type: AssetEventType;

  // Status transition
  fromStatus?: string;
  toStatus: string;

  // Holder transition
  fromHolderType?: HolderType;
  fromHolderSnapshot?: HolderSnapshot | null;

  toHolderType?: HolderType;
  toHolderId?: string;
  /** Populated object ref — present when snapshot is not used */
  toHolder?: string;
  toHolderSnapshot?: HolderSnapshot | null;

  // Location
  fromLocation?: string;
  toLocation?: string;

  // Who did this
  performedById?: string;
  /** Populated object ref — present when snapshot is not used */
  performedBy?: string;
  performedBySnapshot?: PerformedBySnapshot | null;

  performedAt: string;
  notes?: string;

  createdAt: string;
  updatedAt: string;
  __v?: number;
}
