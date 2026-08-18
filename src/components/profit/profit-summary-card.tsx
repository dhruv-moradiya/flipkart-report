import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FinancialBasis } from "@/types/profit-analytics.types";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ProfitSummaryCardProps {
  financialAmount: number;
  totalProductCost: number | null;
  totalLogisticsCost: number | null;
  totalPackagingCost: number | null;
  totalOtherCost: number | null;
  totalSellerCost: number | null;
  actualProfit: number | null;
  financialBasis?: FinancialBasis;
  units?: number;
  className?: string;
}

export function ProfitSummaryCard({
  financialAmount,
  totalProductCost,
  totalLogisticsCost,
  totalPackagingCost,
  totalOtherCost,
  totalSellerCost,
  actualProfit,
  financialBasis = "netEarnings",
  units,
  className = "",
}: ProfitSummaryCardProps) {
  const isComplete = actualProfit !== null;
  const isProfitable = (actualProfit ?? 0) > 0;
  const isLoss = (actualProfit ?? 0) < 0;

  return (
    <Card className={`border border-border bg-card shadow-sm overflow-hidden ${className}`}>
      <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Actual Profit Waterfall Breakdown
          </CardTitle>
          <span className="text-[11px] font-medium text-muted-foreground">
            Basis: {financialBasis === "netEarnings" ? "Net Earnings" : "Settlement Payout"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-2.5 font-mono text-xs">
        {/* Flipkart Base Amount */}
        <div className="flex items-center justify-between text-foreground">
          <span className="font-sans font-medium text-muted-foreground flex items-center gap-1">
            Flipkart Financial Amount
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="font-sans text-xs">
                {financialBasis === "netEarnings"
                  ? "Net earnings from Flipkart after all official marketplace deductions."
                  : "Actual settlement funds transferred by Flipkart."}
              </TooltipContent>
            </Tooltip>
          </span>
          <span className="font-bold text-sm">₹{financialAmount.toLocaleString("en-IN")}</span>
        </div>

        {/* Product Cost */}
        <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
          <span className="font-sans text-muted-foreground">Seller Product Cost</span>
          <span>
            {totalProductCost !== null
              ? `-₹${totalProductCost.toLocaleString("en-IN")}`
              : "Not Configured"}
          </span>
        </div>

        {/* Logistics Cost */}
        <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
          <span className="font-sans text-muted-foreground">Seller Logistics Cost</span>
          <span>
            {totalLogisticsCost !== null
              ? `-₹${totalLogisticsCost.toLocaleString("en-IN")}`
              : "Not Configured"}
          </span>
        </div>

        {/* Packaging Cost */}
        <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
          <span className="font-sans text-muted-foreground">Packaging Cost</span>
          <span>
            {totalPackagingCost !== null
              ? `-₹${totalPackagingCost.toLocaleString("en-IN")}`
              : "Not Configured"}
          </span>
        </div>

        {/* Other Cost */}
        <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
          <span className="font-sans text-muted-foreground">Other Cost</span>
          <span>
            {totalOtherCost !== null
              ? `-₹${totalOtherCost.toLocaleString("en-IN")}`
              : "Not Configured"}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-2 flex items-center justify-between">
          <span className="font-sans font-bold text-foreground">Actual Business Profit</span>
          {isComplete ? (
            <span
              className={`font-bold text-base ${
                isProfitable
                  ? "text-emerald-600 dark:text-emerald-400"
                  : isLoss
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-foreground"
              }`}
            >
              {actualProfit >= 0 ? `₹${actualProfit.toLocaleString("en-IN")}` : `-₹${Math.abs(actualProfit).toLocaleString("en-IN")}`}
            </span>
          ) : (
            <span className="text-amber-500 font-sans text-xs font-semibold">
              Cost Details Required
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
