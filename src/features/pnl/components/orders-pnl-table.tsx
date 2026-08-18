"use client";

import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  Search,
  Download,
  X,
  RotateCcw,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NativeSelect } from "@/components/ui/native-select";
import { CopyButton } from "@/components/copy-button";
import { StatusBadge } from "@/components/excel/status-badge";
import { OrderPnlRecord } from "../types/pnl.types";
import { OrderDetailSheet } from "./order-detail-sheet";
import { useExcelData } from "@/context/excel-context";

interface OrdersPnlTableProps {
  orders: OrderPnlRecord[];
  fileName?: string;
}

function formatINR(val: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

interface OrderSummary {
  orderId: string;
  orderDate: string | null;
  items: OrderPnlRecord[];
  totalItems: number;
  totalGrossUnits: number;
  totalNetUnits: number;
  totalSellingPrice: number;
  totalNetEarnings: number;
  skus: string[];
  statusSummary: {
    status: string;
    deliveredCount: number;
    returnedCount: number;
    cancelledCount: number;
    otherCount: number;
  };
  hasReturn: boolean;
}

function getOrderStatusSummary(items: OrderPnlRecord[]) {
  let deliveredCount = 0;
  let returnedCount = 0;
  let cancelledCount = 0;
  let otherCount = 0;

  items.forEach((item) => {
    const s = item.orderStatus.toLowerCase();
    if (s.includes("delivered") || s.includes("completed")) {
      deliveredCount++;
    } else if (s.includes("return") || s.includes("rto") || s.includes("rvp")) {
      returnedCount++;
    } else if (s.includes("cancel")) {
      cancelledCount++;
    } else {
      otherCount++;
    }
  });

  const total = items.length;
  let status = "MIXED";

  if (deliveredCount === total) {
    status = "DELIVERED";
  } else if (returnedCount === total) {
    status = "RETURNED";
  } else if (cancelledCount === total) {
    status = "CANCELLED";
  } else if (
    deliveredCount > 0 &&
    returnedCount > 0 &&
    cancelledCount === 0 &&
    otherCount === 0
  ) {
    status = "PARTIALLY RETURNED";
  } else if (
    deliveredCount > 0 &&
    cancelledCount > 0 &&
    returnedCount === 0 &&
    otherCount === 0
  ) {
    status = "PARTIALLY CANCELLED";
  } else if (deliveredCount > 0 || returnedCount > 0 || cancelledCount > 0) {
    status = "MIXED";
  }

  return {
    status,
    deliveredCount,
    returnedCount,
    cancelledCount,
    otherCount,
  };
}

export function OrdersPnlTable({
  orders,
  fileName = "Flipkart_Orders_PnL",
}: OrdersPnlTableProps) {
  const { openOrderJourney, records: returnsRecords } = useExcelData();

  const [viewMode, setViewMode] = useState<"order" | "item">("order");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<OrderPnlRecord | null>(
    null,
  );

  // Return lookup index for matching Order Item ID / Order ID with Returns Report
  const returnsLookup = useMemo(() => {
    const map = new Map<string, (typeof returnsRecords)[0]>();
    returnsRecords.forEach((r) => {
      if (r.orderItemId) map.set(r.orderItemId.toLowerCase().trim(), r);
      if (r.orderId) map.set(r.orderId.toLowerCase().trim(), r);
    });
    return map;
  }, [returnsRecords]);

  // Status options derived dynamically based on viewMode
  const statusOptions = useMemo(() => {
    if (viewMode === "item") {
      const set = new Set<string>();
      orders.forEach((o) => {
        if (o.orderStatus) set.add(o.orderStatus);
      });
      return Array.from(set);
    } else {
      return [
        "DELIVERED",
        "RETURNED",
        "CANCELLED",
        "PARTIALLY RETURNED",
        "PARTIALLY CANCELLED",
        "MIXED",
      ];
    }
  }, [orders, viewMode]);

  // Grouped order summaries
  const orderSummaries = useMemo<OrderSummary[]>(() => {
    const orderGroupsMap = new Map<string, OrderPnlRecord[]>();
    orders.forEach((o) => {
      const list = orderGroupsMap.get(o.orderId) || [];
      list.push(o);
      orderGroupsMap.set(o.orderId, list);
    });

    const summaries: OrderSummary[] = [];
    orderGroupsMap.forEach((items, orderId) => {
      let totalGrossUnits = 0;
      let totalNetUnits = 0;
      let totalSellingPrice = 0;
      let totalNetEarnings = 0;
      const skusSet = new Set<string>();
      let hasReturn = false;

      items.forEach((item) => {
        totalGrossUnits += item.grossUnits;
        totalNetUnits += item.netUnits;
        totalSellingPrice += item.finalSellingPrice;
        totalNetEarnings += item.netEarnings;
        if (item.sku) skusSet.add(item.sku);

        const matchedReturn =
          returnsLookup.get(item.orderItemId.toLowerCase().trim()) ||
          returnsLookup.get(item.orderId.toLowerCase().trim());
        if (matchedReturn || item.returnedCancelledUnits > 0) {
          hasReturn = true;
        }
      });

      summaries.push({
        orderId,
        orderDate: items[0]?.orderDate || null,
        items,
        totalItems: items.length,
        totalGrossUnits,
        totalNetUnits,
        totalSellingPrice,
        totalNetEarnings,
        skus: Array.from(skusSet),
        statusSummary: getOrderStatusSummary(items),
        hasReturn,
      });
    });

    return summaries;
  }, [orders, returnsLookup]);

  // Auto-expand orders containing items matching item ID query
  const autoExpanded = useMemo(() => {
    const set = new Set<string>();
    if (globalFilter && viewMode === "order") {
      const q = globalFilter.toLowerCase().trim();
      orderSummaries.forEach((os) => {
        const matchesItemId = os.items.some((item) =>
          item.orderItemId.toLowerCase().includes(q),
        );
        if (matchesItemId) {
          set.add(os.orderId);
        }
      });
    }
    return set;
  }, [globalFilter, orderSummaries, viewMode]);

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // Filtered orders list (Order summaries or raw item rows)
  const filteredSummaries = useMemo(() => {
    if (viewMode !== "order") return [];

    return orderSummaries.filter((os) => {
      // 1. Status Filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "CONTAINS_DELIVERED") {
          if (os.statusSummary.deliveredCount === 0) return false;
        } else if (statusFilter === "CONTAINS_RETURNED") {
          if (os.statusSummary.returnedCount === 0) return false;
        } else if (statusFilter === "CONTAINS_CANCELLED") {
          if (os.statusSummary.cancelledCount === 0) return false;
        } else {
          if (
            os.statusSummary.status.toLowerCase() !== statusFilter.toLowerCase()
          ) {
            return false;
          }
        }
      }

      // 2. Global Filter (Search by Order ID, Item ID, or SKU)
      if (globalFilter) {
        const q = globalFilter.toLowerCase().trim();
        const matchesOrderId = os.orderId.toLowerCase().includes(q);
        const matchesSKU = os.skus.some((sku) => sku.toLowerCase().includes(q));
        const matchesItemId = os.items.some((item) =>
          item.orderItemId.toLowerCase().includes(q),
        );
        const matchesStatus = os.statusSummary.status.toLowerCase().includes(q);

        if (
          !matchesOrderId &&
          !matchesSKU &&
          !matchesItemId &&
          !matchesStatus
        ) {
          return false;
        }
      }

      return true;
    });
  }, [orderSummaries, statusFilter, globalFilter, viewMode]);

  const filteredItems = useMemo(() => {
    if (viewMode !== "item") return [];

    return orders.filter((item) => {
      // 1. Status Filter
      if (
        statusFilter !== "ALL" &&
        item.orderStatus.toLowerCase() !== statusFilter.toLowerCase()
      ) {
        return false;
      }

      // 2. Global Filter Search
      if (globalFilter) {
        const q = globalFilter.toLowerCase().trim();
        const matches =
          item.orderId.toLowerCase().includes(q) ||
          item.orderItemId.toLowerCase().includes(q) ||
          (item.sku && item.sku.toLowerCase().includes(q)) ||
          item.orderStatus.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [orders, statusFilter, globalFilter, viewMode]);

  const hasActiveFilters = Boolean(globalFilter || statusFilter !== "ALL");

  // React Table Columns definitions for Order View
  const orderColumns = useMemo<ColumnDef<OrderSummary>[]>(() => {
    return [
      {
        id: "orderId",
        accessorKey: "orderId",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Order ID</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const id = row.original.orderId;
          const isExp = expandedOrders.has(id) || autoExpanded.has(id);
          return (
            <div className="group/cell flex items-center gap-1.5 max-w-[210px]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOrderExpanded(id);
                }}
                className="h-6 w-6 rounded-md hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer shrink-0 transition-colors"
                title={isExp ? "Collapse Row" : "Expand Items"}
              >
                {isExp ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openOrderJourney(id);
                    }}
                    className="font-mono text-xs font-bold text-foreground hover:underline cursor-pointer truncate text-left"
                  >
                    {id}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="font-mono text-xs max-w-xs"
                >
                  Click to open complete Order Journey for {id}
                </TooltipContent>
              </Tooltip>

              <div onClick={(e) => e.stopPropagation()}>
                <CopyButton
                  text={id}
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover/cell:opacity-100 focus-visible:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                />
              </div>
            </div>
          );
        },
      },
      {
        id: "itemsCount",
        accessorKey: "totalItems",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Items</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground font-semibold">
            {row.original.totalItems}
          </span>
        ),
      },
      {
        id: "skus",
        accessorFn: (row) => row.skus.join(", "),
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>SKUs / Products</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const skus = row.original.skus;
          const joined = skus.join(", ");
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-mono text-xs text-foreground bg-muted/40 border border-border/80 px-1.5 py-0.5 rounded truncate max-w-[200px] inline-block cursor-default">
                  {joined || "-"}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="font-mono text-xs max-w-sm">
                {joined}
              </TooltipContent>
            </Tooltip>
          );
        },
      },
      {
        id: "units",
        accessorKey: "totalNetUnits",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Total Units</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-xs font-mono">
            <strong className="text-foreground">
              {row.original.totalNetUnits}
            </strong>{" "}
            <span className="text-muted-foreground">
              / {row.original.totalGrossUnits}
            </span>
          </div>
        ),
      },
      {
        id: "totalSellingPrice",
        accessorKey: "totalSellingPrice",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Total Selling Price</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-bold text-foreground">
            {formatINR(row.original.totalSellingPrice)}
          </span>
        ),
      },
      {
        id: "totalNetEarnings",
        accessorKey: "totalNetEarnings",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Net Earnings</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const isProf = row.original.totalNetEarnings >= 0;
          return (
            <span
              className={`font-mono text-xs font-bold ${isProf ? "text-foreground" : "text-destructive"}`}
            >
              {formatINR(row.original.totalNetEarnings)}
            </span>
          );
        },
      },
      {
        id: "orderStatus",
        accessorFn: (row) => row.statusSummary.status,
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Order Status</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const summary = row.original.statusSummary;
          const details = [];
          if (summary.deliveredCount > 0)
            details.push(`${summary.deliveredCount} Delivered`);
          if (summary.returnedCount > 0)
            details.push(`${summary.returnedCount} Returned`);
          if (summary.cancelledCount > 0)
            details.push(`${summary.cancelledCount} Cancelled`);
          if (summary.otherCount > 0)
            details.push(`${summary.otherCount} Other`);

          return (
            <div className="space-y-0.5">
              <StatusBadge status={summary.status} className="text-[11px]" />
              {details.length > 0 && (
                <p className="text-[10px] text-muted-foreground whitespace-nowrap leading-none font-sans font-medium">
                  {details.join(" · ")}
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground">
            Journey
          </span>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                openOrderJourney(row.original.orderId);
              }}
              className="h-7 text-[11px] gap-1 px-2 bg-background hover:bg-muted cursor-pointer"
              title="View Complete Order Journey"
            >
              <span>Journey</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        ),
      },
    ];
  }, [expandedOrders, autoExpanded, openOrderJourney]);

  // React Table Columns definitions for Item View
  const itemColumns = useMemo<ColumnDef<OrderPnlRecord>[]>(() => {
    return [
      {
        id: "orderId",
        accessorKey: "orderId",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Order ID</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const id = row.original.orderId;
          return (
            <div className="group/cell flex items-center gap-1.5 max-w-[190px]">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openOrderJourney(id);
                    }}
                    className="font-mono text-xs font-bold text-foreground hover:underline cursor-pointer truncate text-left"
                  >
                    {id}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="font-mono text-xs max-w-xs"
                >
                  Click to open complete Order Journey for {id}
                </TooltipContent>
              </Tooltip>
              <div onClick={(e) => e.stopPropagation()}>
                <CopyButton
                  text={id}
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover/cell:opacity-100 focus-visible:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                />
              </div>
            </div>
          );
        },
      },
      {
        id: "orderItemId",
        accessorKey: "orderItemId",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Item ID</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="group/cell flex items-center gap-1.5 max-w-[160px]">
            <span className="font-mono text-xs text-muted-foreground truncate">
              {row.original.orderItemId}
            </span>
            <div onClick={(e) => e.stopPropagation()}>
              <CopyButton
                text={row.original.orderItemId}
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover/cell:opacity-100 focus-visible:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
              />
            </div>
          </div>
        ),
      },
      {
        id: "sku",
        accessorKey: "sku",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>SKU</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-mono text-xs text-foreground bg-muted/50 border border-border px-1.5 py-0.5 rounded truncate max-w-[170px] inline-block cursor-default">
                {row.original.sku || "-"}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="font-mono text-xs max-w-xs">
              {row.original.sku}
            </TooltipContent>
          </Tooltip>
        ),
      },
      {
        id: "returnLifecycle",
        accessorFn: (row) => {
          const matchedReturn =
            returnsLookup.get(row.orderItemId.toLowerCase().trim()) ||
            returnsLookup.get(row.orderId.toLowerCase().trim());
          return matchedReturn
            ? matchedReturn.returnType || "Customer Return"
            : "";
        },
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Return Report</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const matchedReturn =
            returnsLookup.get(row.original.orderItemId.toLowerCase().trim()) ||
            returnsLookup.get(row.original.orderId.toLowerCase().trim());

          if (matchedReturn) {
            return (
              <Badge
                variant="destructive"
                className="text-[10px] px-1.5 py-0 h-4 gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                {matchedReturn.returnType || "Customer Return"}
              </Badge>
            );
          }

          if (row.original.returnedCancelledUnits > 0) {
            return (
              <Badge
                variant="outline"
                className="text-[10px] px-1 py-0 h-4 text-muted-foreground font-mono"
              >
                P&L Ret+Canc
              </Badge>
            );
          }

          return <span className="text-xs text-muted-foreground/60">—</span>;
        },
      },
      {
        id: "units",
        accessorKey: "netUnits",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Units</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-xs font-mono">
            <strong className="text-foreground">{row.original.netUnits}</strong>{" "}
            <span className="text-muted-foreground">
              / {row.original.grossUnits}
            </span>
          </div>
        ),
      },
      {
        id: "finalSellingPrice",
        accessorKey: "finalSellingPrice",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Selling Price</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-bold text-foreground">
            {formatINR(row.original.finalSellingPrice)}
          </span>
        ),
      },
      {
        id: "netEarnings",
        accessorKey: "netEarnings",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Net Earnings</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const isProf = row.original.netEarnings >= 0;
          return (
            <span
              className={`font-mono text-xs font-bold ${isProf ? "text-foreground" : "text-destructive"}`}
            >
              {formatINR(row.original.netEarnings)}
            </span>
          );
        },
      },
      {
        id: "orderStatus",
        accessorKey: "orderStatus",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Status</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.orderStatus}
            className="text-[11px]"
          />
        ),
      },
      {
        id: "actions",
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground">
            Journey
          </span>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                openOrderJourney(row.original.orderId);
              }}
              className="h-7 text-[11px] gap-1 px-2 bg-background hover:bg-muted cursor-pointer"
            >
              <span>Journey</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        ),
      },
    ];
  }, [returnsLookup, openOrderJourney]);

  // Instantiate react-table configurations depending on the viewMode
  const tableData = viewMode === "order" ? filteredSummaries : filteredItems;
  const tableColumns =
    viewMode === "order" ? (orderColumns as any) : (itemColumns as any);

  const table = useReactTable({
    data: tableData as any[],
    columns: tableColumns as any[],
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  const handleExport = () => {
    if (viewMode === "order") {
      const rowsToExport = filteredSummaries.map((os) => ({
        "Order ID": os.orderId,
        "Order Date": os.orderDate,
        "Unique Items": os.totalItems,
        SKUs: os.skus.join(", "),
        "Net Units": os.totalNetUnits,
        "Gross Units": os.totalGrossUnits,
        "Total Selling Price": os.totalSellingPrice,
        "Total Net Earnings": os.totalNetEarnings,
        "Order Status": os.statusSummary.status,
      }));
      const ws = XLSX.utils.json_to_sheet(rowsToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Orders_Summary_PnL");
      XLSX.writeFile(
        wb,
        `${fileName}_Orders_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } else {
      const rowsToExport = filteredItems.map((item) => ({
        "Order ID": item.orderId,
        "Order Date": item.orderDate,
        "Item ID": item.orderItemId,
        SKU: item.sku,
        "Net Units": item.netUnits,
        "Gross Units": item.grossUnits,
        "Selling Price": item.finalSellingPrice,
        "Net Earnings": item.netEarnings,
        Status: item.orderStatus,
      }));
      const ws = XLSX.utils.json_to_sheet(rowsToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Order_Items_PnL");
      XLSX.writeFile(
        wb,
        `${fileName}_Items_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    }
  };

  return (
    <div className="space-y-3">
      {/* SaaS Filter & Control Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Toggle View Mode */}
          <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border">
            <Button
              variant={viewMode === "order" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setViewMode("order");
                setStatusFilter("ALL");
              }}
              className={`h-8 px-3 text-xs cursor-pointer ${
                viewMode === "order"
                  ? "bg-background shadow-xs font-bold text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Order View
            </Button>
            <Button
              variant={viewMode === "item" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setViewMode("item");
                setStatusFilter("ALL");
              }}
              className={`h-8 px-3 text-xs cursor-pointer ${
                viewMode === "item"
                  ? "bg-background shadow-xs font-bold text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Item View
            </Button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                viewMode === "order"
                  ? "Search Order ID, Item ID, SKU..."
                  : "Search Order, Item, SKU..."
              }
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 h-9 text-xs bg-background"
            />
            {globalFilter && (
              <button
                type="button"
                onClick={() => setGlobalFilter("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Dynamic Status Dropdown Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-48 text-xs bg-background">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                All Statuses
              </SelectItem>
              {viewMode === "order" && (
                <>
                  <SelectItem value="CONTAINS_DELIVERED" className="text-xs">
                    Contains Delivered Item
                  </SelectItem>
                  <SelectItem value="CONTAINS_RETURNED" className="text-xs">
                    Contains Returned Item
                  </SelectItem>
                  <SelectItem value="CONTAINS_CANCELLED" className="text-xs">
                    Contains Cancelled Item
                  </SelectItem>
                  <SelectItem value="DELIVERED" className="text-xs">
                    All Delivered
                  </SelectItem>
                  <SelectItem value="RETURNED" className="text-xs">
                    All Returned
                  </SelectItem>
                  <SelectItem value="CANCELLED" className="text-xs">
                    All Cancelled
                  </SelectItem>
                  <SelectItem value="PARTIALLY RETURNED" className="text-xs">
                    Partially Returned
                  </SelectItem>
                  <SelectItem value="PARTIALLY CANCELLED" className="text-xs">
                    Partially Cancelled
                  </SelectItem>
                  <SelectItem value="MIXED" className="text-xs">
                    Mixed Status
                  </SelectItem>
                </>
              )}
              {viewMode === "item" &&
                statusOptions.map((st) => (
                  <SelectItem key={st} value={st} className="text-xs">
                    {st}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setGlobalFilter("");
                setStatusFilter("ALL");
              }}
              className="h-9 gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-9 gap-1.5 text-xs bg-background cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            Export {viewMode === "order" ? "Orders" : "Items"}
          </Button>
        </div>
      </div>

      {/* Orders Data Table with Expandable Children */}
      <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
        {tableData.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground space-y-2">
            <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="font-medium text-foreground">
              No matching P&L records found
            </p>
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto custom-scrollbar">
            <Table className="w-full text-xs border-collapse">
              <TableHeader className="border-b border-border bg-muted/90 sticky top-0 z-30">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="hover:bg-transparent border-b border-border"
                  >
                    {headerGroup.headers.map((header) => {
                      const isOrderId = header.id === "orderId";
                      const isActions = header.id === "actions";

                      return (
                        <TableHead
                          key={header.id}
                          className={`py-2.5 px-3 text-xs font-semibold text-muted-foreground whitespace-nowrap ${
                            isOrderId
                              ? "sticky left-0 bg-muted z-30 min-w-[210px] shadow-[1px_0_0_0_var(--border)] border-r border-border/60"
                              : isActions
                                ? "sticky right-0 bg-muted z-30 min-w-[95px] text-right shadow-[-1px_0_0_0_var(--border)] border-l border-border/60"
                                : ""
                          }`}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row, index) => {
                  const isEven = index % 2 === 0;
                  const orderId = (row.original as any).orderId;
                  const isExp =
                    viewMode === "order" &&
                    (expandedOrders.has(orderId) || autoExpanded.has(orderId));
                  const stickyBg = isExp
                    ? "bg-muted group-hover:bg-muted"
                    : isEven
                      ? "bg-card group-hover:bg-muted/80 dark:group-hover:bg-muted/70"
                      : "bg-secondary group-hover:bg-muted/80 dark:group-hover:bg-muted/70";

                  return (
                    <React.Fragment key={row.id}>
                      <TableRow
                        onClick={() => openOrderJourney(orderId)}
                        className={`group transition-colors border-b border-border/70 cursor-pointer ${
                          isExp
                            ? "bg-muted/50 dark:bg-muted/40"
                            : isEven
                              ? "bg-card hover:bg-muted/60 dark:hover:bg-muted/50"
                              : "bg-secondary/40 hover:bg-muted/60 dark:hover:bg-muted/50"
                        }`}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const isOrderId = cell.column.id === "orderId";
                          const isActions = cell.column.id === "actions";

                          return (
                            <TableCell
                              key={cell.id}
                              className={`py-2.5 px-3 align-middle transition-colors ${
                                isOrderId
                                  ? `sticky left-0 z-20 min-w-[210px] ${stickyBg} shadow-[1px_0_0_0_var(--border)] border-r border-border/60`
                                  : isActions
                                    ? `sticky right-0 z-20 min-w-[95px] text-right ${stickyBg} shadow-[-1px_0_0_0_var(--border)] border-l border-border/60`
                                    : ""
                              }`}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>

                      {/* Nested Expanded Items View for Order Level Groupings */}
                      {viewMode === "order" && isExp && (
                        <TableRow className="bg-muted/10 hover:bg-muted/10 border-b border-border/70">
                          <TableCell
                            colSpan={orderColumns.length}
                            className="p-3 pl-12 bg-muted/5"
                          >
                            <div className="rounded-lg border border-border bg-background/85 shadow-2xs overflow-hidden">
                              <Table className="w-full text-xs">
                                <TableHeader className="bg-muted/40">
                                  <TableRow className="hover:bg-transparent border-b border-border/60">
                                    <TableHead className="h-8 py-1.5 px-3 text-left font-semibold text-muted-foreground">
                                      Item ID
                                    </TableHead>
                                    <TableHead className="h-8 py-1.5 px-3 text-left font-semibold text-muted-foreground">
                                      SKU
                                    </TableHead>
                                    <TableHead className="h-8 py-1.5 px-3 text-left font-semibold text-muted-foreground">
                                      Units
                                    </TableHead>
                                    <TableHead className="h-8 py-1.5 px-3 text-right font-semibold text-muted-foreground">
                                      Selling Price
                                    </TableHead>
                                    <TableHead className="h-8 py-1.5 px-3 text-right font-semibold text-muted-foreground">
                                      Earnings
                                    </TableHead>
                                    <TableHead className="h-8 py-1.5 px-3 text-left font-semibold text-muted-foreground">
                                      Status
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {(row.original as any).items.map(
                                    (item: any) => {
                                      const isProf = item.netEarnings >= 0;
                                      const isHighlight =
                                        globalFilter &&
                                        item.orderItemId
                                          .toLowerCase()
                                          .includes(
                                            globalFilter.toLowerCase().trim(),
                                          );
                                      return (
                                        <TableRow
                                          key={item.orderItemId}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openOrderJourney(item.orderId);
                                          }}
                                          className={`hover:bg-muted/40 border-b border-border/40 cursor-pointer ${
                                            isHighlight
                                              ? "bg-amber-500/10 dark:bg-amber-500/5 font-semibold"
                                              : ""
                                          }`}
                                        >
                                          <TableCell className="py-2 px-3 font-mono text-[11px] text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                              <span>{item.orderItemId}</span>
                                              <div
                                                onClick={(e) =>
                                                  e.stopPropagation()
                                                }
                                              >
                                                <CopyButton
                                                  text={item.orderItemId}
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer"
                                                />
                                              </div>
                                            </div>
                                          </TableCell>
                                          <TableCell className="py-2 px-3">
                                            <span className="font-mono text-[11px] text-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                                              {item.sku}
                                            </span>
                                          </TableCell>
                                          <TableCell className="py-2 px-3 font-mono text-[11px]">
                                            <strong>{item.netUnits}</strong> /{" "}
                                            {item.grossUnits}
                                          </TableCell>
                                          <TableCell className="py-2 px-3 text-right font-mono text-[11px] text-foreground">
                                            {formatINR(item.finalSellingPrice)}
                                          </TableCell>
                                          <TableCell
                                            className={`py-2 px-3 text-right font-mono text-[11px] font-bold ${isProf ? "text-foreground" : "text-destructive"}`}
                                          >
                                            {formatINR(item.netEarnings)}
                                          </TableCell>
                                          <TableCell className="py-2 px-3">
                                            <StatusBadge
                                              status={item.orderStatus}
                                              className="text-[10px]"
                                            />
                                          </TableCell>
                                        </TableRow>
                                      );
                                    },
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Compact Table Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border bg-muted/20 p-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Rows per page:</span>
            <NativeSelect
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="h-8 w-18 text-xs bg-background"
            >
              {[10, 15, 25, 50, 100].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </NativeSelect>
            <span className="hidden sm:inline">•</span>
            <span>
              Showing{" "}
              <strong className="text-foreground">
                {table.getRowModel().rows.length}
              </strong>{" "}
              of <strong className="text-foreground">{tableData.length}</strong>{" "}
              {viewMode === "order" ? "Orders" : "Order Items"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground mr-1">
              Page{" "}
              <strong className="text-foreground">
                {table.getState().pagination.pageIndex + 1}
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
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                title="Last Page"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details Side Drawer fallback */}
      <OrderDetailSheet
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />
    </div>
  );
}
