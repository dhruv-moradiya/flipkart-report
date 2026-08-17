"use client";

import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  VisibilityState,
  ExpandedState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Eye,
  Copy,
  FileSpreadsheet,
  Search,
  SlidersHorizontal,
  Download,
  X,
  RotateCcw,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useExcelData } from "@/context/excel-context";
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
import { StatusBadge } from "@/components/excel/status-badge";
import { CompactIdCell } from "@/components/excel/compact-id-cell";
import { ReturnRecord } from "../types/return.types";
import { FLIPKART_FIELDS } from "../constants/flipkart-fields";
import { formatReturnType, formatReturnStatus } from "../constants/return.constants";
import { formatDate } from "../utils/date";
import { ReturnDetailsSheet } from "./return-details-sheet";

interface ReturnsDataTableProps {
  records: ReturnRecord[];
  fileName?: string;
}

export function ReturnsDataTable({ records, fileName = "Flipkart_Returns" }: ReturnsDataTableProps) {
  const { openOrderJourney } = useExcelData();
  // Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [returnTypeFilter, setReturnTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [commentsFilter, setCommentsFilter] = useState<string>("");
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [selectedDrawerRecord, setSelectedDrawerRecord] = useState<ReturnRecord | null>(null);

  // Default Column Visibility: Primary columns visible by default, secondary hidden
  const defaultVisibility: VisibilityState = {
    expander: true,
    returnId: true,
    trackingId: true,
    shipmentId: true,
    sku: true,
    product: true,
    returnType: true,
    returnReason: true,
    comments: true,
    returnStatus: true,
    returnRequestedDate: true,
    totalPrice: true,
    actions: true,

    // Secondary columns hidden by default (can be toggled in Columns menu)
    orderId: false,
    orderItemId: false,
    replacementOrderItemId: false,
    fsn: false,
    quantity: false,
    ffType: false,
    shipmentType: false,
    completionStatus: false,
    returnSubReason: false,
    vendorName: false,
    locationName: false,
    locationId: false,
    returnApprovalDate: false,
    pickedUpDate: false,
    completedDate: false,
    outForDeliveryDate: false,
    returnDeliveryPromiseDate: false,
    flyerStatus: false,
    flyerCaptured: false,
    flyerActual: false,
    deliveryProofTime: false,
    obdEligible: false,
    obdStatus: false,
    obdRemarks: false,
    deliveryProofOtc: false,
    bagTrackingId: false,
    orderType: false,
    customerGstin: false,
    customerCompanyName: false,
    irnNumber: false,
    invoiceNumber: false,
    invoiceDate: false,
  };

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(defaultVisibility);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return records.filter((r) => {
      if (returnTypeFilter && r.returnType.toLowerCase() !== returnTypeFilter.toLowerCase()) {
        return false;
      }
      if (statusFilter && r.returnStatus.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (commentsFilter === "has_comments") {
        if (!r.comments || r.comments.trim().length === 0) return false;
      } else if (commentsFilter === "no_comments") {
        if (r.comments && r.comments.trim().length > 0) return false;
      }
      if (globalFilter) {
        const query = globalFilter.toLowerCase();
        const matches =
          r.returnId.toLowerCase().includes(query) ||
          r.trackingId.toLowerCase().includes(query) ||
          r.shipmentId.toLowerCase().includes(query) ||
          r.sku.toLowerCase().includes(query) ||
          r.product.toLowerCase().includes(query) ||
          r.orderId.toLowerCase().includes(query) ||
          r.returnReason.toLowerCase().includes(query) ||
          (r.comments && r.comments.toLowerCase().includes(query)) ||
          r.vendorName.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
  }, [records, returnTypeFilter, statusFilter, commentsFilter, globalFilter]);

  const hasActiveFilters = Boolean(globalFilter || returnTypeFilter || statusFilter || commentsFilter);

  const handleResetFilters = () => {
    setGlobalFilter("");
    setReturnTypeFilter("");
    setStatusFilter("");
    setCommentsFilter("");
  };

  // Define Columns
  const columns = useMemo<ColumnDef<ReturnRecord>[]>(() => {
    return [
      // 1. Expander Column (Sticky Left: 0px)
      {
        id: "expander",
        header: () => <span className="sr-only">Expand</span>,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              row.toggleExpanded();
            }}
            className="h-6 w-6 text-muted-foreground hover:text-foreground mx-auto flex items-center justify-center cursor-pointer"
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            <span className="sr-only">Toggle row details</span>
          </Button>
        ),
        size: 40,
        enableHiding: false,
      },

      // 2. Return ID (Sticky Left: 40px)
      {
        id: "returnId",
        accessorKey: "returnId",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Return ID</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3 text-foreground" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3 text-foreground" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <CompactIdCell id={row.original.returnId} label="Return ID" maxChars={14} />
        ),
      },

      // 3. Tracking ID
      {
        id: "trackingId",
        accessorKey: "trackingId",
        header: "Tracking ID",
        cell: ({ row }) => (
          <CompactIdCell id={row.original.trackingId} label="Tracking ID" maxChars={12} />
        ),
      },

      // 4. Shipment ID
      {
        id: "shipmentId",
        accessorKey: "shipmentId",
        header: "Shipment ID",
        cell: ({ row }) => (
          <CompactIdCell id={row.original.shipmentId} label="Shipment ID" maxChars={12} />
        ),
      },

      // 5. SKU
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
              <ArrowUp className="h-3 w-3 text-foreground" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3 text-foreground" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-mono text-xs font-medium text-foreground bg-muted/60 border border-border px-1.5 py-0.5 rounded truncate max-w-[160px] inline-block cursor-default">
                {row.original.sku || "-"}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="font-mono text-xs max-w-xs">
              <p className="text-[10px] text-muted-foreground font-sans uppercase">SKU</p>
              <p className="font-semibold">{row.original.sku}</p>
            </TooltipContent>
          </Tooltip>
        ),
      },

      // 6. Product (Flexible consuming width)
      {
        id: "product",
        accessorKey: "product",
        header: "Product",
        cell: ({ row }) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs font-normal text-foreground truncate max-w-[240px] inline-block cursor-default">
                {row.original.product || "-"}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-sm">
              <p className="text-[10px] text-muted-foreground uppercase">Product Title</p>
              <p className="font-medium">{row.original.product}</p>
            </TooltipContent>
          </Tooltip>
        ),
      },

      // 7. Return Type
      {
        id: "returnType",
        accessorKey: "returnType",
        header: "Return Type",
        cell: ({ row }) => (
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {formatReturnType(row.original.returnType)}
          </span>
        ),
      },

      // 8. Return Reason
      {
        id: "returnReason",
        accessorKey: "returnReason",
        header: "Reason",
        cell: ({ row }) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground truncate max-w-[150px] inline-block cursor-default">
                {row.original.returnReason || "-"}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-xs">
              <p className="text-[10px] text-muted-foreground uppercase">Return Reason</p>
              <p>{row.original.returnReason}</p>
              {row.original.returnSubReason && (
                <p className="text-muted-foreground/80 mt-1 text-[11px]">
                  Sub-reason: {row.original.returnSubReason}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        ),
      },

      // 9. Comments Column
      {
        id: "comments",
        accessorKey: "comments",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Comments</span>
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
          const comment = row.original.comments?.trim();

          if (!comment) {
            return <span className="text-muted-foreground text-xs">—</span>;
          }

          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 max-w-[260px] cursor-default">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-foreground truncate font-normal">
                    {comment}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-sm break-words">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Flipkart Return Comment
                  </p>
                  <p className="font-normal text-background">{comment}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        },
      },

      // 10. Status (Semantic Badge)
      {
        id: "returnStatus",
        accessorKey: "returnStatus",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge status={formatReturnStatus(row.original.returnStatus)} className="text-[11px]" />
        ),
      },

      // 11. Requested Date
      {
        id: "returnRequestedDate",
        accessorKey: "returnRequestedDate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Requested</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3 text-foreground" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3 text-foreground" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
            {formatDate(row.original.returnRequestedDate)}
          </span>
        ),
      },

      // 12. Total Price
      {
        id: "totalPrice",
        accessorKey: "totalPrice",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Value</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3 text-foreground" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3 text-foreground" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-foreground whitespace-nowrap">
            ₹{row.original.totalPrice.toLocaleString("en-IN")}
          </span>
        ),
      },

      // 13. Actions Column (Sticky Right: 0px)
      {
        id: "actions",
        header: () => <span className="text-xs font-semibold text-muted-foreground">Action</span>,
        cell: ({ row }) => {
          const rec = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDrawerRecord(rec);
                    }}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span className="sr-only">View full details</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">View details</TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover text-popover-foreground border-border">
                  <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => openOrderJourney(rec.orderId)}
                    className="text-xs gap-2 cursor-pointer font-medium"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Open Order Journey
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedDrawerRecord(rec)}
                    className="text-xs gap-2 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Details Sheet
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigator.clipboard.writeText(rec.returnId)}
                    className="text-xs gap-2 font-mono cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Return ID
                  </DropdownMenuItem>
                  {rec.trackingId && (
                    <DropdownMenuItem
                      onClick={() => navigator.clipboard.writeText(rec.trackingId)}
                      className="text-xs gap-2 font-mono cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy Tracking ID
                    </DropdownMenuItem>
                  )}
                  {rec.sku && (
                    <DropdownMenuItem
                      onClick={() => navigator.clipboard.writeText(rec.sku)}
                      className="text-xs gap-2 font-mono cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy SKU
                    </DropdownMenuItem>
                  )}
                  {rec.comments && (
                    <DropdownMenuItem
                      onClick={() => navigator.clipboard.writeText(rec.comments!)}
                      className="text-xs gap-2 cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Copy Comment
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        size: 70,
        enableHiding: false,
      },
    ];
  }, []);

  // Initialize TanStack React Table
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      expanded,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  // Export filtered rows to Excel (preserves Comments field)
  const handleExport = () => {
    const rowsToExport = table.getFilteredRowModel().rows.map((r) => r.original);
    const ws = XLSX.utils.json_to_sheet(rowsToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Returns");
    XLSX.writeFile(wb, `${fileName}_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-3">
      {/* SaaS Filter & Control Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-xs">
        {/* Left Side: Search and Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ID, SKU, Product, Comments..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 h-9 text-xs bg-background"
            />
            {globalFilter && (
              <button
                type="button"
                onClick={() => setGlobalFilter("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Return Type Filter */}
          <Select
            value={returnTypeFilter}
            onValueChange={(val) => setReturnTypeFilter(val === "ALL" ? "" : val)}
          >
            <SelectTrigger className="h-9 w-36 text-xs bg-background">
              <SelectValue placeholder="Return Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Types</SelectItem>
              <SelectItem value="customer_return" className="text-xs">Customer Returns</SelectItem>
              <SelectItem value="courier_return" className="text-xs">Courier Returns</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val === "ALL" ? "" : val)}
          >
            <SelectTrigger className="h-9 w-36 text-xs bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
              <SelectItem value="in_transit" className="text-xs">In Transit</SelectItem>
              <SelectItem value="start" className="text-xs">Start</SelectItem>
              <SelectItem value="completed" className="text-xs">Completed</SelectItem>
            </SelectContent>
          </Select>

          {/* Comments Filter */}
          <Select
            value={commentsFilter}
            onValueChange={(val) => setCommentsFilter(val === "ALL" ? "" : val)}
          >
            <SelectTrigger className="h-9 w-36 text-xs bg-background">
              <SelectValue placeholder="Comments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Comments</SelectItem>
              <SelectItem value="has_comments" className="text-xs">Has Comments</SelectItem>
              <SelectItem value="no_comments" className="text-xs">No Comments</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>

        {/* Right Side: Columns Visibility & Export */}
        <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs bg-background">
                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto bg-popover text-popover-foreground border-border">
              <DropdownMenuLabel className="text-xs flex items-center justify-between">
                <span>Toggle Columns</span>
                <button
                  type="button"
                  onClick={() => setColumnVisibility(defaultVisibility)}
                  className="text-[11px] text-muted-foreground hover:text-foreground font-normal cursor-pointer"
                >
                  Reset
                </button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {Object.entries(FLIPKART_FIELDS).map(([key, label]) => {
                  const isVisible = columnVisibility[key] !== false;
                  return (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={isVisible}
                      onCheckedChange={(checked) =>
                        setColumnVisibility((prev) => ({ ...prev, [key]: checked }))
                      }
                      className="text-xs capitalize cursor-pointer"
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-9 gap-1.5 text-xs bg-background"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            Export
          </Button>
        </div>
      </div>

      {/* Production-Grade Returns Data Table */}
      <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground space-y-2">
            <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="font-medium text-foreground">No matching return records found</p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="mt-2 text-xs"
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto">
            <Table className="w-full text-xs border-collapse">
              <TableHeader className="border-b border-border bg-muted/90 sticky top-0 z-30">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-border">
                    {headerGroup.headers.map((header) => {
                      const isExpander = header.id === "expander";
                      const isReturnId = header.id === "returnId";
                      const isActions = header.id === "actions";

                      return (
                        <TableHead
                          key={header.id}
                          className={`py-2.5 px-3 text-xs font-semibold text-muted-foreground whitespace-nowrap ${
                            isExpander
                              ? "sticky left-0 bg-muted z-30 w-10 min-w-10 text-center p-0"
                              : isReturnId
                              ? "sticky left-10 bg-muted z-30 min-w-[160px] shadow-[1px_0_0_0_var(--border)] border-r border-border/60"
                              : isActions
                              ? "sticky right-0 bg-muted z-30 min-w-[70px] text-right shadow-[-1px_0_0_0_var(--border)] border-l border-border/60"
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
                    <React.Fragment key={row.id}>
                      {/* Main Table Row with alternating zebra striping and smooth hover */}
                      <TableRow
                        onClick={() => row.toggleExpanded()}
                        className={`group transition-colors border-b border-border/70 cursor-pointer ${
                          isEven
                            ? "bg-card hover:bg-muted/70 dark:hover:bg-muted/60"
                            : "bg-muted/25 hover:bg-muted/70 dark:hover:bg-muted/60"
                        } ${row.getIsExpanded() ? "!bg-muted/40" : ""}`}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const isExpander = cell.column.id === "expander";
                          const isReturnId = cell.column.id === "returnId";
                          const isActions = cell.column.id === "actions";

                          return (
                            <TableCell
                              key={cell.id}
                              className={`py-2.5 px-3 align-middle transition-colors ${
                                isExpander
                                  ? `sticky left-0 z-20 w-10 min-w-10 text-center p-0 ${
                                      isEven
                                        ? "bg-card group-hover:bg-muted/70 dark:group-hover:bg-muted/60"
                                        : "bg-muted/25 group-hover:bg-muted/70 dark:group-hover:bg-muted/60"
                                    } ${row.getIsExpanded() ? "!bg-muted/40" : ""}`
                                  : isReturnId
                                  ? `sticky left-10 z-20 min-w-[160px] ${
                                      isEven
                                        ? "bg-card group-hover:bg-muted/70 dark:group-hover:bg-muted/60"
                                        : "bg-muted/25 group-hover:bg-muted/70 dark:group-hover:bg-muted/60"
                                    } shadow-[1px_0_0_0_var(--border)] border-r border-border/60 ${
                                      row.getIsExpanded() ? "!bg-muted/40" : ""
                                    }`
                                  : isActions
                                  ? `sticky right-0 z-20 min-w-[70px] text-right ${
                                      isEven
                                        ? "bg-card group-hover:bg-muted/70 dark:group-hover:bg-muted/60"
                                        : "bg-muted/25 group-hover:bg-muted/70 dark:group-hover:bg-muted/60"
                                    } shadow-[-1px_0_0_0_var(--border)] border-l border-border/60 ${
                                      row.getIsExpanded() ? "!bg-muted/40" : ""
                                    }`
                                  : ""
                              }`}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          );
                        })}
                      </TableRow>

                      {/* Inline Expanded Row */}
                      {row.getIsExpanded() && (
                        <TableRow className="bg-muted/30 border-b border-border hover:bg-muted/30">
                          <TableCell colSpan={row.getVisibleCells().length} className="p-4 sm:p-5">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                  Return Details Summary
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDrawerRecord(row.original);
                                  }}
                                  className="h-7 text-xs gap-1.5 bg-background shadow-xs cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Inspect All 43 Fields
                                </Button>
                              </div>

                              {/* Prominent Comments Box if present */}
                              {row.original.comments && (
                                <div className="rounded-lg border border-border bg-card p-3 space-y-1.5 shadow-xs">
                                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <MessageSquare className="h-3.5 w-3.5 text-foreground" />
                                    Return Comments
                                  </span>
                                  <p className="text-xs text-foreground bg-muted/40 p-2.5 rounded border border-border/80 leading-relaxed select-all">
                                    {row.original.comments}
                                  </p>
                                </div>
                              )}

                              {/* Quick Grid Breakdown */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs bg-card p-3.5 rounded-lg border border-border shadow-xs">
                                <div>
                                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">Order ID</span>
                                  <p className="font-mono font-medium text-foreground select-all">{row.original.orderId || "-"}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">Vendor</span>
                                  <p className="font-medium text-foreground">{row.original.vendorName || "-"}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">Location</span>
                                  <p className="font-medium text-foreground">{row.original.locationName || "-"}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">FF Type</span>
                                  <p className="font-medium text-foreground">{row.original.ffType || "-"}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">Completion</span>
                                  <p className="font-medium text-foreground">{row.original.completionStatus || "-"}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">Delivery Promise</span>
                                  <p className="font-mono text-foreground">{formatDate(row.original.returnDeliveryPromiseDate)}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">FSN</span>
                                  <p className="font-mono text-foreground select-all">{row.original.fsn || "-"}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">Quantity</span>
                                  <p className="font-medium text-foreground">{row.original.quantity}</p>
                                </div>
                              </div>
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
              Showing <strong className="text-foreground">{table.getRowModel().rows.length}</strong> of{" "}
              <strong className="text-foreground">{filteredData.length}</strong> returns
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

      {/* Row Details Side Drawer */}
      <ReturnDetailsSheet
        isOpen={Boolean(selectedDrawerRecord)}
        onClose={() => setSelectedDrawerRecord(null)}
        record={selectedDrawerRecord}
      />
    </div>
  );
}
