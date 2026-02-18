export type Product = {
  _id: string;
  name: string;
  description?: string;
  category?: "equipment" | "consumable" | "other";
  unit?: string;
  status?: string;
  trackIndividually?: boolean;
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
  product: Product;
  status: "IN_STOCK" | "ASSIGNED" | "UNDER_MAINTENANCE" | "RETIRED";
  assignedTo?: {
    name?: string;
    email?: string;
    department?: string;
  };
  location?: string;
  serialNumber?: string;
  createdAt?: string;
  updatedAt?: string;
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

export type AssetHistory = {
  _id: string;
  asset: Asset | string;
  action:
    | "CREATED"
    | "ASSIGNED"
    | "RETURNED"
    | "MAINTENANCE_STARTED"
    | "MAINTENANCE_COMPLETED"
    | "RETIRED"
    | "LOCATION_CHANGED";
  previousStatus?: string;
  newStatus?: string;
  previousLocation?: string;
  newLocation?: string;
  assignedTo?: {
    name?: string;
    email?: string;
    department?: string;
  };
  performedBy?: {
    name?: string;
    email?: string;
  };
  notes?: string;
  createdAt: string;
};

