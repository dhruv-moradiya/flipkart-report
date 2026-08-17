"use client";

import React, { useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  Download,
  X,
  Layers,
  Table as TableIcon,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { FlipkartColumnMapping } from "@/lib/flipkart-columns";
import { formatCellValue } from "@/lib/excel-utils";

interface TableToolbarProps {
  // Search
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;

  // Filters
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  returnTypeFilter: string;
  onReturnTypeFilterChange: (value: string) => void;
  reasonFilter: string;
  onReasonFilterChange: (value: string) => void;

  // Data & Column Mapping
  data: Record<string, unknown>[];
  headers: string[];
  mapping: FlipkartColumnMapping;

  // Column Visibility
  columnVisibility: Record<string, boolean>;
  onToggleColumnVisibility: (columnId: string, isVisible: boolean) => void;
  onResetColumnVisibility: () => void;

  // Export
  onExport: () => void;

  // Reset all filters
  onResetFilters: () => void;
  hasActiveFilters: boolean;

  // Sheet Switcher
  sheetNames: string[];
  activeSheetName: string;
  onSelectSheet: (name: string) => void;
}

export function TableToolbar({
  globalFilter,
  onGlobalFilterChange,
  statusFilter,
  onStatusFilterChange,
  returnTypeFilter,
  onReturnTypeFilterChange,
  reasonFilter,
  onReasonFilterChange,
  data,
  headers,
  mapping,
  columnVisibility,
  onToggleColumnVisibility,
  onResetColumnVisibility,
  onExport,
  onResetFilters,
  hasActiveFilters,
  sheetNames,
  activeSheetName,
  onSelectSheet,
}: TableToolbarProps) {
  // Extract unique statuses from dataset
  const uniqueStatuses = useMemo(() => {
    if (!mapping.status) return [];
    const set = new Set<string>();
    data.forEach((row) => {
      const val = formatCellValue(row[mapping.status!]);
      if (val) set.add(val);
    });
    return Array.from(set).sort();
  }, [data, mapping.status]);

  // Extract unique return types from dataset
  const uniqueReturnTypes = useMemo(() => {
    if (!mapping.returnType) return [];
    const set = new Set<string>();
    data.forEach((row) => {
      const val = formatCellValue(row[mapping.returnType!]);
      if (val) set.add(val);
    });
    return Array.from(set).sort();
  }, [data, mapping.returnType]);

  // Extract unique return reasons from dataset
  const uniqueReasons = useMemo(() => {
    if (!mapping.returnReason) return [];
    const set = new Set<string>();
    data.forEach((row) => {
      const val = formatCellValue(row[mapping.returnReason!]);
      if (val) set.add(val);
    });
    return Array.from(set).slice(0, 20);
  }, [data, mapping.returnReason]);

  return (
    <div className="space-y-3">
      {/* Top Bar: Sheet Switcher (if multiple) */}
      {sheetNames.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 shrink-0">
            <Layers className="h-3.5 w-3.5" />
            Sheets:
          </span>
          {sheetNames.map((name) => (
            <Button
              key={name}
              variant={name === activeSheetName ? "default" : "outline"}
              size="sm"
              onClick={() => onSelectSheet(name)}
              className="h-7 text-xs gap-1.5"
            >
              <TableIcon className="h-3.5 w-3.5" />
              {name}
            </Button>
          ))}
        </div>
      )}

      {/* Main SaaS Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-xs">
        {/* Left Side: Search and Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Global Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search returns, IDs, SKUs..."
              value={globalFilter}
              onChange={(e) => onGlobalFilterChange(e.target.value)}
              className="pl-8 h-9 text-xs bg-background"
            />
            {globalFilter && (
              <button
                type="button"
                onClick={() => onGlobalFilterChange("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          {uniqueStatuses.length > 0 && (
            <Select
              value={statusFilter}
              onValueChange={(val) => onStatusFilterChange(val === "ALL" ? "" : val)}
            >
              <SelectTrigger className="h-9 w-36 text-xs bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  All Statuses
                </SelectItem>
                {uniqueStatuses.map((st) => (
                  <SelectItem key={st} value={st} className="text-xs">
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Return Type Filter */}
          {uniqueReturnTypes.length > 0 && (
            <Select
              value={returnTypeFilter}
              onValueChange={(val) => onReturnTypeFilterChange(val === "ALL" ? "" : val)}
            >
              <SelectTrigger className="h-9 w-36 text-xs bg-background">
                <SelectValue placeholder="Return Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  All Types
                </SelectItem>
                {uniqueReturnTypes.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Return Reason Filter */}
          {uniqueReasons.length > 0 && (
            <Select
              value={reasonFilter}
              onValueChange={(val) => onReasonFilterChange(val === "ALL" ? "" : val)}
            >
              <SelectTrigger className="h-9 w-40 text-xs bg-background truncate">
                <SelectValue placeholder="Reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  All Reasons
                </SelectItem>
                {uniqueReasons.map((r) => (
                  <SelectItem key={r} value={r} className="text-xs">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Reset Filters CTA */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-9 gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>

        {/* Right Side: Columns Visibility & Export */}
        <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
          {/* Columns Visibility Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs bg-background">
                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto">
              <DropdownMenuLabel className="text-xs flex items-center justify-between">
                <span>Toggle Columns</span>
                <button
                  type="button"
                  onClick={onResetColumnVisibility}
                  className="text-[11px] text-muted-foreground hover:text-foreground font-normal"
                >
                  Reset
                </button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {headers.map((header) => {
                  const isVisible = columnVisibility[header] !== false;
                  return (
                    <DropdownMenuCheckboxItem
                      key={header}
                      checked={isVisible}
                      onCheckedChange={(checked) => onToggleColumnVisibility(header, checked)}
                      className="text-xs capitalize"
                    >
                      {header}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export Filtered Dataset */}
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="h-9 gap-1.5 text-xs bg-background"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}
