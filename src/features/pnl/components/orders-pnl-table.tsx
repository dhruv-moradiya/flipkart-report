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
  Eye,
  Search,
  Download,
  X,
  RotateCcw,
  ShoppingBag,
  Sparkles,
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

export function OrdersPnlTable({ orders, fileName = "Flipkart_Orders_PnL" }: OrdersPnlTableProps) {
  const { openOrderJourney, records: returnsRecords } = useExcelData();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("" );
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<OrderPnlRecord | null>(null);

  // Return lookup index for matching Order Item ID / Order ID with Returns Report
  const returnsLookup = useMemo(() => {
    const map = new Map<string, typeof returnsRecords[0]>();
    returnsRecords.forEach((r) => {
      if (r.orderItemId) map.set(r.orderItemId.toLowerCase().trim(), r);
      if (r.orderId) map.set(r.orderId.toLowerCase().trim(), r);
    });
    return map;
  }, [returnsRecords]);

  // Status options derived dynamically
  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.orderStatus) set.add(o.orderStatus);
    });
    return Array.from(set);
  }, [orders]);

  const filteredData = useMemo(() => {
    return orders.filter((item) => {
      if (statusFilter !== "ALL" && item.orderStatus.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      if (globalFilter) {
        const query = globalFilter.toLowerCase();
        const matches =
          item.orderId.toLowerCase().includes(query) ||
          item.orderItemId.toLowerCase().includes(query) ||
          (item.sku && item.sku.toLowerCase().includes(query)) ||
          item.orderStatus.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
  }, [orders, statusFilter, globalFilter]);

  const hasActiveFilters = Boolean(globalFilter || statusFilter !== "ALL");

  const columns = useMemo<ColumnDef<OrderPnlRecord>[]>(() => {
    return [
      // 1. Order ID (Sticky Left -> Click opens Order Journey)
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
            {column.getIsSorted() === "asc" ? <ArrowUp className="h-3 w-3" /> : column.getIsSorted() === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-30" />}
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
                <TooltipContent side="top" className="font-mono text-xs max-w-xs">
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

      // 2. Order Item ID
      {
        id: "orderItemId",
        accessorKey: "orderItemId",
        header: "Item ID",
        cell: ({ row }) => (
          <div className="group/cell flex items-center gap-1.5 max-w-[160px]">
            <span className="font-mono text-xs text-muted-foreground truncate">{row.original.orderItemId}</span>
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

      // 3. Product SKU
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
            {column.getIsSorted() === "asc" ? <ArrowUp className="h-3 w-3" /> : column.getIsSorted() === "desc" ? <ArrowDown className="h-3 w-3" /> : null}
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

      // 4. Return Lifecycle Status (Cross-Report Join)
      {
        id: "returnLifecycle",
        header: "Return Report",
        cell: ({ row }) => {
          const matchedReturn =
            returnsLookup.get(row.original.orderItemId.toLowerCase().trim()) ||
            returnsLookup.get(row.original.orderId.toLowerCase().trim());

          if (matchedReturn) {
            return (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 gap-1">
                <RotateCcw className="h-3 w-3" />
                {matchedReturn.returnType || "Customer Return"}
              </Badge>
            );
          }

          if (row.original.returnedCancelledUnits > 0) {
            return (
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-muted-foreground font-mono">
                P&L Ret+Canc
              </Badge>
            );
          }

          return <span className="text-xs text-muted-foreground/60">—</span>;
        },
      },

      // 5. Units (Net / Gross)
      {
        id: "units",
        header: "Units",
        cell: ({ row }) => (
          <div className="text-xs font-mono">
            <strong className="text-foreground">{row.original.netUnits}</strong>{" "}
            <span className="text-muted-foreground">/ {row.original.grossUnits}</span>
          </div>
        ),
      },

      // 6. Final Selling Price
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
            {column.getIsSorted() === "asc" ? <ArrowUp className="h-3 w-3" /> : column.getIsSorted() === "desc" ? <ArrowDown className="h-3 w-3" /> : null}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-bold text-foreground">
            {formatINR(row.original.finalSellingPrice)}
          </span>
        ),
      },

      // 7. Net Earnings
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
            {column.getIsSorted() === "asc" ? <ArrowUp className="h-3 w-3" /> : column.getIsSorted() === "desc" ? <ArrowDown className="h-3 w-3" /> : null}
          </Button>
        ),
        cell: ({ row }) => {
          const isProf = row.original.netEarnings >= 0;
          return (
            <span className={`font-mono text-xs font-bold ${isProf ? "text-foreground" : "text-destructive"}`}>
              {formatINR(row.original.netEarnings)}
            </span>
          );
        },
      },

      // 8. Order Status
      {
        id: "orderStatus",
        accessorKey: "orderStatus",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge status={row.original.orderStatus} className="text-[11px]" />
        ),
      },

      // 9. Actions (Sticky Right -> Open Journey)
      {
        id: "actions",
        header: () => <span className="text-xs font-semibold text-muted-foreground">Journey</span>,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  openOrderJourney(item.orderId);
                }}
                className="h-7 text-[11px] gap-1 px-2 bg-background hover:bg-muted cursor-pointer"
                title="View Complete Order Journey"
              >
                <span>Journey</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          );
        },
        size: 80,
      },
    ];
  }, [returnsLookup, openOrderJourney]);

  const table = useReactTable({
    data: filteredData,
    columns,
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
    const rowsToExport = table.getFilteredRowModel().rows.map((r) => r.original);
    const ws = XLSX.utils.json_to_sheet(rowsToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders_PnL");
    XLSX.writeFile(wb, `${fileName}_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-3">
      {/* SaaS Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Order ID, Item ID, SKU..."
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

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-40 text-xs bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
              {statusOptions.map((st) => (
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
            Export Orders
          </Button>
        </div>
      </div>

      {/* Orders Data Table with Zebra Striping and Solid Sticky Columns */}
      <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground space-y-2">
            <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="font-medium text-foreground">No matching Order P&L records found</p>
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto">
            <Table className="w-full text-xs border-collapse">
              <TableHeader className="border-b border-border bg-muted/90 sticky top-0 z-30">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-border">
                    {headerGroup.headers.map((header) => {
                      const isOrderId = header.id === "orderId";
                      const isActions = header.id === "actions";

                      return (
                        <TableHead
                          key={header.id}
                          className={`py-2.5 px-3 text-xs font-semibold text-muted-foreground whitespace-nowrap ${
                            isOrderId
                              ? "sticky left-0 bg-muted z-30 min-w-[190px] shadow-[1px_0_0_0_var(--border)] border-r border-border/60"
                              : isActions
                              ? "sticky right-0 bg-muted z-30 min-w-[90px] text-right shadow-[-1px_0_0_0_var(--border)] border-l border-border/60"
                              : ""
                          }`}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row, index) => {
                  const isEven = index % 2 === 0;

                  return (
                    <TableRow
                      key={row.id}
                      onClick={() => openOrderJourney(row.original.orderId)}
                      className={`group transition-colors border-b border-border/70 cursor-pointer ${
                        isEven
                          ? "bg-card hover:bg-muted/70 dark:hover:bg-muted/60"
                          : "bg-muted/25 hover:bg-muted/70 dark:hover:bg-muted/60"
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
                                ? `sticky left-0 z-20 min-w-[190px] ${
                                    isEven
                                      ? "bg-card group-hover:bg-muted/70 dark:group-hover:bg-muted/60"
                                      : "bg-muted/25 group-hover:bg-muted/70 dark:group-hover:bg-muted/60"
                                  } shadow-[1px_0_0_0_var(--border)] border-r border-border/60`
                                : isActions
                                ? `sticky right-0 z-20 min-w-[90px] text-right ${
                                    isEven
                                      ? "bg-card group-hover:bg-muted/70 dark:group-hover:bg-muted/60"
                                      : "bg-muted/25 group-hover:bg-muted/70 dark:group-hover:bg-muted/60"
                                  } shadow-[-1px_0_0_0_var(--border)] border-l border-border/60`
                                : ""
                            }`}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        );
                      })}
                    </TableRow>
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
              Showing <strong className="text-foreground">{table.getRowModel().rows.length}</strong> of{" "}
              <strong className="text-foreground">{filteredData.length}</strong> Order Items
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground mr-1">
              Page <strong className="text-foreground">{table.getState().pagination.pageIndex + 1}</strong> of{" "}
              <strong className="text-foreground">{table.getPageCount() || 1}</strong>
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
