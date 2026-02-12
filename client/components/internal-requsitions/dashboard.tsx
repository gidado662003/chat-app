"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import { DashboardData, Stats } from "@/lib/internalRequestTypes";
import {
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
} from "lucide-react";
import { DataTable } from "@/components/dashboard/data-table";

/* -------------------- TYPES -------------------- */

/* -------------------- HELPERS -------------------- */

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

const formatMonth = (year: number, month: number) =>
  new Date(year, month - 1).toLocaleString("default", {
    month: "short",
    year: "numeric",
  });

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
];

const statusColors = {
  approved: "text-green-600 bg-green-50",
  pending: "text-amber-600 bg-amber-50",
  rejected: "text-red-600 bg-red-50",
};

/* -------------------- COMPONENT -------------------- */

export default function Dashboard({ data }: { data: DashboardData }) {
  const { overview, insights } = data;
  console.log(data);

  const monthlyChartData = data.monthlyTrends.map((m) => ({
    name: formatMonth(m._id.year, m._id.month),
    amount: m.totalAmount,
    count: m.count,
    approved: m.approved,
    pending: m.pending,
    rejected: m.rejected,
  }));
  console.log(monthlyChartData);

  const categoryChartData = data.categoryCount.map((c) => ({
    name: c._id,
    value: c.count,
  }));

  const totalCategoryCount = data.categoryCount.reduce(
    (sum, c) => sum + c.count,
    0
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ---------------- OVERVIEW CARDS ---------------- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <OverviewCard
          title="Total Requests"
          value={overview.total}
          trend={overview.total > 100 ? "up" : "neutral"}
        />
        <OverviewCard
          title="Approved"
          value={overview.approved}
          trend="up"
          className="border-l-4 border-l-green-500"
        />
        <OverviewCard
          title="Pending"
          value={overview.pending}
          trend="neutral"
          className="border-l-4 border-l-amber-500"
        />
        <OverviewCard
          title="Rejected"
          value={overview.rejected}
          trend="down"
          className="border-l-4 border-l-red-500"
        />
        <OverviewCard
          title="Total Amount"
          value={formatCurrency(overview.totalAmount)}
          trend="up"
          className="lg:col-span-1"
        />
      </div>

      {/* ---------------- CHARTS SECTION ---------------- */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Trend Chart */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BarChartIcon className="h-5 w-2 text-blue-600" />
              <CardTitle className="text-lg">Monthly Spend Trend</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tickFormatter={(value) =>
                    formatCurrency(value).replace("NGN", "₦")
                  }
                  width={80}
                />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    "Amount",
                  ]}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar
                  dataKey="amount"
                  name="Total Amount"
                  radius={[4, 4, 0, 0]}
                  fill="#3b82f6"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Monthly Trend Table */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Monthly Spend Table</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={[
                { key: "name", label: "Month" },
                { key: "count", label: "Requests" },
                { key: "amount", label: "Total Amount" },
              ]}
              data={monthlyChartData.map((m) => ({
                name: m.name,
                count: <span className="font-semibold">{m.count}</span>,
                amount: (
                  <span className="font-semibold">
                    {formatCurrency(m.amount)}
                  </span>
                ),
              }))}
              striped
              getRowKey={(row) => String(row.name)}
              emptyMessage="No monthly data available"
            />
          </CardContent>
        </Card>
      </div>
      {/* Category Distribution Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Category Distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={2}
                  label={(entry) => entry.name}
                >
                  {categoryChartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} requests`, name]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Category Distribution Table */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Category Distribution Table</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={[
                { key: "name", label: "Category" },
                { key: "value", label: "Requests" },
              ]}
              data={categoryChartData.map((c) => ({
                name: c.name,
                value: <span className="font-semibold">{c.value}</span>,
              }))}
              striped
              getRowKey={(row) => String(row.name)}
              emptyMessage="No category data available"
            />
          </CardContent>
        </Card>
      </div>

      {/* ---------------- STATISTICS TABLES ---------------- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏢</span>
              <CardTitle className="text-lg">Department Statistics</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={[
                { key: "name", label: "Name" },
                { key: "count", label: "Count" },
                { key: "totalAmount", label: "Total Amount" },
                { key: "approved", label: "A" },
                { key: "pending", label: "P" },
                { key: "rejected", label: "R" },
              ]}
              data={data.departmentStats.map((item) => ({
                name: item._id || "Unknown",
                count: <span className="font-semibold">{item.count}</span>,
                totalAmount: (
                  <span className="font-semibold">
                    {formatCurrency(item.totalAmount)}
                  </span>
                ),
                approved: (
                  <span className="text-green-600 font-medium">
                    {item.approved}
                  </span>
                ),
                pending: (
                  <span className="text-amber-600 font-medium">
                    {item.pending}
                  </span>
                ),
                rejected: (
                  <span className="text-red-600 font-medium">
                    {item.rejected}
                  </span>
                ),
              }))}
              striped
              getRowKey={(row) => String(row.name)}
              emptyMessage="No department data available"
            />
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📍</span>
              <CardTitle className="text-lg">Location Statistics</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={[
                { key: "name", label: "Name" },
                { key: "count", label: "Count" },
                { key: "totalAmount", label: "Total Amount" },
                { key: "approved", label: "A" },
                { key: "pending", label: "P" },
                { key: "rejected", label: "R" },
              ]}
              data={data.locationStats.map((item) => ({
                name: item._id || "Unknown",
                count: <span className="font-semibold">{item.count}</span>,
                totalAmount: (
                  <span className="font-semibold">
                    {formatCurrency(item.totalAmount)}
                  </span>
                ),
                approved: (
                  <span className="text-green-600 font-medium">
                    {item.approved}
                  </span>
                ),
                pending: (
                  <span className="text-amber-600 font-medium">
                    {item.pending}
                  </span>
                ),
                rejected: (
                  <span className="text-red-600 font-medium">
                    {item.rejected}
                  </span>
                ),
              }))}
              striped
              getRowKey={(row) => String(row.name)}
              emptyMessage="No location data available"
            />
          </CardContent>
        </Card>
      </div>

      {/* ---------------- RECENT REQUISITIONS ---------------- */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Requisitions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Latest financial requisition requests
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={[
              { key: "title", label: "Title" },
              { key: "department", label: "Department" },
              { key: "amount", label: "Amount" },
              { key: "status", label: "Status" },
              { key: "date", label: "Date" },
            ]}
            data={data.recentRequisitions.map((req) => ({
              title: <span className="font-medium">{req.title}</span>,
              department: (
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  {req.department}
                </span>
              ),
              amount: (
                <span className="font-semibold">
                  {formatCurrency(req.totalAmount)}
                </span>
              ),
              status: (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    statusColors[req.status as keyof typeof statusColors] || ""
                  }`}
                >
                  {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                </span>
              ),
              date: (
                <span className="text-muted-foreground">
                  {new Date(req.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              ),
            }))}
            striped
            getRowKey={(_, index) => data.recentRequisitions[index]._id}
            emptyMessage="No recent requisitions found"
          />
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- REUSABLE COMPONENTS ---------------- */

function OverviewCard({
  title,
  value,
  trend = "neutral",
  className = "",
}: {
  title: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  className?: string;
}) {
  const trendConfig = {
    up: { icon: "↑", color: "text-green-600" },
    down: { icon: "↓", color: "text-red-600" },
    neutral: { icon: "→", color: "text-gray-400" },
  };

  return (
    <Card
      className={`${className} hover:shadow-md transition-all duration-200`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold">{value}</p>
          {trend !== "neutral" && (
            <span className={`text-sm font-medium ${trendConfig[trend].color}`}>
              {trendConfig[trend].icon}
            </span>
          )}
        </div>
        <div className="mt-2 h-1 w-full bg-gradient-to-r from-transparent via-muted to-transparent opacity-50"></div>
      </CardContent>
    </Card>
  );
}
