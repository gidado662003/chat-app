"use client";
import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import RequestForm from "@/components/internal-requsitions/request-form";
import RequisitionItems from "@/components/internal-requsitions/request-items";
import { CreateRequisitionPayload } from "@/lib/internalRequestTypes";
import RequestPreview from "@/components/internal-requsitions/request-preview";
import { internlRequestAPI } from "@/lib/internalRequestApi";
import { toast } from "sonner";
function page() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState<boolean>();
  const [formData, setFormData] = useState<CreateRequisitionPayload>({
    title: "",
    location: "",
    category: "",
    requestedOn: new Date().toISOString().split("T")[0],
    accountToPay: {
      accountName: "",
      accountNumber: "",
      bankName: "",
    },
    items: [],
    attachement: [],
  });
  console.log("loading", loading);
  const handleNextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleCreateRequest = async () => {
    setLoading(true);

    try {
      await internlRequestAPI.createRequest(formData);

      toast.success("Request created successfully");
      setCurrentStep(1);

      setFormData({
        title: "",
        location: "",
        category: "",
        requestedOn: new Date().toISOString().split("T")[0],
        accountToPay: {
          accountName: "",
          accountNumber: "",
          bankName: "",
        },
        items: [],
        attachement: [],
      });
    } catch (error) {
      console.error("Error creating request:", error);
      toast.error("Failed to create request");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      {/* <header className='flex flex-col gap-2'>
                <h1 className='text-2xl font-bold'>Create Request</h1>
                <p className='text-sm text-muted-foreground'>Fill in the details below to create a new payment request</p>
            </header> */}
      <main className="mt-4">
        <Card>
          <CardContent className="flex p-4 justify-between items-center">
            <button
              onClick={() => setCurrentStep(1)}
              className="cursor-pointer text-sm font-medium"
            >
              <span
                className={`text-primary ${currentStep === 1 ? "text-white font-bold bg-black rounded-full px-2 py-1" : "text-muted-foreground"}`}
              >
                1
              </span>{" "}
              Basic Information
            </button>
            <button
              onClick={() => setCurrentStep(2)}
              className="cursor-pointer text-sm font-medium"
            >
              <span
                className={`text-primary ${currentStep === 2 ? "text-white font-bold bg-black rounded-full px-2 py-1" : "text-muted-foreground"}`}
              >
                2
              </span>{" "}
              Descriptions & Payment
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="cursor-pointer text-sm font-medium"
            >
              <span
                className={`text-primary ${currentStep === 3 ? "text-white font-bold bg-black rounded-full px-2 py-1" : "text-muted-foreground"}`}
              >
                3
              </span>{" "}
              Review & Submit
            </button>
          </CardContent>
        </Card>
        <div className="mt-6">
          <div className="p-4">
            {currentStep === 1 && (
              <RequestForm
                handleNextStep={handleNextStep}
                formData={formData}
                handleFormData={setFormData}
              />
            )}
            {currentStep === 2 && (
              <RequisitionItems
                formData={formData}
                setFormData={setFormData}
                onBack={handlePreviousStep}
                onNext={handleNextStep}
              />
            )}
            {currentStep === 3 && (
              <RequestPreview
                formData={formData}
                setFormData={setFormData}
                onBack={handlePreviousStep}
                onNext={handleCreateRequest}
                handleCreateRequest={handleCreateRequest}
                loading={loading}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
export default page;
