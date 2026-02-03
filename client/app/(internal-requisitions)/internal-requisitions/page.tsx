// "use client";

// import { useEffect, useState } from "react";
// import { StatsCard } from "@/components/dashboard/stats-card";
// import {
//     Card,
//     CardContent,
//     CardDescription,
//     CardHeader,
//     CardTitle,
// } from "@/components/ui/card";
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow,
// } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { DatePickerWithRange } from "@/components/ui/date-range-picker";
// import type { DateRange } from "react-day-picker";
// import { addDays } from "date-fns";
// import {
//     FileText,
//     Clock,
//     CheckCircle,
//     XCircle,
//     TrendingUp,
//     Building,
//     PieChart,
//     BarChart3,
//     ChevronDown,
//     ChevronUp,
//     Download,
// } from "lucide-react";
// import { formatCurrency } from "@/lib/utils";
// import {
//     BarChart,
//     Bar,
//     XAxis,
//     YAxis,
//     CartesianGrid,
//     Tooltip,
//     ResponsiveContainer,
//     PieChart as RechartsPieChart,
//     Pie,
//     Cell,
//     Legend,
// } from "recharts";
// import { Button } from "@/components/ui/button";

// const CATEGORY_SERIES = [
//     { key: "expenses", label: "Expenses", color: "#2563eb" },
//     { key: "procurement", label: "Procurement", color: "#f97316" },
//     { key: "refunds", label: "Refunds", color: "#10b981" },
// ];

// // Table expand/collapse state
// type TableState = {
//     department: boolean;
//     location: boolean;
//     recent: boolean;
// };

// export default function DashboardPage() {
//     const [dateRange, setDateRange] = useState<DateRange | undefined>({
//         from: addDays(new Date(), -30),
//         to: new Date(),
//     });
//     const [metrics, setMetrics] = useState<any>(null);
//     const [loading, setLoading] = useState(true);
//     const [tableState, setTableState] = useState<TableState>({
//         department: true,
//         location: true,
//         recent: true,
//     });

//     useEffect(() => {
//         fetchDashboardData();
//     }, [dateRange]);

//     const fetchDashboardData = async () => {
//         try {
//             const params = new URLSearchParams({
//                 startDate: (dateRange?.from ?? new Date()).toISOString(),
//                 endDate: (dateRange?.to ?? new Date()).toISOString(),
//             });

//             const response = await fetch(
//                 `/api/internal-requisitions/dashboard/metrics?${params}`,
//                 {
//                     credentials: "include",
//                     headers: { Accept: "application/json" },
//                 }
//             );
//             const data = await response.json();
//             setMetrics(data);
//         } catch (error) {
//             console.error("Error fetching dashboard data:", error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const toggleTable = (table: keyof TableState) => {
//         setTableState(prev => ({ ...prev, [table]: !prev[table] }));
//     };

//     const exportToCSV = () => {
//         // Simple CSV export implementation
//         const data = [
//             ["Metric", "Value"],
//             ["Total Requests", overview?.total],
//             ["Pending Approval", overview?.pending],
//             ["Approved", overview?.approved],
//             ["Total Amount", formatCurrency(overview?.totalAmount)],
//             ["Approval Rate", `${insights.approvalRate}%`],
//             ["Avg Processing Time", `${insights.avgProcessingDays} days`],
//             ["Top Department", insights.topDepartment],
//         ];

//         const csvContent = data.map(row => row.join(",")).join("\n");
//         const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//         const link = document.createElement("a");
//         link.href = URL.createObjectURL(blob);
//         link.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`;
//         link.click();
//     };

//     if (loading || !metrics) {
//         return (
//             <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//                 <div className="text-center">
//                     <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//                     <p className="text-gray-600">Loading dashboard...</p>
//                 </div>
//             </div>
//         );
//     }

//     const {
//         overview,
//         departmentStats,
//         recentRequisitions,
//         categoryCount,
//         locationStats,
//         insights,
//     } = metrics;

//     const getCategoryTotal = (label: string) =>
//         categoryCount?.find(
//             (entry: any) => (entry?._id || "").toLowerCase() === label.toLowerCase()
//         )?.count || 0;

//     // Prepare department chart data
//     const departmentChartData = departmentStats?.map((dept: any) => ({
//         name: dept._id,
//         count: dept.count,
//         amount: dept.totalAmount / 1000,
//     })) || [];

//     // Prepare location chart data
//     const locationChartData = locationStats?.map((loc: any) => ({
//         name: loc._id || "Unknown",
//         count: loc.count,
//         amount: loc.totalAmount / 1000,
//     })) || [];

//     // Prepare category pie chart data
//     const categoryPieData = CATEGORY_SERIES.map(series => ({
//         name: series.label,
//         value: getCategoryTotal(series.label),
//         color: series.color,
//     })).filter(item => item.value > 0);

//     return (
//         <div className="min-h-screen bg-gray-50 p-4 md:p-6">
//             <div className="max-w-8xl mx-auto space-y-6">
//                 {/* Header */}
//                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//                     <div>
//                         <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
//                             Internal Requisitions Dashboard
//                         </h1>
//                         <p className="text-gray-600 mt-1">
//                             Overview of request metrics (Last 30 days)
//                         </p>
//                     </div>
//                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
//                         <DatePickerWithRange
//                             date={dateRange}
//                             onDateChange={setDateRange}
//                             className="w-full sm:w-auto"
//                         />
//                         <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={exportToCSV}
//                             className="w-full sm:w-auto"
//                         >
//                             <Download className="w-4 h-4 mr-2" />
//                             Export
//                         </Button>
//                     </div>
//                 </div>

//                 {/* Stats Grid */}
//                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//                     <StatsCard
//                         title="Total Requests"
//                         value={overview?.total}
//                         icon={<FileText size={20} />}
//                         description="All requisitions"
//                         loading={loading}
//                     />
//                     <StatsCard
//                         title="Pending"
//                         value={overview?.pending}
//                         icon={<Clock size={20} />}
//                         className="bg-yellow-50"
//                         loading={loading}
//                     />
//                     <StatsCard
//                         title="Approved"
//                         value={overview?.approved}
//                         icon={<CheckCircle size={20} />}
//                         className="bg-green-50"
//                         loading={loading}
//                     />
//                     <StatsCard
//                         title="Total Amount"
//                         value={formatCurrency(overview?.totalAmount)}
//                         description={insights?.approvalRate ? `${insights.approvalRate}% approval rate` : ""}
//                         loading={loading}
//                     />
//                 </div>

//                 {/* Quick Insights */}
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <Card>
//                         <CardHeader className="pb-2">
//                             <CardTitle className="text-sm font-medium text-gray-600">
//                                 Avg Processing Time
//                             </CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="text-2xl font-bold">
//                                 {insights?.avgProcessingDays || 0} days
//                             </div>
//                         </CardContent>
//                     </Card>
//                     <Card>
//                         <CardHeader className="pb-2">
//                             <CardTitle className="text-sm font-medium text-gray-600">
//                                 Top Department
//                             </CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="text-xl font-bold truncate">
//                                 {insights?.topDepartment || "N/A"}
//                             </div>
//                         </CardContent>
//                     </Card>
//                     <Card>
//                         <CardHeader className="pb-2">
//                             <CardTitle className="text-sm font-medium text-gray-600">
//                                 Approval Rate
//                             </CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="text-2xl font-bold text-green-600">
//                                 {insights?.approvalRate || 0}%
//                             </div>
//                         </CardContent>
//                     </Card>
//                 </div>

//                 {/* Charts Section */}
//                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                     {/* Category Distribution */}
//                     <Card>
//                         <CardHeader>
//                             <div className="flex items-center gap-2">
//                                 <PieChart className="w-5 h-5 text-gray-600" />
//                                 <CardTitle>Category Distribution</CardTitle>
//                             </div>
//                             <CardDescription>Requests by category type</CardDescription>
//                         </CardHeader>
//                         <CardContent>
//                             {categoryPieData.length > 0 ? (
//                                 <div className="h-64">
//                                     <ResponsiveContainer width="100%" height="100%">
//                                         <RechartsPieChart>
//                                             <Pie
//                                                 data={categoryPieData}
//                                                 cx="50%"
//                                                 cy="50%"
//                                                 labelLine={false}
//                                                 label={({ name, value, percent }) =>
//                                                     `${name}: ${value}`
//                                                 }
//                                                 outerRadius={80}
//                                                 fill="#8884d8"
//                                                 dataKey="value"
//                                             >
//                                                 {categoryPieData.map((entry, index) => (
//                                                     <Cell key={`cell-${index}`} fill={entry.color} />
//                                                 ))}
//                                             </Pie>
//                                             <Tooltip
//                                                 formatter={(value) => [`${value} requests`, "Count"]}
//                                             />
//                                             <Legend />
//                                         </RechartsPieChart>
//                                     </ResponsiveContainer>
//                                 </div>
//                             ) : (
//                                 <div className="h-64 flex items-center justify-center text-gray-500">
//                                     No category data available
//                                 </div>
//                             )}
//                         </CardContent>
//                     </Card>

//                     {/* Department Chart */}
//                     <Card>
//                         <CardHeader>
//                             <div className="flex items-center gap-2">
//                                 <BarChart3 className="w-5 h-5 text-gray-600" />
//                                 <CardTitle>Department Metrics</CardTitle>
//                             </div>
//                             <CardDescription>Requests by department</CardDescription>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="h-64">
//                                 <ResponsiveContainer width="100%" height="100%">
//                                     <BarChart
//                                         data={departmentChartData}
//                                         margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
//                                     >
//                                         <CartesianGrid strokeDasharray="3 3" />
//                                         <XAxis
//                                             dataKey="name"
//                                             angle={-45}
//                                             textAnchor="end"
//                                             height={60}
//                                             fontSize={12}
//                                         />
//                                         <YAxis fontSize={12} />
//                                         <Tooltip
//                                             formatter={(value) => [value, "Requests"]}
//                                             labelFormatter={(label) => `Department: ${label}`}
//                                         />
//                                         <Bar
//                                             dataKey="count"
//                                             name="Requests"
//                                             fill="#2563eb"
//                                             radius={[4, 4, 0, 0]}
//                                         />
//                                     </BarChart>
//                                 </ResponsiveContainer>
//                             </div>
//                         </CardContent>
//                     </Card>
//                 </div>

//                 {/* Department Table - Always Expanded */}
//                 <Card>
//                     <CardHeader>
//                         <div className="flex items-center justify-between">
//                             <div className="flex items-center gap-2">
//                                 <Building className="w-5 h-5 text-gray-600" />
//                                 <CardTitle>Department Overview</CardTitle>
//                             </div>
//                             <Button
//                                 variant="ghost"
//                                 size="sm"
//                                 onClick={() => toggleTable("department")}
//                             >
//                                 {tableState.department ? (
//                                     <ChevronUp className="w-4 h-4" />
//                                 ) : (
//                                     <ChevronDown className="w-4 h-4" />
//                                 )}
//                             </Button>
//                         </div>
//                         <CardDescription>
//                             Complete department-wise breakdown
//                         </CardDescription>
//                     </CardHeader>
//                     <CardContent className={!tableState.department ? "hidden" : ""}>
//                         <div className="overflow-x-auto border rounded-lg">
//                             <Table>
//                                 <TableHeader className="bg-gray-50">
//                                     <TableRow>
//                                         <TableHead className="font-semibold">Department</TableHead>
//                                         <TableHead className="text-right font-semibold">Count</TableHead>
//                                         <TableHead className="text-right font-semibold">Total Amount</TableHead>
//                                         <TableHead className="text-center font-semibold">Pending</TableHead>
//                                         <TableHead className="text-right font-semibold">Pending Amount</TableHead>
//                                         <TableHead className="text-center font-semibold">Approved</TableHead>
//                                         <TableHead className="text-right font-semibold">Approved Amount</TableHead>
//                                         <TableHead className="text-center font-semibold">Rejected</TableHead>
//                                         <TableHead className="text-right font-semibold">Rejected Amount</TableHead>
//                                     </TableRow>
//                                 </TableHeader>
//                                 <TableBody>
//                                     {departmentStats?.map((dept: any, index: number) => (
//                                         <TableRow key={dept._id} className={index % 2 === 0 ? "bg-gray-50/50" : ""}>
//                                             <TableCell className="font-medium">{dept._id}</TableCell>
//                                             <TableCell className="text-right">{dept.count}</TableCell>
//                                             <TableCell className="text-right font-medium">
//                                                 {formatCurrency(dept.totalAmount)}
//                                             </TableCell>
//                                             <TableCell className="text-center">
//                                                 <Badge variant="secondary" className="min-w-[60px]">
//                                                     {dept.pending}
//                                                 </Badge>
//                                             </TableCell>
//                                             <TableCell className="text-right text-yellow-600 font-medium">
//                                                 {formatCurrency(dept.pendingAmount || 0)}
//                                             </TableCell>
//                                             <TableCell className="text-center">
//                                                 <Badge variant="default" className="bg-green-500 min-w-[60px]">
//                                                     {dept.approved}
//                                                 </Badge>
//                                             </TableCell>
//                                             <TableCell className="text-right text-green-600 font-medium">
//                                                 {formatCurrency(dept.approvedAmount || 0)}
//                                             </TableCell>
//                                             <TableCell className="text-center">
//                                                 <Badge variant="destructive" className="min-w-[60px]">
//                                                     {dept.rejected}
//                                                 </Badge>
//                                             </TableCell>
//                                             <TableCell className="text-right text-red-600 font-medium">
//                                                 {formatCurrency(dept.rejectedAmount || 0)}
//                                             </TableCell>
//                                         </TableRow>
//                                     ))}
//                                 </TableBody>
//                             </Table>
//                         </div>
//                     </CardContent>
//                 </Card>

//                 {/* Location Table - Always Expanded */}
//                 <Card>
//                     <CardHeader>
//                         <div className="flex items-center justify-between">
//                             <div className="flex items-center gap-2">
//                                 <Building className="w-5 h-5 text-gray-600" />
//                                 <CardTitle>Location Overview</CardTitle>
//                             </div>
//                             <Button
//                                 variant="ghost"
//                                 size="sm"
//                                 onClick={() => toggleTable("location")}
//                             >
//                                 {tableState.location ? (
//                                     <ChevronUp className="w-4 h-4" />
//                                 ) : (
//                                     <ChevronDown className="w-4 h-4" />
//                                 )}
//                             </Button>
//                         </div>
//                         <CardDescription>
//                             Complete location-wise breakdown
//                         </CardDescription>
//                     </CardHeader>
//                     <CardContent className={!tableState.location ? "hidden" : ""}>
//                         <div className="overflow-x-auto border rounded-lg">
//                             <Table>
//                                 <TableHeader className="bg-gray-50">
//                                     <TableRow>
//                                         <TableHead className="font-semibold">Location</TableHead>
//                                         <TableHead className="text-right font-semibold">Count</TableHead>
//                                         <TableHead className="text-right font-semibold">Total Amount</TableHead>
//                                         <TableHead className="text-center font-semibold">Pending</TableHead>
//                                         <TableHead className="text-right font-semibold">Pending Amount</TableHead>
//                                         <TableHead className="text-center font-semibold">Approved</TableHead>
//                                         <TableHead className="text-right font-semibold">Approved Amount</TableHead>
//                                         <TableHead className="text-center font-semibold">Rejected</TableHead>
//                                         <TableHead className="text-right font-semibold">Rejected Amount</TableHead>
//                                     </TableRow>
//                                 </TableHeader>
//                                 <TableBody>
//                                     {locationStats?.map((loc: any, index: number) => (
//                                         <TableRow key={loc._id || "unknown"} className={index % 2 === 0 ? "bg-gray-50/50" : ""}>
//                                             <TableCell className="font-medium">
//                                                 {loc._id || "Not specified"}
//                                             </TableCell>
//                                             <TableCell className="text-right">{loc.count}</TableCell>
//                                             <TableCell className="text-right font-medium">
//                                                 {formatCurrency(loc.totalAmount)}
//                                             </TableCell>
//                                             <TableCell className="text-center">
//                                                 <Badge variant="secondary" className="min-w-[60px]">
//                                                     {loc.pending}
//                                                 </Badge>
//                                             </TableCell>
//                                             <TableCell className="text-right text-yellow-600 font-medium">
//                                                 {formatCurrency(loc.pendingAmount || 0)}
//                                             </TableCell>
//                                             <TableCell className="text-center">
//                                                 <Badge variant="default" className="bg-green-500 min-w-[60px]">
//                                                     {loc.approved}
//                                                 </Badge>
//                                             </TableCell>
//                                             <TableCell className="text-right text-green-600 font-medium">
//                                                 {formatCurrency(loc.approvedAmount || 0)}
//                                             </TableCell>
//                                             <TableCell className="text-center">
//                                                 <Badge variant="destructive" className="min-w-[60px]">
//                                                     {loc.rejected}
//                                                 </Badge>
//                                             </TableCell>
//                                             <TableCell className="text-right text-red-600 font-medium">
//                                                 {formatCurrency(loc.rejectedAmount || 0)}
//                                             </TableCell>
//                                         </TableRow>
//                                     ))}
//                                 </TableBody>
//                             </Table>
//                         </div>
//                     </CardContent>
//                 </Card>

//                 {/* Recent Requisitions Table - Always Expanded */}
//                 <Card>
//                     <CardHeader>
//                         <div className="flex items-center justify-between">
//                             <div>
//                                 <CardTitle>Recent Requisitions</CardTitle>
//                                 <CardDescription>Latest request submissions</CardDescription>
//                             </div>
//                             <Button
//                                 variant="ghost"
//                                 size="sm"
//                                 onClick={() => toggleTable("recent")}
//                             >
//                                 {tableState.recent ? (
//                                     <ChevronUp className="w-4 h-4" />
//                                 ) : (
//                                     <ChevronDown className="w-4 h-4" />
//                                 )}
//                             </Button>
//                         </div>
//                     </CardHeader>
//                     <CardContent className={!tableState.recent ? "hidden" : ""}>
//                         <div className="overflow-x-auto border rounded-lg">
//                             <Table>
//                                 <TableHeader className="bg-gray-50">
//                                     <TableRow>
//                                         <TableHead className="font-semibold">Request #</TableHead>
//                                         <TableHead className="font-semibold">Title</TableHead>
//                                         <TableHead className="font-semibold">Department</TableHead>
//                                         <TableHead className="font-semibold">Amount</TableHead>
//                                         <TableHead className="font-semibold">Status</TableHead>
//                                         <TableHead className="font-semibold">Date</TableHead>
//                                     </TableRow>
//                                 </TableHeader>
//                                 <TableBody>
//                                     {recentRequisitions?.map((req: any, index: number) => (
//                                         <TableRow key={req._id} className={index % 2 === 0 ? "bg-gray-50/50" : ""}>
//                                             <TableCell className="font-mono font-medium">
//                                                 {req.requisitionNumber}
//                                             </TableCell>
//                                             <TableCell className="max-w-[200px] truncate" title={req.title}>
//                                                 {req.title}
//                                             </TableCell>
//                                             <TableCell>{req.department}</TableCell>
//                                             <TableCell className="font-medium">
//                                                 {formatCurrency(req.totalAmount)}
//                                             </TableCell>
//                                             <TableCell>
//                                                 <Badge
//                                                     variant={
//                                                         req.status === "approved"
//                                                             ? "default"
//                                                             : req.status === "pending"
//                                                                 ? "secondary"
//                                                                 : "destructive"
//                                                     }
//                                                     className={
//                                                         req.status === "approved"
//                                                             ? "bg-green-500"
//                                                             : req.status === "pending"
//                                                                 ? "bg-yellow-500"
//                                                                 : ""
//                                                     }
//                                                 >
//                                                     {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
//                                                 </Badge>
//                                             </TableCell>
//                                             <TableCell className="text-gray-600">
//                                                 {new Date(req.createdAt).toLocaleDateString()}
//                                             </TableCell>
//                                         </TableRow>
//                                     ))}
//                                 </TableBody>
//                             </Table>
//                         </div>
//                     </CardContent>
//                 </Card>
//             </div>
//         </div>
//     );
// }
import React from 'react'

function page() {
    return (
        <div>page </div>
    )
}

export default page