"use client";

import { CopyButton } from "@/components/copy-button";
import { StatusBadge } from "@/components/excel/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useExcelData } from "@/context/excel-context";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  IndianRupee,
  Package,
  Receipt,
  Search,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Truck,
  Ban,
  Undo2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { SkuPnlAnalytics } from "../types/pnl-analytics.types";
import { OrderPnlRecord } from "../types/pnl.types";

interface SkuDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  skuData: SkuPnlAnalytics | null;
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

function MetricBox({
  label,
  value,
  subLabel,
  isPrice = false,
}: {
  label: string;
  value: string | number;
  subLabel?: string;
  isPrice?: boolean;
}) {
  const formattedVal =
    isPrice && typeof value === "number" ? formatINR(value) : String(value);

  return (
    <div className="p-3 rounded-lg bg-muted/20 border border-border/60 space-y-1">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.01em] block font-sans">
        {label}
      </span>
      <p className="text-sm font-bold text-foreground tabular-nums font-sans tracking-[-0.02em]">
        {formattedVal}
      </p>
      {subLabel && (
        <p className="text-[11px] font-normal text-muted-foreground tabular-nums">
          {subLabel}
        </p>
      )}
    </div>
  );
}

function SkuOrdersTable({
  orders,
  onSelectOrder,
}: {
  orders: OrderPnlRecord[];
  onSelectOrder?: (order: OrderPnlRecord) => void;
}) {
  const { openOrderJourney } = useExcelData();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter(
      (o) =>
        o.orderId.toLowerCase().includes(q) ||
        o.orderItemId.toLowerCase().includes(q) ||
        o.orderStatus.toLowerCase().includes(q),
    );
  }, [orders, searchQuery]);

  const columns = useMemo<ColumnDef<OrderPnlRecord>[]>(
    () => [
      {
        id: "orderId",
        accessorKey: "orderId",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1 font-sans"
          >
            <span>Order ID</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3 text-foreground" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3 text-foreground" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
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
                      onSelectOrder?.(row.original);
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
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1 font-sans"
          >
            <span>Item ID</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3 text-foreground" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3 text-foreground" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const itemId = row.original.orderItemId;
          return (
            <div className="group/cell flex items-center gap-1.5 max-w-[160px]">
              <span className="font-mono text-xs text-muted-foreground truncate">
                {itemId}
              </span>
              <div onClick={(e) => e.stopPropagation()}>
                <CopyButton
                  text={itemId}
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
        id: "netUnits",
        accessorKey: "netUnits",
        header: ({ column }) => (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1 mx-auto font-sans"
            >
              <span>Units</span>
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="h-3 w-3 text-foreground" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="h-3 w-3 text-foreground" />
              ) : (
                <ArrowUpDown className="h-3 w-3 opacity-40" />
              )}
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-center text-xs font-normal tabular-nums">
            <strong className="text-foreground font-semibold">
              {row.original.netUnits}
            </strong>{" "}
            <span className="text-muted-foreground text-[11px]">
              / {row.original.grossUnits}
            </span>
          </div>
        ),
      },
      {
        id: "finalSellingPrice",
        accessorKey: "finalSellingPrice",
        header: ({ column }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1 ml-auto font-sans"
            >
              <span>Selling Price</span>
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="h-3 w-3 text-foreground" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="h-3 w-3 text-foreground" />
              ) : (
                <ArrowUpDown className="h-3 w-3 opacity-40" />
              )}
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right font-bold text-foreground tabular-nums tracking-[-0.02em] font-sans">
            {formatINR(row.original.finalSellingPrice)}
          </div>
        ),
      },
      {
        id: "netEarnings",
        accessorKey: "netEarnings",
        header: ({ column }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1 ml-auto font-sans"
            >
              <span>Net Earnings</span>
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="h-3 w-3 text-foreground" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="h-3 w-3 text-foreground" />
              ) : (
                <ArrowUpDown className="h-3 w-3 opacity-40" />
              )}
            </Button>
          </div>
        ),
        cell: ({ row }) => {
          const isProf = row.original.netEarnings >= 0;
          return (
            <div
              className={`text-right font-bold tabular-nums tracking-[-0.02em] font-sans ${
                isProf ? "text-foreground" : "text-destructive"
              }`}
            >
              {formatINR(row.original.netEarnings)}
            </div>
          );
        },
      },
      {
        id: "orderStatus",
        accessorKey: "orderStatus",
        header: ({ column }) => (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1 mx-auto font-sans"
            >
              <span>Status</span>
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="h-3 w-3 text-foreground" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="h-3 w-3 text-foreground" />
              ) : (
                <ArrowUpDown className="h-3 w-3 opacity-40" />
              )}
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            <StatusBadge
              status={row.original.orderStatus}
              className="text-[11px]"
            />
          </div>
        ),
      },
      {
        id: "actions",
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground font-sans">
            Action
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
                onSelectOrder?.(row.original);
              }}
              className="h-6 text-[11px] font-medium gap-1 px-2 bg-background hover:bg-muted cursor-pointer"
            >
              <span>Journey</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        ),
      },
    ],
    [openOrderJourney, onSelectOrder],
  );

  const table = useReactTable({
    data: filteredOrders,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  if (orders.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic py-4 text-center font-normal">
        No individual order records matched this SKU in the Orders P&L sheet.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Search Filter Header (if > 3 orders) */}
      {orders.length > 3 && (
        <div className="flex items-center justify-between gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter by Order ID, Item ID, Status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-7.5 text-xs bg-background font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums shrink-0 font-normal">
            {filteredOrders.length} order
            {filteredOrders.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* TanStack Table using Shadcn Table component */}
      <div className="rounded-lg border border-border bg-card overflow-x-auto custom-scrollbar shadow-2xs">
        <Table className="w-full min-w-[760px] table-fixed text-xs">
          <TableHeader className="bg-muted/60 border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent border-b border-border"
              >
                {headerGroup.headers.map((header) => {
                  let colWidth = "w-auto";
                  if (header.id === "orderId")
                    colWidth = "w-[24%] min-w-[170px]";
                  else if (header.id === "orderItemId")
                    colWidth = "w-[20%] min-w-[140px]";
                  else if (header.id === "netUnits")
                    colWidth = "w-[10%] min-w-[75px]";
                  else if (header.id === "finalSellingPrice")
                    colWidth = "w-[12%] min-w-[90px]";
                  else if (header.id === "netEarnings")
                    colWidth = "w-[12%] min-w-[90px]";
                  else if (header.id === "orderStatus")
                    colWidth = "w-[14%] min-w-[125px]";
                  else if (header.id === "actions")
                    colWidth = "w-[8%] min-w-[75px]";

                  return (
                    <TableHead
                      key={header.id}
                      className={`py-2 px-3 text-xs font-semibold text-muted-foreground font-sans ${colWidth}`}
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
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-6 text-muted-foreground font-normal"
                >
                  No orders match the search query.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => {
                    openOrderJourney(row.original.orderId);
                    onSelectOrder?.(row.original);
                  }}
                  className="hover:bg-muted/40 transition-colors cursor-pointer border-b border-border/60"
                >
                  {row.getVisibleCells().map((cell) => {
                    let colWidth = "w-auto";
                    if (cell.column.id === "orderId")
                      colWidth = "w-[24%] min-w-[170px]";
                    else if (cell.column.id === "orderItemId")
                      colWidth = "w-[20%] min-w-[140px]";
                    else if (cell.column.id === "netUnits")
                      colWidth = "w-[10%] min-w-[75px]";
                    else if (cell.column.id === "finalSellingPrice")
                      colWidth = "w-[12%] min-w-[90px]";
                    else if (cell.column.id === "netEarnings")
                      colWidth = "w-[12%] min-w-[90px]";
                    else if (cell.column.id === "orderStatus")
                      colWidth = "w-[14%] min-w-[125px]";
                    else if (cell.column.id === "actions")
                      colWidth = "w-[8%] min-w-[75px]";

                    return (
                      <TableCell
                        key={cell.id}
                        className={`py-2.5 px-3 align-middle overflow-hidden ${colWidth}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Clean Table Pagination Footer with Page Size Selector */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border bg-muted/20 p-2.5 sm:p-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-[11px] font-medium">Rows per page:</span>
            <NativeSelect
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="h-7 w-16 text-xs bg-background font-sans"
            >
              {[5, 10, 20, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </NativeSelect>
            <span className="hidden sm:inline">•</span>
            <span className="text-[11px]">
              Showing{" "}
              <strong className="text-foreground font-semibold tabular-nums">
                {table.getRowModel().rows.length}
              </strong>{" "}
              of{" "}
              <strong className="text-foreground font-semibold tabular-nums">
                {filteredOrders.length}
              </strong>{" "}
              orders
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground mr-1 text-[11px] tabular-nums">
              Page{" "}
              <strong className="text-foreground font-semibold">
                {table.getState().pagination.pageIndex + 1}
              </strong>{" "}
              of{" "}
              <strong className="text-foreground font-semibold">
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
    </div>
  );
}

export function SkuDetailSheet({
  isOpen,
  onClose,
  skuData,
  onSelectOrder,
}: SkuDetailSheetProps) {
  if (!skuData) return null;

  const isProfitable = skuData.earnings >= 0;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[680px] md:w-[820px] lg:w-[980px] xl:w-[1180px] sm:max-w-[94vw] overflow-y-auto custom-scrollbar p-0 flex flex-col bg-background text-foreground border-l border-border shadow-2xl"
      >
        {/* Header */}
        <SheetHeader className="p-6 border-b border-border bg-card/60 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex flex-col gap-1.5 pr-8">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.01em] font-sans">
                Product SKU Financial Performance
              </span>
              <Badge
                variant={isProfitable ? "secondary" : "destructive"}
                className="text-[11px] font-medium leading-none px-2 py-0.5"
              >
                {isProfitable ? "Profitable" : "Loss-Making"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <SheetTitle className="text-lg font-semibold tracking-[-0.015em] font-mono text-foreground break-all select-all">
                {skuData.sku}
              </SheetTitle>
              <CopyButton
                text={skuData.sku}
                variant="outline"
                size="sm"
                className="h-7 text-xs font-medium gap-1.5 px-2.5 cursor-pointer bg-background"
              >
                Copy SKU
              </CopyButton>
            </div>
            <SheetDescription className="text-xs font-normal text-muted-foreground">
              {skuData.netUnits} net units sold • {skuData.relatedOrdersCount}{" "}
              connected orders in Orders P&L
            </SheetDescription>
          </div>
        </SheetHeader>

        {/* Body Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* 1. Units & Returns / Cancellations */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground tracking-[-0.005em] font-sans">
                  <Package className="h-4 w-4 text-primary" />
                  <span>Units & Fulfillment Summary</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[11px] font-medium leading-none px-2 py-0.5 tabular-nums"
                >
                  Return/Cancellation Rate: {skuData.returnRate}%
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricBox label="Gross Units" value={skuData.grossUnits} />
                <MetricBox
                  label="Returned & Cancelled"
                  value={skuData.returnedCancelledUnits}
                  subLabel={`${skuData.returnRate}% of gross`}
                />
                <MetricBox label="Net Units" value={skuData.netUnits} />
                <MetricBox
                  label="Earnings / Net Unit"
                  value={skuData.earningsPerUnit}
                  isPrice
                />
              </div>

              {/* Detailed Return & Cancellation Breakdown */}
              {skuData.returnedCancelledUnits > 0 && (
                <div className="pt-3 border-t border-border/60 space-y-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.01em] block">
                    Breakup ({skuData.returnedCancelledUnits} non-fulfilled
                    units)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* 1. Cancelled */}
                    <div className="p-3 px-3 rounded-lg border border-red-500/20  flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-red-500/10 text-red-600 dark:text-red-400">
                          <Ban className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-foreground block uppercase">
                            Cancelled
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Buyer / Seller
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">
                          {skuData.cancelledUnits || 0}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {skuData.grossUnits > 0
                            ? `${(((skuData.cancelledUnits || 0) / skuData.grossUnits) * 100).toFixed(1)}%`
                            : "0%"}
                        </span>
                      </div>
                    </div>

                    {/* 2. Customer Return (RVP) */}
                    <div className="p-2.5 rounded-lg border border-amber-500/20  flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <Undo2 className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-foreground block uppercase">
                            Customer Return
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            RVP (Delivered $\rightarrow$ Return)
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                          {skuData.rvpUnits || 0}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {skuData.grossUnits > 0
                            ? `${(((skuData.rvpUnits || 0) / skuData.grossUnits) * 100).toFixed(1)}%`
                            : "0%"}
                        </span>
                      </div>
                    </div>

                    {/* 3. Courier Return (RTO) */}
                    <div className="p-2.5 rounded-lg border border-blue-500/20  flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <Truck className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-foreground block uppercase">
                            Courier Return
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            RTO (In-transit failure)
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {skuData.rtoUnits || 0}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {skuData.grossUnits > 0
                            ? `${(((skuData.rtoUnits || 0) / skuData.grossUnits) * 100).toFixed(1)}%`
                            : "0%"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Financial Economics (Sales, Expenses, Earnings) */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground tracking-[-0.005em] font-sans border-b border-border pb-2.5">
                <IndianRupee className="h-4 w-4 text-primary" />
                <span>Sales, Expenses & Net Earnings</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg bg-muted/30 border border-border/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      Sales Revenue
                    </span>
                    <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xl font-bold tracking-[-0.025em] text-foreground tabular-nums font-sans">
                    {formatINR(skuData.sales)}
                  </p>
                  <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1 border-t border-border/60 font-normal tabular-nums">
                    <p>Accounted: {formatINR(skuData.accountedSales)}</p>
                    <p>Item Value: {formatINR(skuData.orderItemValue)}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-muted/30 border border-border/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      Marketplace Expenses
                    </span>
                    <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xl font-bold tracking-[-0.025em] text-foreground tabular-nums font-sans">
                    {formatINR(skuData.expenses)}
                  </p>
                  <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1 border-t border-border/60 font-normal tabular-nums">
                    <p>Rewards: {formatINR(skuData.rewards)}</p>
                    <p>
                      {skuData.sales > 0
                        ? ((skuData.expenses / skuData.sales) * 100).toFixed(1)
                        : 0}
                      % of sales
                    </p>
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-lg border space-y-2 ${isProfitable ? "bg-muted/40 border-border" : "bg-destructive/10 border-destructive/30"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      Net Earnings
                    </span>
                    {isProfitable ? (
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                    )}
                  </div>
                  <p className="text-xl font-bold tracking-[-0.025em] text-foreground tabular-nums font-sans">
                    {formatINR(skuData.earnings)}
                  </p>
                  <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1 border-t border-border/60 font-normal tabular-nums">
                    <p>Per Unit: ₹{skuData.earningsPerUnit}</p>
                    <p>
                      {skuData.sales > 0
                        ? ((skuData.earnings / skuData.sales) * 100).toFixed(1)
                        : 0}
                      % profit margin
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Settlement Breakdown */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground tracking-[-0.005em] font-sans border-b border-border pb-2.5">
                <Clock className="h-4 w-4 text-primary" />
                <span>Bank Settlement & Pending Payout</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <MetricBox
                  label="Amount Settled"
                  value={skuData.settledAmount}
                  isPrice
                  subLabel="Cleared bank settlement"
                />
                <MetricBox
                  label="Amount Pending"
                  value={skuData.pendingAmount}
                  isPrice
                  subLabel="Pending release"
                />
              </div>
            </div>

            {/* 4. Orders Containing This SKU - Powered by TanStack Table & Shadcn */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground tracking-[-0.005em] font-sans">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  <span>
                    Orders Containing this SKU ({skuData.relatedOrdersCount})
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="text-[11px] font-medium leading-none px-2 py-0.5"
                >
                  Orders P&L
                </Badge>
              </div>

              <SkuOrdersTable
                orders={skuData.relatedOrders}
                onSelectOrder={onSelectOrder}
              />
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
