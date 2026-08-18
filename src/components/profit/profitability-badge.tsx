import React from "react";
import { Badge } from "@/components/ui/badge";
import { ProfitabilityStatus, CostStatus } from "@/types/profit-analytics.types";
import { CheckCircle2, AlertCircle, AlertTriangle, XCircle, HelpCircle } from "lucide-react";

interface ProfitabilityBadgeProps {
  status: ProfitabilityStatus | string;
  costStatus?: CostStatus | string;
  className?: string;
  showIcon?: boolean;
}

export function ProfitabilityBadge({
  status,
  costStatus,
  className = "",
  showIcon = true,
}: ProfitabilityBadgeProps) {
  if (costStatus === "MISSING" || status === "MISSING_COST") {
    return (
      <Badge
        variant="outline"
        className={`bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 gap-1 text-[11px] font-semibold py-0.5 px-2 ${className}`}
      >
        {showIcon && <HelpCircle className="h-3 w-3 shrink-0" />}
        <span>Cost Required</span>
      </Badge>
    );
  }

  if (costStatus === "PARTIAL" || status === "INCOMPLETE_COST") {
    return (
      <Badge
        variant="outline"
        className={`bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-[11px] font-semibold py-0.5 px-2 ${className}`}
      >
        {showIcon && <AlertTriangle className="h-3 w-3 shrink-0" />}
        <span>Incomplete Cost</span>
      </Badge>
    );
  }

  if (status === "PROFITABLE") {
    return (
      <Badge
        variant="outline"
        className={`bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 text-[11px] font-bold py-0.5 px-2 ${className}`}
      >
        {showIcon && <CheckCircle2 className="h-3 w-3 shrink-0" />}
        <span>PROFITABLE</span>
      </Badge>
    );
  }

  if (status === "LOSS") {
    return (
      <Badge
        variant="outline"
        className={`bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 gap-1 text-[11px] font-bold py-0.5 px-2 ${className}`}
      >
        {showIcon && <XCircle className="h-3 w-3 shrink-0" />}
        <span>LOSS</span>
      </Badge>
    );
  }

  if (status === "BREAK_EVEN") {
    return (
      <Badge
        variant="outline"
        className={`bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30 gap-1 text-[11px] font-semibold py-0.5 px-2 ${className}`}
      >
        {showIcon && <AlertCircle className="h-3 w-3 shrink-0" />}
        <span>BREAK EVEN</span>
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={`text-[11px] py-0.5 px-2 ${className}`}>
      {status}
    </Badge>
  );
}
