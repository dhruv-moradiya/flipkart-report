"use client";

import React from "react";
import { FinancialBasis } from "@/types/profit-analytics.types";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { IndianRupee, Landmark } from "lucide-react";

interface ProfitBasisToggleProps {
  value: FinancialBasis;
  onChange: (value: FinancialBasis) => void;
  className?: string;
}

export function ProfitBasisToggle({ value, onChange, className = "" }: ProfitBasisToggleProps) {
  return (
    <div className={`inline-flex items-center rounded-lg border border-border bg-muted/30 p-1 ${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={value === "netEarnings" ? "default" : "ghost"}
            size="sm"
            onClick={() => onChange("netEarnings")}
            className={`h-7 px-3 text-xs font-semibold rounded-md gap-1.5 transition-all cursor-pointer ${
              value === "netEarnings"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <IndianRupee className="h-3.5 w-3.5" />
            <span>Flipkart Net Earnings</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs max-w-xs">
          Calculates actual profit starting from Flipkart&apos;s Net Earnings (Sales minus Flipkart fees &amp; taxes).
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={value === "settlementAmount" ? "default" : "ghost"}
            size="sm"
            onClick={() => onChange("settlementAmount")}
            className={`h-7 px-3 text-xs font-semibold rounded-md gap-1.5 transition-all cursor-pointer ${
              value === "settlementAmount"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Landmark className="h-3.5 w-3.5" />
            <span>Settlement Payout</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs max-w-xs">
          Calculates actual profit starting from Flipkart&apos;s Amount Settled / Bank Settlement transferred to seller.
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
