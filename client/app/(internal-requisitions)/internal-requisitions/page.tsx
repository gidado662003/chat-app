"use client";
import React, { useEffect, useState } from "react";
import { internlRequestAPI } from "@/lib/internalRequestApi";
import Dashboard from "@/components/internal-requsitions/dashboard";
import { DashboardData } from "@/lib/internalRequestTypes";
function page() {
  const [data, setData] = useState<DashboardData>();
  useEffect(() => {
    const fetchDashboardData = async () => {
      const res = await internlRequestAPI.getDashboardData();
      console.log(res);
      setData(res);
    };
    fetchDashboardData();
  }, []);
  return (
    <>
      {data ? (
        <Dashboard data={data} />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-muted border-t-foreground animate-spin" />
          <p className="text-sm text-muted-foreground">Loading Dashboard...</p>
        </div>
      )}
    </>
  );
}

export default page;
