"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Eye,
  Copy,
  Search,
  SlidersHorizontal,
  Download,
  X,
  RotateCcw,
  Layers,
  ShoppingBag,
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { SkuPnlAnalytics } from "../types/pnl-analytics.types";
import { SkuDetailSheet } from "./sku-detail-sheet";
import { OrderPnlRecord } from "../types/pnl.types";

interface SkuPnlTableProps {
  skus: SkuPnlAnalytics[];
  fileName?: string;
  onSelectOrder?: (order: OrderPnlRecord) => void;
}

function formatINR(val: number): string {
  if (val === 0) return "₹0";
  const absVal = Math.abs(val);
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(absVal);
  return val < 0 ? `-₹${formatted}` : `₹${formatted}`;
}

export function SkuPnlTable({ skus, fileName = "Flipkart_SKU_PnL", onSelectOrder }: SkuPnlTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "sales", desc: true }]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [profitabilityFilter, setProfitabilityFilter] = useState<string>("ALL");
  const [selectedSku, setSelectedSku] = useState<SkuPnlAnalytics | null>(null);

  // Sync selectedSku with URL query param `sku`
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const skuParam = url.searchParams.get("sku");
    if (skuParam) {
      const decoded = decodeURIComponent(skuParam).replace(/\+/g, " ").trim().toLowerCase();
      const match = skus.find(
        (s) => s.sku.toLowerCase() === decoded || s.sku.toLowerCase().includes(decoded)
      );
      if (match) {
        setSelectedSku(match);
      }
      setGlobalFilter(decodeURIComponent(skuParam).replace(/\+/g, " "));
    }

    const handlePopState = () => {
      const currentUrl = new URL(window.location.href);
      const currentSkuParam = currentUrl.searchParams.get("sku");
      if (currentSkuParam) {
        const decoded = decodeURIComponent(currentSkuParam).replace(/\+/g, " ").trim().toLowerCase();
        const match = skus.find(
          (s) => s.sku.toLowerCase() === decoded || s.sku.toLowerCase().includes(decoded)
        );
        setSelectedSku(match || null);
        setGlobalFilter(decodeURIComponent(currentSkuParam).replace(/\+/g, " "));
      } else {
        setSelectedSku(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [skus]);

  const handleSelectSku = (skuData: SkuPnlAnalytics) => {
    setSelectedSku(skuData);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.get("sku") !== skuData.sku) {
        url.searchParams.set("sku", skuData.sku);
        window.history.pushState({}, "", url.pathname + (url.search ? url.search : ""));
      }
    }
  };

  const handleCloseSku = () => {
    setSelectedSku(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("sku")) {
        url.searchParams.delete("sku");
        url.searchParams.delete("orderId");
        window.history.pushState({}, "", url.pathname + (url.search ? url.search : ""));
      }
    }
  };

  const defaultVisibility: VisibilityState = {
    sku: true,
    grossUnits: true,
    returnedCancelledUnits: true,
    netUnits: true,
    sales: true,
    expenses: true,
    earnings: true,
    earningsPerUnit: true,
    settledAmount: true,
    pendingAmount: true,
    relatedOrdersCount: true,
    actions: true,

    // Secondary
    accountedSales: false,
    orderItemValue: false,
    rewards: false,
  };

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(defaultVisibility);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return skus.filter((item) => {
      if (profitabilityFilter === "profitable" && item.earnings <= 0) return false;
      if (profitabilityFilter === "loss_making" && item.earnings >= 0) return false;

      if (globalFilter) {
        const query = globalFilter.toLowerCase();
        if (!item.sku.toLowerCase().includes(query)) return false;
      }
      return true;
    });
  }, [skus, profitabilityFilter, globalFilter]);

  const hasActiveFilters = Boolean(globalFilter || profitabilityFilter !== "ALL");

  const columns = useMemo<ColumnDef<SkuPnlAnalytics>[]>(() => {
    return [
      // 1. SKU (Sticky Left)
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
            <span>Product SKU</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3 text-foreground" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3 text-foreground" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const sku = row.original.sku;
          return (
            <div className="group/cell flex items-center gap-1.5 max-w-[200px]">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectSku(row.original);
                    }}
                    className="font-mono text-xs font-semibold text-foreground hover:underline cursor-pointer truncate"
                  >
                    {sku}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="font-mono text-xs max-w-xs">
                  {sku}
                </TooltipContent>
              </Tooltip>

              <div onClick={(e) => e.stopPropagation()}>
                <CopyButton
                  text={sku}
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover/cell:opacity-100 focus-visible:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                />
              </div>
            </div>
          );
        },
      },

      // 2. Gross Units
      {
        id: "grossUnits",
        accessorKey: "grossUnits",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Gross</span>
            {column.getIsSorted() === "asc" ? <ArrowUp className="h-3 w-3" /> : column.getIsSorted() === "desc" ? <ArrowDown className="h-3 w-3" /> : null}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.grossUnits}</span>
        ),
      },

      // 3. Returned & Cancelled Units
      {
        id: "returnedCancelledUnits",
        accessorKey: "returnedCancelledUnits",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Ret + Canc</span>
            {column.getIsSorted() === "asc" ? <ArrowUp className="h-3 w-3" /> : column.getIsSorted() === "desc" ? <ArrowDown className="h-3 w-3" /> : null}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-foreground font-medium">
              {row.original.returnedCancelledUnits}
            </span>
            {row.original.grossUnits > 0 && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-mono">
                {row.original.returnRate}%
              </Badge>
            )}
          </div>
        ),
      },

      // 4. Net Units
      {
        id: "netUnits",
        accessorKey: "netUnits",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Net Units</span>
            {column.getIsSorted() === "asc" ? <ArrowUp className="h-3 w-3" /> : column.getIsSorted() === "desc" ? <ArrowDown className="h-3 w-3" /> : null}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-bold text-foreground">{row.original.netUnits}</span>
        ),
      },

      // 5. Estimated Net Sales
      {
        id: "sales",
        accessorKey: "sales",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Net Sales</span>
            {column.getIsSorted() === "asc" ? <ArrowUp className="h-3 w-3" /> : column.getIsSorted() === "desc" ? <ArrowDown className="h-3 w-3" /> : null}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-foreground">
            {formatINR(row.original.sales)}
          </span>
        ),
      },

      // 6. Total Expenses
      {
        id: "expenses",
        accessorKey: "expenses",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Expenses</span>
            {column.getIsSorted() === "asc" ? <ArrowUp className="h-3 w-3" /> : column.getIsSorted() === "desc" ? <ArrowDown className="h-3 w-3" /> : null}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {formatINR(row.original.expenses)}
          </span>
        ),
      },

      // 7. Net Earnings
      {
        id: "earnings",
        accessorKey: "earnings",
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
          const isProf = row.original.earnings >= 0;
          return (
            <span className={`font-mono text-xs font-bold ${isProf ? "text-foreground" : "text-destructive"}`}>
              {formatINR(row.original.earnings)}
            </span>
          );
        },
      },

      // 8. Earnings / Unit
      {
        id: "earningsPerUnit",
        accessorKey: "earningsPerUnit",
        header: "EPU",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            ₹{row.original.earningsPerUnit}
          </span>
        ),
      },

      // 9. Settled
      {
        id: "settledAmount",
        accessorKey: "settledAmount",
        header: "Settled",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {formatINR(row.original.settledAmount)}
          </span>
        ),
      },

      // 10. Pending
      {
        id: "pendingAmount",
        accessorKey: "pendingAmount",
        header: "Pending",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {formatINR(row.original.pendingAmount)}
          </span>
        ),
      },

      // 11. Connected Orders
      {
        id: "relatedOrdersCount",
        accessorKey: "relatedOrdersCount",
        header: "Orders",
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-[10px] font-mono h-4 px-1.5">
            {row.original.relatedOrdersCount}
          </Badge>
        ),
      },

      // 12. Actions (Sticky Right)
      {
        id: "actions",
        header: () => <span className="text-xs font-semibold text-muted-foreground">Action</span>,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectSku(item);
                }}
                className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                title="View SKU Performance Sheet"
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="sr-only">View SKU details</span>
              </Button>
            </div>
          );
        },
        size: 50,
      },
    ];
  }, []);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
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
    XLSX.utils.book_append_sheet(wb, ws, "SKU_PnL");
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
              placeholder="Search product SKU..."
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

          <Select
            value={profitabilityFilter}
            onValueChange={setProfitabilityFilter}
          >
            <SelectTrigger className="h-9 w-40 text-xs bg-background">
              <SelectValue placeholder="Profitability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All SKUs</SelectItem>
              <SelectItem value="profitable" className="text-xs">Profitable (Earnings &gt; 0)</SelectItem>
              <SelectItem value="loss_making" className="text-xs">Loss-Making (Earnings &lt; 0)</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setGlobalFilter("");
                setProfitabilityFilter("ALL");
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
            Export SKUs
          </Button>
        </div>
      </div>

      {/* SKU Data Table with Zebra Striping and Solid Sticky Columns */}
      <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground space-y-2">
            <Layers className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="font-medium text-foreground">No matching SKU financial records found</p>
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto custom-scrollbar">
            <Table className="w-full text-xs border-collapse">
              <TableHeader className="border-b border-border bg-muted/90 sticky top-0 z-30">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-border">
                    {headerGroup.headers.map((header) => {
                      const isSku = header.id === "sku";
                      const isActions = header.id === "actions";

                      return (
                        <TableHead
                          key={header.id}
                          className={`py-2.5 px-3 text-xs font-semibold text-muted-foreground whitespace-nowrap ${
                            isSku
                              ? "sticky left-0 bg-muted z-30 min-w-[180px] shadow-[1px_0_0_0_var(--border)] border-r border-border/60"
                              : isActions
                              ? "sticky right-0 bg-muted z-30 min-w-[50px] text-right shadow-[-1px_0_0_0_var(--border)] border-l border-border/60"
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
                  const stickyBg = isEven
                    ? "bg-card group-hover:bg-muted/80 dark:group-hover:bg-muted/70"
                    : "bg-secondary group-hover:bg-muted/80 dark:group-hover:bg-muted/70";

                  return (
                    <TableRow
                      key={row.id}
                      onClick={() => handleSelectSku(row.original)}
                      className={`group transition-colors border-b border-border/70 cursor-pointer ${
                        isEven
                          ? "bg-card hover:bg-muted/60 dark:hover:bg-muted/50"
                          : "bg-secondary/40 hover:bg-muted/60 dark:hover:bg-muted/50"
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const isSku = cell.column.id === "sku";
                        const isActions = cell.column.id === "actions";

                        return (
                          <TableCell
                            key={cell.id}
                            className={`py-2.5 px-3 align-middle transition-colors ${
                              isSku
                                ? `sticky left-0 z-20 min-w-[180px] ${stickyBg} shadow-[1px_0_0_0_var(--border)] border-r border-border/60`
                                : isActions
                                ? `sticky right-0 z-20 min-w-[50px] text-right ${stickyBg} shadow-[-1px_0_0_0_var(--border)] border-l border-border/60`
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
              <strong className="text-foreground">{filteredData.length}</strong> SKUs
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

      {/* Sku Details Side Drawer */}
      <SkuDetailSheet
        isOpen={Boolean(selectedSku)}
        onClose={handleCloseSku}
        skuData={selectedSku}
        onSelectOrder={onSelectOrder}
      />
    </div>
  );
}
