"use client";

import { useEffect, useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { SupplierDialog } from "./addSupplierModal";
import { inventoryAPI } from "@/lib/inventoryApi";

export type Supplier = {
  _id: string;
  name: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
};

// exporting the type makes it easier to reuse elsewhere (e.g. inventoryApi.ts)

type SuppliersListProps = {
  value: Supplier | null;
  onSelect: (supplier: Supplier) => void;
};

function SuppliersList({ value, onSelect }: SuppliersListProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [reloadFlag, setReloadFlag] = useState(false); // flag to trigger reload after adding supplier
  /* ---------------- FETCH WITH DEBOUNCE ---------------- */

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await inventoryAPI.getSuppliers(search);
        setSuppliers(data);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, reloadFlag]); // also refetch when reloadFlag changes

  // Callback to trigger reload after adding supplier
  const handleSupplierAdded = () => {
    setReloadFlag((prev) => !prev); // toggle flag to trigger useEffect
  };

  /* ---------------- RENDER ---------------- */

  return (
    <Combobox<Supplier>
      items={suppliers}
      itemToStringValue={(supplier) => supplier?.name ?? ""}
      onValueChange={(supplier) => {
        if (supplier) {
          onSelect(supplier);
          setSearch(supplier.name); // reflect selection in input
        }
      }}
    >
      <ComboboxInput
        placeholder={loading ? "Loading..." : "Select supplier..."}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full"
      />

      <ComboboxContent className="w-[320px]">
        <ComboboxEmpty>
          <div className="flex flex-col gap-2 p-2">
            <p className="text-sm text-muted-foreground">No supplier found</p>
            <SupplierDialog setReload={handleSupplierAdded} />
          </div>
        </ComboboxEmpty>

        <ComboboxList>
          {(supplier) => (
            <ComboboxItem key={supplier._id} value={supplier}>
              <div className="flex flex-col">
                <span className="font-medium">{supplier.name}</span>
                <span className="text-xs text-muted-foreground">
                  {supplier?.contactInfo?.email}
                </span>
              </div>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export default SuppliersList;
