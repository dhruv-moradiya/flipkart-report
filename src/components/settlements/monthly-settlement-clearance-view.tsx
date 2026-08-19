"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  PaginationState,
} from "@tanstack/react-table";
import {
  CheckCircle2,
  Clock,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Search,
  Download,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Calendar,
  Loader2,
  Sparkles,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NativeSelect } from "@/components/ui/native-select";
import {
  useSettlementClearance,
  OrderClearanceItem,
  MonthlyClearanceBreakdown,
} from "@/hooks/use-settlement-clearance";

interface MonthlySettlementClearanceViewProps {
  initialPeriod?: string;
}

export function MonthlySettlementClearanceView({
  initialPeriod = "all-time",
}: MonthlySettlementClearanceViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(initialPeriod);
  const [orderFilter, setOrderFilter] = useState<"ALL" | "SETTLED" | "PENDING">(
    "ALL",
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useSettlementClearance(
    selectedPeriod === "all-time" ? undefined : selectedPeriod,
  );

  // Cached full breakdown to keep dropdown items stable
  const cachedBreakdown = useRef<MonthlyClearanceBreakdown[]>([]);
  if (data?.monthlyBreakdown && data.monthlyBreakdown.length > 0) {
    cachedBreakdown.current = data.monthlyBreakdown;
  }

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const summary = data?.summary || {
    totalOrdersCount: 0,
    settledOrdersCount: 0,
    pendingOrdersCount: 0,
    totalNetEarnings: 0,
    totalAmountSettled: 0,
    totalAmountPending: 0,
    overallSettlementRate: 0,
  };

  const monthlyBreakdown =
    data?.monthlyBreakdown && data.monthlyBreakdown.length > 0
      ? data.monthlyBreakdown
      : cachedBreakdown.current;

  const rawOrders = data?.orders || [];

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return rawOrders.filter((o) => {
      if (orderFilter === "SETTLED" && !o.isSettled) return false;
      if (orderFilter === "PENDING" && o.isSettled) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchOrder = o.orderId.toLowerCase().includes(q);
        const matchItem = o.orderItemId.toLowerCase().includes(q);
        const matchSku = o.sku.toLowerCase().includes(q);
        const matchProd = o.productName
          ? o.productName.toLowerCase().includes(q)
          : false;
        return matchOrder || matchItem || matchSku || matchProd;
      }
      return true;
    });
  }, [rawOrders, orderFilter, searchQuery]);

  // TanStack Table State
  const [sorting, setSorting] = useState<SortingState>([
    { id: "amountPending", desc: true },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });

  // Reset pageIndex on filter change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [selectedPeriod, orderFilter, searchQuery]);

  // Table Columns
  const columns = useMemo<ColumnDef<OrderClearanceItem>[]>(
    () => [
      {
        id: "orderId",
        accessorKey: "orderId",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1 hover:text-foreground cursor-pointer font-semibold pl-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Order ID & Item</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3 text-primary" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3 text-primary" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const o = row.original;
          return (
            <div className="pl-2 space-y-0.5 font-mono">
              <div className="flex items-center gap-1">
                <span
                  className="font-medium text-foreground block truncate max-w-[160px]"
                  title={o.orderId}
                >
                  {o.orderId}
                </span>
                <button
                  onClick={() => copyToClipboard(o.orderId)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Copy Order ID"
                >
                  {copiedId === o.orderId ? (
                    <Check className="h-2.5 w-2.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-2.5 w-2.5" />
                  )}
                </button>
              </div>
              <span
                className="text-[10px] text-muted-foreground block truncate max-w-[140px]"
                title={o.orderItemId}
              >
                Item: {o.orderItemId}
              </span>
              {o.orderDate && (
                <span className="text-[9px] text-muted-foreground block">
                  {new Date(o.orderDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "sku",
        accessorKey: "sku",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1 hover:text-foreground cursor-pointer font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>SKU & Product</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3 text-primary" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3 text-primary" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const o = row.original;
          return (
            <div className="font-mono space-y-0.5">
              <span
                className="font-bold text-foreground block truncate max-w-[170px]"
                title={o.sku}
              >
                {o.sku}
              </span>
              {o.productName && (
                <span
                  className="text-[10px] text-muted-foreground block truncate max-w-[170px]"
                  title={o.productName}
                >
                  {o.productName}
                </span>
              )}
              {o.channelOfSale && (
                <Badge
                  variant="outline"
                  className="text-[8px] font-mono px-1 py-0 h-3 uppercase"
                >
                  {o.channelOfSale}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        id: "sellingPrice",
        accessorKey: "sellingPrice",
        header: () => (
          <div className="text-right font-semibold">Sale Price</div>
        ),
        cell: ({ row }) => (
          <div className="text-right font-mono text-muted-foreground">
            ₹
            {row.original.sellingPrice.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </div>
        ),
      },
      {
        id: "netEarnings",
        accessorKey: "netEarnings",
        header: ({ column }) => (
          <div className="text-right">
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer font-semibold"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              <span>Net Earnings</span>
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="h-3 w-3 text-primary" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="h-3 w-3 text-primary" />
              ) : (
                <ArrowUpDown className="h-3 w-3 opacity-40" />
              )}
            </button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right font-mono font-semibold text-foreground">
            ₹
            {row.original.netEarnings.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </div>
        ),
      },
      {
        id: "amountSettled",
        accessorKey: "amountSettled",
        header: ({ column }) => (
          <div className="text-right">
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer font-semibold"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              <span>Settled (Bank)</span>
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="h-3 w-3 text-primary" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="h-3 w-3 text-primary" />
              ) : (
                <ArrowUpDown className="h-3 w-3 opacity-40" />
              )}
            </button>
          </div>
        ),
        cell: ({ row }) => {
          const o = row.original;
          return (
            <div className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
              ₹
              {o.amountSettled.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </div>
          );
        },
      },
      {
        id: "amountPending",
        accessorKey: "amountPending",
        header: ({ column }) => (
          <div className="text-right">
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer font-semibold"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              <span>Pending Payout</span>
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="h-3 w-3 text-primary" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="h-3 w-3 text-primary" />
              ) : (
                <ArrowUpDown className="h-3 w-3 opacity-40" />
              )}
            </button>
          </div>
        ),
        cell: ({ row }) => {
          const o = row.original;
          return (
            <div className="text-right font-mono">
              {o.amountPending > 0 ? (
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  ₹
                  {o.amountPending.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              ) : (
                <span className="text-muted-foreground">₹0.00</span>
              )}
            </div>
          );
        },
      },
      {
        id: "isSettled",
        accessorKey: "isSettled",
        header: () => (
          <div className="text-center pr-2 font-semibold">Clearance Status</div>
        ),
        cell: ({ row }) => {
          const isSettled = row.original.isSettled;
          return (
            <div className="text-center pr-2">
              {isSettled ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 gap-1"
                >
                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                  SETTLED
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-mono px-2 py-0.5 gap-1"
                >
                  <Clock className="h-2.5 w-2.5 text-amber-500" />
                  PENDING
                </Badge>
              )}
            </div>
          );
        },
      },
    ],
    [copiedId],
  );

  const table = useReactTable({
    data: filteredOrders,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleExport = () => {
    if (filteredOrders.length === 0) return;
    const exportRows = filteredOrders.map((o) => ({
      "Order ID": o.orderId,
      "Order Item ID": o.orderItemId,
      "Order Date": o.orderDate
        ? new Date(o.orderDate).toLocaleDateString("en-IN")
        : "",
      "Seller SKU": o.sku,
      "Product Name": o.productName || "",
      "Order Status": o.orderStatus || "",
      Channel: o.channelOfSale || "",
      "Selling Price (₹)": o.sellingPrice,
      "Net Earnings (₹)": o.netEarnings,
      "Amount Settled (₹)": o.amountSettled,
      "Amount Pending (₹)": o.amountPending,
      "Clearance Status": o.isSettled ? "Settled" : "Pending",
      "Reporting Period": o.periodLabel || o.reportingPeriod,
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Settlement Clearance");
    XLSX.writeFile(wb, `Order_Settlement_Clearance_${selectedPeriod}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-emerald-500" />
            Monthly Order Settlement Clearance Ledger
            {isFetching && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-1" />
            )}
          </h2>
          <p className="text-xs text-muted-foreground">
            Clear visibility into how many orders have been settled in bank
            versus pending payout for each month.
          </p>
        </div>

        {monthlyBreakdown.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="h-8 text-xs w-[220px] bg-background font-medium border-border shadow-2xs cursor-pointer">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent className="text-xs max-h-60">
                <SelectItem value="all-time">
                  <span className="font-semibold">
                    All Months (Consolidated)
                  </span>
                </SelectItem>
                {monthlyBreakdown.map((m) => (
                  <SelectItem key={m.reportingPeriod} value={m.reportingPeriod}>
                    <span className="font-medium">{m.periodLabel}</span>{" "}
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ({m.totalOrdersCount} ord)
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium">
            Loading settlement clearance data...
          </span>
        </div>
      ) : (
        <>
          {/* 4 Summary KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 1. Total Orders */}
            <Card className="border border-border bg-card p-4 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Total Orders Tracked</span>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-xl font-bold font-mono text-foreground">
                {summary.totalOrdersCount.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground">
                ₹
                {summary.totalNetEarnings.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}{" "}
                sales value
              </div>
            </Card>

            {/* 2. Settled Orders (Paid) */}
            <Card className="border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span>Settled Orders (Paid)</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {summary.settledOrdersCount.toLocaleString("en-IN")}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (
                  {summary.totalOrdersCount > 0
                    ? (
                        (summary.settledOrdersCount /
                          summary.totalOrdersCount) *
                        100
                      ).toFixed(1)
                    : 0}
                  %)
                </span>
              </div>
              <div className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                ₹
                {summary.totalAmountSettled.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}{" "}
                deposited
              </div>
            </Card>

            {/* 3. Pending Orders (Left to Pay) */}
            <Card className="border border-amber-500/30 bg-amber-500/5 p-4 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
                <span>Pending Orders (Left)</span>
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {summary.pendingOrdersCount.toLocaleString("en-IN")}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (
                  {summary.totalOrdersCount > 0
                    ? (
                        (summary.pendingOrdersCount /
                          summary.totalOrdersCount) *
                        100
                      ).toFixed(1)
                    : 0}
                  %)
                </span>
              </div>
              <div className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300">
                ₹
                {summary.totalAmountPending.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}{" "}
                awaiting bank payout
              </div>
            </Card>

            {/* 4. Clearance Rate */}
            <Card className="border border-border bg-card p-4 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Settlement Clearance</span>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-xl font-bold font-mono text-foreground">
                {summary.overallSettlementRate}%
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, summary.overallSettlementRate)}%`,
                  }}
                  title={`Settled: ${summary.overallSettlementRate}%`}
                />
                <div
                  className="bg-amber-500 h-full transition-all duration-500"
                  style={{
                    width: `${Math.max(0, 100 - summary.overallSettlementRate)}%`,
                  }}
                  title={`Pending: ${(100 - summary.overallSettlementRate).toFixed(1)}%`}
                />
              </div>
            </Card>
          </div>

          {/* Month-by-Month Clearance Summary Table */}
          {monthlyBreakdown.length > 0 && (
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="p-4 border-b border-border">
                <CardTitle className="text-sm font-bold text-foreground">
                  Month-by-Month Order Settlement Clearance
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Historical view of orders settled and pending payouts per
                  reporting period.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto custom-scrollbar">
                  <Table className="text-xs w-full min-w-[800px]">
                    <TableHeader className="bg-muted/40 font-semibold border-b border-border">
                      <TableRow>
                        <TableHead className="py-2.5 pl-4 w-[200px]">
                          Reporting Period
                        </TableHead>
                        <TableHead className="py-2.5 text-center w-[120px]">
                          Total Orders
                        </TableHead>
                        <TableHead className="py-2.5 text-center w-[140px]">
                          Settled Orders
                        </TableHead>
                        <TableHead className="py-2.5 text-center w-[140px]">
                          Pending Orders
                        </TableHead>
                        <TableHead className="py-2.5 text-right w-[140px]">
                          Amount Settled
                        </TableHead>
                        <TableHead className="py-2.5 text-right w-[140px]">
                          Amount Pending
                        </TableHead>
                        <TableHead className="py-2.5 pr-4 text-center w-[150px]">
                          Clearance %
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyBreakdown.map((m) => (
                        <TableRow
                          key={m.reportingPeriod}
                          className="hover:bg-muted/30 transition-colors border-b border-border/60 font-mono text-[11px]"
                        >
                          <TableCell className="py-2.5 pl-4 font-bold text-foreground">
                            {m.periodLabel}
                            <span className="text-[10px] text-muted-foreground font-normal block">
                              {m.reportingPeriod}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 text-center font-semibold text-foreground">
                            {m.totalOrdersCount}
                          </TableCell>
                          <TableCell className="py-2.5 text-center">
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-mono px-2 py-0"
                            >
                              {m.settledOrdersCount} settled
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2.5 text-center">
                            {m.pendingOrdersCount > 0 ? (
                              <Badge
                                variant="outline"
                                className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-mono px-2 py-0"
                              >
                                {m.pendingOrdersCount} left
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">
                                0 left
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            ₹
                            {m.totalAmountSettled.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="py-2.5 text-right font-bold text-amber-600 dark:text-amber-400">
                            ₹
                            {m.totalAmountPending.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="py-2.5 pr-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full"
                                  style={{
                                    width: `${Math.min(100, m.settlementRate)}%`,
                                  }}
                                />
                              </div>
                              <span className="font-bold text-[10px] text-foreground">
                                {m.settlementRate}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Itemized Order Settlement Clearance Ledger with TanStack Table */}
          <Card className="border border-border bg-card shadow-xs">
            <CardHeader className="p-4 border-b border-border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Itemized Order Settlement Clearance ({filteredOrders.length}{" "}
                    records)
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Drill-down into individual orders to verify exact bank
                    settled amounts and pending payouts.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search Order ID, SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-8 text-xs bg-background border-border"
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="h-8 px-2.5 text-xs bg-background cursor-pointer shrink-0 shadow-2xs gap-1"
                    title="Export clearance records to Excel"
                  >
                    <Download className="h-3.5 w-3.5 text-muted-foreground" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Clean Harmonious Status Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-muted-foreground mr-0.5">
                  View:
                </span>

                {/* 1. All Orders Pill */}
                <button
                  type="button"
                  onClick={() => setOrderFilter("ALL")}
                  className={`h-7 px-2.5 text-[11px] font-mono rounded-md border transition-all cursor-pointer flex items-center gap-1.5 ${
                    orderFilter === "ALL"
                      ? "bg-foreground text-background border-foreground font-bold shadow-xs"
                      : "bg-muted/30 text-muted-foreground border-border hover:text-foreground hover:bg-muted/70"
                  }`}
                >
                  <span>All Orders</span>
                  <span
                    className={`text-[10px] font-mono px-1 py-0 rounded ${
                      orderFilter === "ALL"
                        ? "bg-background/25 text-background font-bold"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {rawOrders.length}
                  </span>
                </button>

                {/* 2. Settled Orders Pill */}
                <button
                  type="button"
                  onClick={() => setOrderFilter("SETTLED")}
                  className={`h-7 px-2.5 text-[11px] font-mono rounded-md border transition-all cursor-pointer flex items-center gap-1.5 ${
                    orderFilter === "SETTLED"
                      ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs dark:bg-emerald-500 dark:text-zinc-950"
                      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                  }`}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Settled / Paid</span>
                  <span
                    className={`text-[10px] font-mono px-1 py-0 rounded ${
                      orderFilter === "SETTLED"
                        ? "bg-black/25 text-white dark:bg-black/20 dark:text-zinc-950 font-bold"
                        : "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-semibold"
                    }`}
                  >
                    {summary.settledOrdersCount}
                  </span>
                </button>

                {/* 3. Pending Orders Pill */}
                <button
                  type="button"
                  onClick={() => setOrderFilter("PENDING")}
                  className={`h-7 px-2.5 text-[11px] font-mono rounded-md border transition-all cursor-pointer flex items-center gap-1.5 ${
                    orderFilter === "PENDING"
                      ? "bg-amber-600 text-white border-amber-600 font-bold shadow-xs dark:bg-amber-500 dark:text-zinc-950"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                  }`}
                >
                  <Clock className="h-3 w-3" />
                  <span>Pending / Left</span>
                  <span
                    className={`text-[10px] font-mono px-1 py-0 rounded ${
                      orderFilter === "PENDING"
                        ? "bg-black/25 text-white dark:bg-black/20 dark:text-zinc-950 font-bold"
                        : "bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold"
                    }`}
                  >
                    {summary.pendingOrdersCount}
                  </span>
                </button>

                {(orderFilter !== "ALL" || searchQuery.trim()) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setOrderFilter("ALL");
                      setSearchQuery("");
                    }}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer gap-1 ml-auto"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <Table className="text-xs w-full min-w-[950px]">
                  <TableHeader className="bg-muted/40 font-semibold border-b border-border">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} className="py-2.5">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="text-center py-12 text-muted-foreground"
                        >
                          No orders match the selected filter criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="hover:bg-muted/30 transition-colors border-b border-border/60 font-mono text-[11px]"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="py-2.5">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border bg-muted/20 p-3 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground font-mono">
                  <span>Rows per page:</span>
                  <NativeSelect
                    value={table.getState().pagination.pageSize}
                    onChange={(e) => table.setPageSize(Number(e.target.value))}
                    className="h-8 w-20 text-xs bg-background"
                  >
                    {[10, 25, 50, 100, 200].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </NativeSelect>
                  <span className="hidden sm:inline">•</span>
                  <span>
                    Showing{" "}
                    <strong className="text-foreground">
                      {filteredOrders.length === 0
                        ? 0
                        : table.getState().pagination.pageIndex *
                            table.getState().pagination.pageSize +
                          1}
                    </strong>{" "}
                    to{" "}
                    <strong className="text-foreground">
                      {Math.min(
                        (table.getState().pagination.pageIndex + 1) *
                          table.getState().pagination.pageSize,
                        filteredOrders.length,
                      )}
                    </strong>{" "}
                    of{" "}
                    <strong className="text-foreground">
                      {filteredOrders.length}
                    </strong>{" "}
                    orders
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono">
                  <span className="text-muted-foreground mr-1">
                    Page{" "}
                    <strong className="text-foreground">
                      {table.getPageCount() === 0
                        ? 0
                        : table.getState().pagination.pageIndex + 1}
                    </strong>{" "}
                    of{" "}
                    <strong className="text-foreground">
                      {table.getPageCount() || 1}
                    </strong>
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 bg-background cursor-pointer"
                      onClick={() => table.setPageIndex(0)}
                      disabled={!table.getCanPreviousPage()}
                      title="First Page"
                    >
                      <ChevronsLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 bg-background cursor-pointer"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      title="Previous Page"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 bg-background cursor-pointer"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      title="Next Page"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 bg-background cursor-pointer"
                      onClick={() =>
                        table.setPageIndex(table.getPageCount() - 1)
                      }
                      disabled={!table.getCanNextPage()}
                      title="Last Page"
                    >
                      <ChevronsRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
