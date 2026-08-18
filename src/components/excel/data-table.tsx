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
  Check,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NativeSelect } from "@/components/ui/native-select";
import { ParsedSheet } from "@/types/excel";
import { formatCellValue } from "@/lib/excel-utils";
import {
  detectFlipkartColumns,
  getPrimaryVisibleColumns,
} from "@/lib/flipkart-columns";
import { StatusBadge } from "@/components/excel/status-badge";
import { CompactIdCell } from "@/components/excel/compact-id-cell";
import { RowDetailsContent } from "@/components/excel/row-details";
import { RowDetailsSheet } from "@/components/excel/row-details-sheet";
import { TableToolbar } from "@/components/excel/table-toolbar";

interface DataTableProps {
  sheet: ParsedSheet;
  sheetNames: string[];
  activeSheetName: string;
  onSelectSheet: (name: string) => void;
}

export function DataTable({
  sheet,
  sheetNames,
  activeSheetName,
  onSelectSheet,
}: DataTableProps) {
  // 1. Column Detection & Mapping
  const mapping = useMemo(
    () => detectFlipkartColumns(sheet.headers),
    [sheet.headers]
  );

  // 2. Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [returnTypeFilter, setReturnTypeFilter] = useState<string>("");
  const [reasonFilter, setReasonFilter] = useState<string>("");
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // 3. Side-Drawer Sheet State for Row Details
  const [selectedDrawerRow, setSelectedDrawerRow] = useState<Record<string, unknown> | null>(null);

  // 4. Initial Column Visibility (Primary columns visible, secondary columns hidden)
  const defaultVisibility = useMemo(() => {
    return getPrimaryVisibleColumns(sheet.headers, mapping);
  }, [sheet.headers, mapping]);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(defaultVisibility);

  // Reset column visibility to default primary columns
  const handleResetColumnVisibility = () => {
    setColumnVisibility(defaultVisibility);
  };

  const handleToggleColumnVisibility = (columnId: string, isVisible: boolean) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: isVisible,
    }));
  };

  // 5. Filtered Data (combining status, return type, reason filters)
  const filteredData = useMemo(() => {
    return sheet.fullData.filter((row) => {
      if (statusFilter && mapping.status) {
        const val = formatCellValue(row[mapping.status]).toLowerCase();
        if (val !== statusFilter.toLowerCase()) return false;
      }
      if (returnTypeFilter && mapping.returnType) {
        const val = formatCellValue(row[mapping.returnType]).toLowerCase();
        if (val !== returnTypeFilter.toLowerCase()) return false;
      }
      if (reasonFilter && mapping.returnReason) {
        const val = formatCellValue(row[mapping.returnReason]).toLowerCase();
        if (val !== reasonFilter.toLowerCase()) return false;
      }
      return true;
    });
  }, [sheet.fullData, statusFilter, returnTypeFilter, reasonFilter, mapping]);

  const hasActiveFilters = Boolean(
    globalFilter || statusFilter || returnTypeFilter || reasonFilter
  );

  const handleResetFilters = () => {
    setGlobalFilter("");
    setStatusFilter("");
    setReturnTypeFilter("");
    setReasonFilter("");
  };

  // 6. Build Columns Definition
  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    const colDefs: ColumnDef<Record<string, unknown>>[] = [];

    // Expander Column (Always first & sticky)
    colDefs.push({
      id: "expander",
      header: () => <span className="sr-only">Expand</span>,
      cell: ({ row }) => {
        return (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              row.toggleExpanded();
            }}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            <span className="sr-only">Toggle row details</span>
          </Button>
        );
      },
      size: 36,
      enableHiding: false,
    });

    // Primary & Dynamic Header Columns
    sheet.headers.forEach((header) => {
      const isReturnId = mapping.returnId === header;
      const isTrackingId = mapping.trackingId === header;
      const isShipmentId = mapping.shipmentId === header;
      const isSku = mapping.sku === header;
      const isProduct = mapping.product === header;
      const isStatus = mapping.status === header;
      const isReturnType = mapping.returnType === header;
      const isReason = mapping.returnReason === header;
      const isDate = mapping.requestedDate === header || header.toLowerCase().includes("date");
      const isPrice = mapping.price === header || header.toLowerCase().includes("price") || header.toLowerCase().includes("amount");

      colDefs.push({
        id: header,
        accessorKey: header,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(isSorted === "asc")}
              className="-ml-2 h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
            >
              <span>{header}</span>
              {isSorted === "asc" ? (
                <ArrowUp className="h-3 w-3 text-foreground" />
              ) : isSorted === "desc" ? (
                <ArrowDown className="h-3 w-3 text-foreground" />
              ) : (
                <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const rawVal = row.getValue(header);
          const cellStr = formatCellValue(rawVal);

          if (!cellStr) {
            return <span className="text-muted-foreground/40 text-xs">-</span>;
          }

          // Return ID Column (Compact + Tooltip + Copy)
          if (isReturnId) {
            return <CompactIdCell id={cellStr} label="Return ID" maxChars={14} />;
          }

          // Tracking ID Column (Compact + Tooltip + Copy)
          if (isTrackingId) {
            return <CompactIdCell id={cellStr} label="Tracking ID" maxChars={12} />;
          }

          // Shipment ID Column (Compact + Tooltip + Copy)
          if (isShipmentId) {
            return <CompactIdCell id={cellStr} label="Shipment ID" maxChars={12} />;
          }

          // SKU Column (Badge style + Tooltip)
          if (isSku) {
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="font-mono text-xs font-medium text-foreground bg-muted/60 border border-border px-1.5 py-0.5 rounded truncate max-w-[170px] inline-block">
                    {cellStr}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="font-mono text-xs max-w-xs">
                  <p className="text-[10px] text-muted-foreground font-sans uppercase">SKU</p>
                  <p className="font-semibold">{cellStr}</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          // Product Column (Flexible consuming width, truncate + Tooltip)
          if (isProduct) {
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs font-normal text-foreground truncate max-w-[280px] inline-block cursor-default">
                    {cellStr}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs max-w-sm">
                  <p className="text-[10px] text-muted-foreground uppercase">Product</p>
                  <p className="font-medium">{cellStr}</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          // Status Column (Shadcn Badge)
          if (isStatus) {
            return <StatusBadge status={cellStr} className="text-[11px]" />;
          }

          // Return Type Column
          if (isReturnType) {
            return (
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                {cellStr}
              </span>
            );
          }

          // Reason Column (Truncate + Tooltip if long)
          if (isReason) {
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground truncate max-w-[180px] inline-block cursor-default">
                    {cellStr}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs max-w-xs">
                  <p className="text-[10px] text-muted-foreground uppercase">Return Reason</p>
                  <p>{cellStr}</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          // Date Column
          if (isDate) {
            return (
              <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                {cellStr}
              </span>
            );
          }

          // Price / Amount Column
          if (isPrice) {
            const numVal = parseFloat(cellStr.replace(/[^0-9.-]+/g, ""));
            return (
              <span className="font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                {!isNaN(numVal) ? `₹${numVal.toLocaleString("en-IN")}` : cellStr}
              </span>
            );
          }

          // Standard Fallback Cell
          return (
            <span className="text-xs text-foreground whitespace-nowrap">
              {cellStr}
            </span>
          );
        },
      });
    });

    // Actions Column (Always last & sticky right)
    colDefs.push({
      id: "actions",
      header: () => <span className="text-xs font-semibold text-muted-foreground">Action</span>,
      cell: ({ row }) => {
        const rawRow = row.original;
        const returnId = mapping.returnId ? formatCellValue(rawRow[mapping.returnId]) : "";
        const trackingId = mapping.trackingId ? formatCellValue(rawRow[mapping.trackingId]) : "";
        const sku = mapping.sku ? formatCellValue(rawRow[mapping.sku]) : "";

        return (
          <div className="flex items-center justify-end gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDrawerRow(rawRow);
                  }}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
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
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                  <span className="sr-only">Open actions menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setSelectedDrawerRow(rawRow)}
                  className="text-xs gap-2"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Full Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {returnId && (
                  <DropdownMenuItem
                    onClick={() => navigator.clipboard.writeText(returnId)}
                    className="text-xs gap-2 font-mono"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Return ID
                  </DropdownMenuItem>
                )}
                {trackingId && (
                  <DropdownMenuItem
                    onClick={() => navigator.clipboard.writeText(trackingId)}
                    className="text-xs gap-2 font-mono"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Tracking ID
                  </DropdownMenuItem>
                )}
                {sku && (
                  <DropdownMenuItem
                    onClick={() => navigator.clipboard.writeText(sku)}
                    className="text-xs gap-2 font-mono"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy SKU
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      size: 70,
      enableHiding: false,
    });

    return colDefs;
  }, [sheet.headers, mapping]);

  // 7. Initialize TanStack Table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      expanded,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
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

  // 8. Export filtered data to Excel (.xlsx)
  const handleExport = () => {
    const rowsToExport = table.getFilteredRowModel().rows.map((r) => r.original);
    const ws = XLSX.utils.json_to_sheet(rowsToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    XLSX.writeFile(wb, `Flipkart_Returns_${sheet.name}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-3">
      {/* SaaS Filter & Control Toolbar */}
      <TableToolbar
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        returnTypeFilter={returnTypeFilter}
        onReturnTypeFilterChange={setReturnTypeFilter}
        reasonFilter={reasonFilter}
        onReasonFilterChange={setReasonFilter}
        data={sheet.fullData}
        headers={sheet.headers}
        mapping={mapping}
        columnVisibility={columnVisibility as Record<string, boolean>}
        onToggleColumnVisibility={handleToggleColumnVisibility}
        onResetColumnVisibility={handleResetColumnVisibility}
        onExport={handleExport}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        sheetNames={sheetNames}
        activeSheetName={activeSheetName}
        onSelectSheet={onSelectSheet}
      />

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
            <Table className="w-full text-xs">
              <TableHeader className="bg-muted/50 border-b border-border">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-border">
                    {headerGroup.headers.map((header) => {
                      const isExpander = header.id === "expander";
                      const isReturnId = mapping.returnId === header.id;
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
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
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
                  const isExpanded = row.getIsExpanded();
                  const stickyBg = isExpanded
                    ? "bg-muted group-hover:bg-muted"
                    : isEven
                      ? "bg-card group-hover:bg-muted/80 dark:group-hover:bg-muted/70"
                      : "bg-secondary group-hover:bg-muted/80 dark:group-hover:bg-muted/70";

                  return (
                    <React.Fragment key={row.id}>
                      <TableRow
                        data-state={row.getIsSelected() && "selected"}
                        onClick={() => row.toggleExpanded()}
                        className={`group transition-colors border-b border-border/70 cursor-pointer ${
                          isExpanded
                            ? "bg-muted/50 dark:bg-muted/40"
                            : isEven
                              ? "bg-card hover:bg-muted/60 dark:hover:bg-muted/50"
                              : "bg-secondary/40 hover:bg-muted/60 dark:hover:bg-muted/50"
                        }`}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const isExpander = cell.column.id === "expander";
                          const isReturnId = mapping.returnId === cell.column.id;
                          const isActions = cell.column.id === "actions";

                          return (
                            <TableCell
                              key={cell.id}
                              className={`py-2.5 px-3 align-middle transition-colors ${
                                isExpander
                                  ? `sticky left-0 z-20 w-10 min-w-10 text-center p-0 ${stickyBg}`
                                  : isReturnId
                                  ? `sticky left-10 z-20 min-w-[160px] ${stickyBg} shadow-[1px_0_0_0_var(--border)] border-r border-border/60`
                                  : isActions
                                  ? `sticky right-0 z-20 min-w-[70px] text-right ${stickyBg} shadow-[-1px_0_0_0_var(--border)] border-l border-border/60`
                                  : ""
                              }`}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>

                      {/* Expanded Row Content */}
                      {row.getIsExpanded() && (
                        <TableRow className="bg-muted/30 border-b border-border hover:bg-muted/30">
                          <TableCell
                            colSpan={row.getVisibleCells().length}
                            className="p-4 sm:p-6"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  Expanded Return Details
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDrawerRow(row.original);
                                  }}
                                  className="h-7 text-xs gap-1.5 bg-background"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Open in Side Drawer
                                </Button>
                              </div>
                              <RowDetailsContent
                                row={row.original}
                                mapping={mapping}
                                headers={sheet.headers}
                              />
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
              of{" "}
              <strong className="text-foreground">
                {filteredData.length}
              </strong>{" "}
              returns
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
                className="h-7 w-7 bg-background"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                title="First Page"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-background"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                title="Previous Page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-background"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                title="Next Page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-background"
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

      {/* Row Details Side Drawer (Sheet) */}
      <RowDetailsSheet
        isOpen={Boolean(selectedDrawerRow)}
        onClose={() => setSelectedDrawerRow(null)}
        row={selectedDrawerRow}
        mapping={mapping}
        headers={sheet.headers}
      />
    </div>
  );
}
