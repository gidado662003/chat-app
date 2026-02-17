"use client";
import React, { Suspense, useEffect, useState } from "react";
import { FileText, Clock, Check, X, Package } from "lucide-react";
import RequestListCards from "@/components/internal-requsitions/card";
import DateRangePicker from "@/components/internal-requsitions/datepicker";
import { internlRequestAPI } from "@/lib/internalRequestApi";
import { CountList, InternalRequisition } from "@/lib/internalRequestTypes";
import RequestTable from "@/components/internal-requsitions/requestTable";
import InputSearch from "@/components/internal-requsitions/inputSearch";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { set } from "date-fns";

function RequisitionListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialSearch = searchParams.get("search") || "";
  const initialStatus = searchParams.get("status") || "";
  const [listCount, setListCount] = useState<CountList>();
  const [data, setData] = useState<InternalRequisition[]>();
  const [statusData, setStatusData] = useState<string>(initialStatus);
  const [searchInput, setSearchInput] = useState<string>(initialSearch);
  const [hasMore, setHasMore] = useState<boolean>();
  const [cursorTimeStamp, setCursorTimeStamp] = useState<string | undefined>();
  const [cursorId, setCursorId] = useState<string | undefined>();
  const [cursorStack, setCursorStack] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // helper for url
  const updateURL = (params: { search?: string; status?: string }) => {
    const query = new URLSearchParams();

    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);

    router.push(`?${query.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const handleListCount = async () => {
      setLoading(true);
      const res = await internlRequestAPI.countList();
      setListCount(res?.data);
    };
    handleListCount();
    setLoading(false);
  }, []);
  useEffect(() => {
    updateURL({ search: searchInput, status: statusData });
    fetchRequests(null);
  }, [statusData, searchInput, startDate, endDate]);

  const fetchRequests = async (
    cursorId?: string | null,
    cursorTimeStamp?: string,
  ) => {
    const responce = await internlRequestAPI.allData({
      search: searchInput,
      status: statusData,
      cursorTimestamp: cursorTimeStamp || "",
      cursorId: cursorId || "",
      startDate: startDate || "",
      endDate: endDate || "",
    });

    setData(responce?.data);

    setListCount(responce?.counts);

    setHasMore(responce?.hasMore);
    setCursorId(responce?.nextCursor?.id ?? "");
    setCursorTimeStamp(responce?.nextCursor?.timestamp);
  };
  const handleNext = () => {
    if (!cursorId && !cursorTimeStamp) return;
    setCursorStack((prev) => [...prev, { cursorId, cursorTimeStamp }]);
    fetchRequests(cursorId, cursorTimeStamp);
  };
  const handleBack = async () => {
    setCursorStack((prev) => {
      if (prev.length === 0) return prev;

      const newStack = [...prev];
      newStack.pop();
      const previousCursor = newStack[newStack.length - 1];
      fetchRequests(previousCursor?.cursorId, previousCursor?.cursorTimeStamp);

      return newStack;
    });
  };

  return (
    <div>
      <DateRangePicker
        onDateChange={(startDate, endDate) => {
          setStartDate(startDate);
          setEndDate(endDate);
        }}
      />

      <div className="grid grid-cols-5 gap-3 p-3">
        <div
          onClick={() => {
            setStatusData("");
          }}
        >
          <RequestListCards
            label="Total"
            amount={listCount?.countTotal}
            variant="accent"
            icon={<FileText />}
          />
        </div>
        <div
          onClick={() => {
            setStatusData("pending");
          }}
        >
          <RequestListCards
            label="Pending"
            amount={listCount?.pendingTotal}
            icon={<Clock />}
            variant="warning"
          />
        </div>
        <div
          onClick={() => {
            setStatusData("approved");
          }}
        >
          <RequestListCards
            label="Approved"
            amount={listCount?.approvedTotal}
            variant="success"
            icon={<Check />}
          />
        </div>
        <div
          onClick={() => {
            setStatusData("rejected");
          }}
        >
          <RequestListCards
            label="Rejected"
            amount={listCount?.rejectedTotal}
            variant="warning"
            icon={<X />}
          />
        </div>
        <div
          onClick={() => {
            setStatusData("outstanding");
          }}
        >
          <RequestListCards
            label="Outstanding"
            amount={listCount?.outstandingTotal}
            variant="default"
            icon={<Package />}
          />
        </div>
      </div>
      <main>
        <div className="flex items-center gap-3">
          <InputSearch onSearch={(value) => setSearchInput(value)} />
          <Button
            onClick={() => {
              setSearchInput("");
              setStatusData("");
            }}
            className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-mdext-gray-600  hover:bg-gray-100 hover:text-gray-800 transition-colors "
          >
            Clear
          </Button>
        </div>
        <RequestTable
          data={data}
          hasMore={hasMore}
          onNext={handleNext}
          onBack={handleBack}
        />
      </main>
    </div>
  );
}

function Page() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
      <RequisitionListContent />
    </Suspense>
  );
}

export default Page;
