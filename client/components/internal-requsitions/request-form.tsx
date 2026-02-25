import { DateRange } from "react-day-picker";
import React, { useState } from "react";
import { Input } from "../ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { CreateRequisitionPayload } from "@/lib/internalRequestTypes";

function RequestForm({
  handleNextStep,
  formData,
  handleFormData,
}: {
  handleNextStep: () => void;
  formData: CreateRequisitionPayload;
  handleFormData: React.Dispatch<
    React.SetStateAction<CreateRequisitionPayload>
  >;
}) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const Locations = [
    { value: "Ikeja", label: "Ikeja" },
    { value: "Ajah", label: "Ajah" },
    { value: "Ibadan", label: "Ibadan" },
    { value: "Marina", label: "Marina" },
    { value: "General", label: "General" },
  ];
  const categories = [
    { value: "expenses", label: "Expenses" },
    { value: "equipment-procured", label: "Equipment Procured" },
    { value: "refunds", label: "Refunds" },
    { value: "other", label: "Other" },
  ];
  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="text-base md:text-lg">
              Basic Information
            </CardTitle>
            <CardDescription className="mt-1 text-sm">
              Provide the key details for your requisition request.
            </CardDescription>
          </div>
          <div className="w-full max-w-xs">
            <label
              htmlFor="requestedOn"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Date
            </label>
            <Input
              id="requestedOn"
              type="date"
              value={formData.requestedOn}
              onChange={(e) =>
                handleFormData((prev) => ({
                  ...prev,
                  requestedOn: e.target.value,
                }))
              }
              className="h-9 text-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">
            Request Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder="e.g., Office Supplies"
            className="h-9 text-sm"
            value={formData.title}
            onChange={(e) =>
              handleFormData((prev) => ({ ...prev, title: e.target.value }))
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="location">Branch</label>
            <Select
              value={formData.location}
              onValueChange={(value) =>
                handleFormData((prev) => ({ ...prev, location: value }))
              }
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                {Locations.map((location) => (
                  <SelectItem key={location.value} value={location.value}>
                    {location.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="priority">
              Category <span className="text-destructive">*</span>
            </label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                handleFormData((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2">
          <Button
            className="px-6"
            onClick={handleNextStep}
            disabled={
              formData.title.trim().length < 3 ||
              formData.category.trim() === "" ||
              formData.location.trim() === ""
            }
          >
            Next: Add Items
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default RequestForm;
