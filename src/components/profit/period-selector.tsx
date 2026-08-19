"use client";

import React from "react";
import { PeriodInfo } from "@/types/profit-analytics.types";
import { PnlReportImportItem } from "@/types/sku-cost.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, FileSpreadsheet } from "lucide-react";

interface PeriodSelectorProps {
  value: string;
  onChange: (value: string) => void;
  availablePeriods?: PeriodInfo[];
  reports?: PnlReportImportItem[];
  className?: string;
}

export function PeriodSelector({
  value,
  onChange,
  availablePeriods = [],
  reports = [],
  className = "",
}: PeriodSelectorProps) {
  // If reports is provided and has items, use them; otherwise fallback to availablePeriods
  const pnlReports = reports.filter(
    (r) =>
      r.reportType === "FLIPKART_PNL" ||
      (!r.fileName.toLowerCase().includes("return") &&
        !r.fileName.toLowerCase().includes("settled") &&
        (r.skuCount ?? 0) > 0)
  );

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs font-medium bg-card border-border min-w-[200px] gap-2 cursor-pointer shadow-2xs">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <SelectValue placeholder="Select Report or Period" />
        </SelectTrigger>
        <SelectContent align="end" className="text-xs max-h-80 min-w-[260px]">
          {pnlReports.length > 0 ? (
            <div>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Uploaded P&L Reports ({pnlReports.length})
              </div>
              {pnlReports.map((r) => (
                <SelectItem key={r._id} value={r._id} className="cursor-pointer py-1.5">
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="font-semibold text-foreground">
                      {r.periodLabel || r.fileName}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[220px]">
                      {r.fileName}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </div>
          ) : availablePeriods.length > 0 ? (
            <div>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Specific Reporting Months
              </div>
              {availablePeriods.map((p) => (
                <SelectItem key={p.reportingPeriod} value={p.reportingPeriod} className="cursor-pointer">
                  {p.periodLabel}
                </SelectItem>
              ))}
            </div>
          ) : null}

          <div className="border-t border-border my-1 pt-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Combined Time Ranges
            </div>
            <SelectItem value="all-time" className="font-semibold cursor-pointer">
              All Time (All Uploads)
            </SelectItem>
            <SelectItem value="this-month" className="cursor-pointer">
              Latest Uploaded Month
            </SelectItem>
            <SelectItem value="last-3-months" className="cursor-pointer">
              Last 3 Months
            </SelectItem>
            <SelectItem value="last-6-months" className="cursor-pointer">
              Last 6 Months
            </SelectItem>
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}
