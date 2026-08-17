"use client";

import React from "react";
import { BarChart3 } from "lucide-react";

interface ChartEmptyStateProps {
  message?: string;
  hint?: string;
}

export function ChartEmptyState({
  message = "No data available to display.",
  hint,
}: ChartEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-2 rounded-lg bg-muted/10 border border-dashed border-border/60 min-h-48">
      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
        <BarChart3 className="h-4 w-4" />
      </div>
      <p className="text-xs font-medium text-foreground">{message}</p>
      {hint && <p className="text-[11px] text-muted-foreground max-w-xs">{hint}</p>}
    </div>
  );
}
