// app/assets/[id]/movements/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { inventoryAPI } from "@/lib/inventoryApi";
import { laravelAuthAPI } from "@/lib/laravelAPI";
import EmployeeCombobox from "@/components/employees/EmployeeCombobox";
import {
  ArrowLeft,
  Loader2,
  Package,
  MapPin,
  User,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmployeeDTO } from "@/lib/inventoryTypes";

// ── Types ────────────────────────────────────────────────────────────────────

type MovementType =
  | "ASSIGN"
  | "RETURN"
  | "TRANSFER"
  | "RELOCATE"
  | "MAINTENANCE_OUT"
  | "MAINTENANCE_RETURN"
  | "DISPOSE";

type Asset = {
  _id: string;
  serialNumber: string;
  status: string;
  location: string;
  condition: string;
  ownership: string;
  product: { _id: string; name: string; category: string };
  holder?: { _id: string; name: string };
  holderType?: string;
};

type Vendor = {
  _id: string;
  name: string;
  contactInfo: { email: string; phone: string; address: string };
};

type Customer = {
  id: number | string;
  clients: string;
  [key: string]: unknown;
};

// ── Constants ────────────────────────────────────────────────────────────────

const MOVEMENT_META: Record<
  MovementType,
  { label: string; description: string; color: string; bg: string }
> = {
  ASSIGN: {
    label: "Assign",
    description: "Assign to an employee or customer",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
  },
  RETURN: {
    label: "Return",
    description: "Return asset to warehouse",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
  },
  TRANSFER: {
    label: "Transfer",
    description: "Transfer to another holder",
    color: "text-violet-700",
    bg: "bg-violet-50 border-violet-200",
  },
  RELOCATE: {
    label: "Relocate",
    description: "Move to a different location",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  MAINTENANCE_OUT: {
    label: "Send for Maintenance",
    description: "Send to vendor for maintenance",
    color: "text-orange-700",
    bg: "bg-orange-50 border-orange-200",
  },
  MAINTENANCE_RETURN: {
    label: "Return from Maintenance",
    description: "Receive back from maintenance",
    color: "text-teal-700",
    bg: "bg-teal-50 border-teal-200",
  },
  DISPOSE: {
    label: "Dispose",
    description: "Permanently retire this asset",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
  },
};

const STATUS_COLORS: Record<string, string> = {
  IN_STOCK: "bg-emerald-100 text-emerald-800 border-emerald-200",
  ASSIGNED: "bg-blue-100 text-blue-800 border-blue-200",
  UNDER_MAINTENANCE: "bg-amber-100 text-amber-800 border-amber-200",
  RETIRED: "bg-slate-100 text-slate-600 border-slate-200",
  RETURNED: "bg-teal-100 text-teal-800 border-teal-200",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
      <AlertTriangle className="h-3 w-3" />
      {msg}
    </p>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NewMovementPage() {
  const router = useRouter();
  const params = useParams();
  const assetId = params.assetId as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [employees, setEmployees] = useState<EmployeeDTO[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  const [formData, setFormData] = useState({
    type: "" as MovementType | "",
    toStatus: "",
    toLocation: "",
    toHolderType: "",

    toHolderId: "",

    toHolderSnapshot: { id: "", name: "", email: "" },
    reason: "",
    performedAt: new Date().toISOString().slice(0, 16),

    performedById: "",
    performedBySnapshot: { id: "", name: "", email: "" },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Fetch asset + vendors ──────────────────────────────────────────────────
  useEffect(() => {
    async function fetchAssetData() {
      try {
        const data = await inventoryAPI.getAssetMovementsData(assetId);
        setAsset(data.asset);
        setVendors(data.vendors ?? []);
      } catch {
        toast.error("Failed to load asset data");
      } finally {
        setLoading(false);
      }
    }
    fetchAssetData();
  }, [assetId]);

  // ── Fetch employees (Laravel) ──────────────────────────────────────────────
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const data: EmployeeDTO[] =
          await laravelAuthAPI.getEmployees(employeeSearch);
        setEmployees(data);
      } catch {
        toast.error("Failed to load employees");
      }
    }
    fetchEmployees();
  }, [employeeSearch]);

  // ── Fetch customers (Laravel) ──────────────────────────────────────────────
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const data: Customer[] =
          await laravelAuthAPI.getCustomers(customerSearch);
        setCustomers(data);
      } catch {
        toast.error("Failed to load customers");
      }
    }
    fetchCustomers();
  }, [customerSearch]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const isAssetRetired = asset?.status === "RETIRED";

  const remainingStatus: Record<MovementType, string> = {
    ASSIGN: "ASSIGNED",
    RETURN: "IN_STOCK",
    TRANSFER: "ASSIGNED",
    MAINTENANCE_OUT: "UNDER_MAINTENANCE",
    MAINTENANCE_RETURN: "IN_STOCK",
    RELOCATE: asset?.status ?? "",
    DISPOSE: "RETIRED",
  };

  const allowedHolderTypes: Record<MovementType, string[]> = {
    ASSIGN: ["EMPLOYEE", "CUSTOMER"],
    RETURN: ["WAREHOUSE"],
    TRANSFER: ["EMPLOYEE", "CUSTOMER"],
    MAINTENANCE_OUT: ["VENDOR"],
    MAINTENANCE_RETURN: ["WAREHOUSE"],
    RELOCATE: [],
    DISPOSE: [],
  };

  const isAllowed = (type: MovementType): boolean => {
    if (isAssetRetired || !asset) return false;
    switch (type) {
      case "ASSIGN":
        return ["IN_STOCK", "RETURNED"].includes(asset.status);
      case "RETURN":
        return asset.status === "ASSIGNED";
      case "TRANSFER":
        return asset.status === "ASSIGNED";
      case "RELOCATE":
        return asset.status !== "RETIRED";
      case "MAINTENANCE_OUT":
        return ["IN_STOCK", "ASSIGNED"].includes(asset.status);
      case "MAINTENANCE_RETURN":
        return asset.status === "UNDER_MAINTENANCE";
      case "DISPOSE":
        return asset.status !== "RETIRED";
      default:
        return false;
    }
  };

  const holderTypesForSelected = formData.type
    ? (allowedHolderTypes[formData.type as MovementType] ?? [])
    : [];

  const holdersForType = (): Array<{
    id: string;
    name: string;
    sub?: string;
  }> => {
    switch (formData.toHolderType) {
      case "CUSTOMER":
        return customers.map((c) => ({
          id: String(c.id),
          name: c.clients,
        }));
      case "VENDOR":
        return vendors.map((v) => ({
          id: v._id,
          name: v.name,
        }));
      case "WAREHOUSE":
        return [{ id: "wh1", name: "Main Warehouse" }];
      default:
        return [];
    }
  };

  const needsHolder =
    formData.type && !["RELOCATE", "DISPOSE"].includes(formData.type);
  const needsLocation = formData.type && formData.type !== "DISPOSE";

  // ── Reset dependent fields when type changes ───────────────────────────────

  useEffect(() => {
    if (!formData.type) return;
    setFormData((prev) => ({
      ...prev,
      toStatus: remainingStatus[formData.type as MovementType] ?? "",
      toHolderType: "",
      toHolderId: "",
      toHolderSnapshot: { id: "", name: "", email: "" },
      toLocation: formData.type === "RELOCATE" ? prev.toLocation : "",
    }));
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.type]);

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.type) e.type = "Movement type is required";
    if (!formData.performedById)
      e.performedById = "Select who performed this movement";
    if (isAssetRetired) e.general = "Cannot move a retired asset";

    if (formData.type === "RELOCATE") {
      if (!formData.toLocation) e.toLocation = "Location is required";
      else if (formData.toLocation === asset?.location)
        e.toLocation = "Must differ from current location";
    }
    if (needsHolder) {
      if (!formData.toHolderType) e.toHolderType = "Holder type is required";
      if (!formData.toHolderId) e.toHolderId = "Holder is required";
    }
    if (needsLocation && !formData.toLocation) {
      e.toLocation = "Location is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        asset: assetId,
        type: formData.type,
        performedById: formData.performedById,
        performedBySnapshot: formData.performedBySnapshot,
        ...(formData.toStatus && { toStatus: formData.toStatus }),
        ...(formData.toHolderType && { toHolderType: formData.toHolderType }),
        ...(formData.toHolderId && {
          toHolderId: formData.toHolderId,
          toHolderSnapshot: formData.toHolderSnapshot,
        }),
        ...(formData.toLocation && { toLocation: formData.toLocation }),
        ...(formData.reason && { reason: formData.reason }),
        ...(formData.performedAt && { performedAt: formData.performedAt }),
      };
      await inventoryAPI.createMovement(payload);
      toast.success("Movement recorded successfully");
      router.refresh();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast.error(
        axiosErr?.response?.data?.error ?? "Failed to record movement",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Generic field setter for simple string fields
  const set = (field: string) => (val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => {
      const n = { ...prev };
      delete n[field];
      return n;
    });
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500">Loading asset data…</p>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-red-500">Asset not found.</p>
      </div>
    );
  }

  const selectedMeta = formData.type
    ? MOVEMENT_META[formData.type as MovementType]
    : null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="mx-auto px-2 py-2 space-y-6">
        {/* ── Page title ── */}
        <div className="flex items-start gap-4">
          <div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {asset.product?.name}
            </p>
          </div>
        </div>

        {/* ── Asset context strip ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Current Asset State
            </p>
          </div>
          <div className="px-4 py-3 grid grid-cols-3 divide-x divide-slate-100">
            <div className="pr-4 flex items-start gap-2">
              <Package className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 mb-1">Serial Number</p>
                <p className="text-sm font-semibold text-slate-800 font-mono">
                  {asset.serialNumber}
                </p>
              </div>
            </div>
            <div className="px-4 flex items-start gap-2">
              <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 mb-1">Location</p>
                <p className="text-sm font-semibold text-slate-800">
                  {asset.location || "—"}
                </p>
              </div>
            </div>
            <div className="pl-4 flex items-start gap-2">
              <User className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 mb-1">Status</p>
                <StatusBadge status={asset.status} />
              </div>
            </div>
          </div>
          {asset.holder?.name && (
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-500">
              Current holder:{" "}
              <span className="font-medium text-slate-700">
                {asset.holder.name}
              </span>
              {asset.holderType && (
                <span className="ml-1 text-slate-400">
                  ({asset.holderType.toLowerCase()})
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Retired warning ── */}
        {isAssetRetired && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            This asset is <strong>RETIRED</strong> and cannot be moved.
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Movement type grid */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800">
                Movement Type <span className="text-red-500">*</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select the type of movement to record
              </p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              {(Object.keys(MOVEMENT_META) as MovementType[]).map((type) => {
                const meta = MOVEMENT_META[type];
                const allowed = isAllowed(type);
                const selected = formData.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={!allowed || submitting}
                    onClick={() => set("type")(type)}
                    className={`
                      text-left px-3.5 py-3 rounded-lg border transition-all text-sm
                      ${selected ? `${meta.bg} ${meta.color} border-current ring-1 ring-current/20 font-medium` : ""}
                      ${!selected && allowed ? "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700" : ""}
                      ${!allowed ? "opacity-35 cursor-not-allowed border-slate-100 text-slate-400" : ""}
                    `}
                  >
                    <div className="font-medium leading-tight">
                      {meta.label}
                    </div>
                    <div
                      className={`text-xs mt-0.5 ${selected ? "opacity-80" : "text-slate-400"}`}
                    >
                      {meta.description}
                    </div>
                  </button>
                );
              })}
            </div>
            <FieldError msg={errors.type} />
          </div>

          {/* Details card — shown once type selected */}
          {formData.type && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div
                className={`px-5 py-3 border-b flex items-center gap-2 ${selectedMeta?.bg}`}
              >
                <CheckCircle2 className={`h-4 w-4 ${selectedMeta?.color}`} />
                <span
                  className={`text-sm font-semibold ${selectedMeta?.color}`}
                >
                  {selectedMeta?.label}
                </span>
                {formData.toStatus && (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    <StatusBadge status={formData.toStatus} />
                  </>
                )}
              </div>

              <div className="p-5 space-y-5">
                {/* Performed by + Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Performed By <span className="text-red-500">*</span>
                    </label>
                    <EmployeeCombobox
                      employees={employees}
                      value={
                        employees.find(
                          (emp) => String(emp.id) === formData.performedById,
                        ) ?? null
                      }
                      onSelect={(emp) => {
                        setFormData((prev) => ({
                          ...prev,
                          performedById: String(emp.id),
                          performedBySnapshot: {
                            id: String(emp.id),
                            name: emp.name,
                            email: "",
                          },
                        }));
                        setErrors((prev) => {
                          const n = { ...prev };
                          delete n.performedById;
                          return n;
                        });
                      }}
                      onSearch={setEmployeeSearch}
                      disabled={submitting}
                      hasError={!!errors.performedById}
                    />
                    <FieldError msg={errors.performedById} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Date & Time
                    </label>
                    <Input
                      type="datetime-local"
                      value={formData.performedAt}
                      onChange={(e) => set("performedAt")(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Location */}
                {needsLocation && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      {formData.type === "RELOCATE"
                        ? "New Location"
                        : "Location"}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.toLocation}
                      onChange={(e) => set("toLocation")(e.target.value)}
                      placeholder={
                        formData.type === "RELOCATE"
                          ? `Current: ${asset.location}`
                          : "Enter location"
                      }
                      disabled={submitting}
                      className={errors.toLocation ? "border-red-400" : ""}
                    />
                    <FieldError msg={errors.toLocation} />
                  </div>
                )}

                {/* Holder type + holder */}
                {needsHolder && holderTypesForSelected.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Holder Type <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={formData.toHolderType}
                        onValueChange={(v) => {
                          setFormData((prev) => ({
                            ...prev,
                            toHolderType: v,
                            toHolderId: "",
                            toHolderSnapshot: { id: "", name: "", email: "" },
                          }));
                          setErrors((prev) => {
                            const n = { ...prev };
                            delete n.toHolderType;
                            return n;
                          });
                        }}
                        disabled={submitting}
                      >
                        <SelectTrigger
                          className={
                            errors.toHolderType ? "border-red-400" : ""
                          }
                        >
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {holderTypesForSelected.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t.charAt(0) + t.slice(1).toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError msg={errors.toHolderType} />
                    </div>

                    {formData.toHolderType && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Holder <span className="text-red-500">*</span>
                        </label>

                        {/* ── Employee → combobox ── */}
                        {formData.toHolderType === "EMPLOYEE" ? (
                          <EmployeeCombobox
                            employees={employees}
                            value={
                              employees.find(
                                (emp) => String(emp.id) === formData.toHolderId,
                              ) ?? null
                            }
                            onSelect={(emp) => {
                              setFormData((prev) => ({
                                ...prev,
                                toHolderId: String(emp.id),
                                toHolderSnapshot: {
                                  id: String(emp.id),
                                  name: emp.name,
                                  email: "",
                                },
                              }));
                              setErrors((prev) => {
                                const n = { ...prev };
                                delete n.toHolderId;
                                return n;
                              });
                            }}
                            onSearch={setEmployeeSearch}
                            disabled={submitting}
                            hasError={!!errors.toHolderId}
                          />
                        ) : (
                          /* ── All other holder types → select ── */
                          <Select
                            value={formData.toHolderId}
                            onValueChange={(v) => {
                              const selected = holdersForType().find(
                                (h) => h.id === v,
                              );
                              setFormData((prev) => ({
                                ...prev,
                                toHolderId: v,
                                toHolderSnapshot: {
                                  id: v,
                                  name: selected?.name ?? "",
                                  email: selected?.sub ?? "",
                                },
                              }));
                              setErrors((prev) => {
                                const n = { ...prev };
                                delete n.toHolderId;
                                return n;
                              });
                            }}
                            disabled={submitting}
                          >
                            <SelectTrigger
                              className={
                                errors.toHolderId ? "border-red-400" : ""
                              }
                            >
                              <SelectValue
                                placeholder={`Select ${formData.toHolderType.toLowerCase()}`}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {holdersForType().map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  <span className="font-medium">
                                    {item.name}
                                  </span>
                                  {item.sub && (
                                    <span className="text-slate-400 text-xs ml-1">
                                      {item.sub}
                                    </span>
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        <FieldError msg={errors.toHolderId} />
                      </div>
                    )}
                  </div>
                )}

                {/* Dispose warning */}
                {formData.type === "DISPOSE" && (
                  <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">
                      This will permanently <strong>retire</strong> the asset.
                      No further movements will be possible.
                    </p>
                  </div>
                )}

                {/* Reason */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Reason / Notes
                  </label>
                  <Textarea
                    value={formData.reason}
                    onChange={(e) => set("reason")(e.target.value)}
                    placeholder="Add context or notes about this movement…"
                    rows={3}
                    disabled={submitting}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* General errors */}
          {errors.general && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {errors.general}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <Button
              variant="outline"
              type="button"
              asChild
              disabled={submitting}
            >
              <Link href={`/assets/${assetId}`}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={isAssetRetired || !formData.type || submitting}
              className="min-w-[160px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording…
                </>
              ) : (
                "Record Movement"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
