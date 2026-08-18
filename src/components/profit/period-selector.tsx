"use client";

import React from "react";
import { PeriodInfo } from "@/types/profit-analytics.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";

interface PeriodSelectorProps {
  value: string;
  onChange: (value: string) => void;
  availablePeriods: PeriodInfo[];
  className?: string;
}

export function PeriodSelector({
  value,
  onChange,
  availablePeriods,
  className = "",
}: PeriodSelectorProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs font-medium bg-card border-border min-w-[160px] gap-2 cursor-pointer">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <SelectValue placeholder="Select Period" />
        </SelectTrigger>
        <SelectContent align="end" className="text-xs">
          <SelectItem value="all-time" className="font-semibold">
            All Time (All Uploads)
          </SelectItem>
          <SelectItem value="this-month">Latest Uploaded Month</SelectItem>
          <SelectItem value="last-3-months">Last 3 Months</SelectItem>
          <SelectItem value="last-6-months">Last 6 Months</SelectItem>
          {availablePeriods.length > 0 && (
            <div className="border-t border-border my-1 pt-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground">
                Specific Reporting Months
              </div>
              {availablePeriods.map((p) => (
                <SelectItem key={p.reportingPeriod} value={p.reportingPeriod}>
                  {p.periodLabel}
                </SelectItem>
              ))}
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
