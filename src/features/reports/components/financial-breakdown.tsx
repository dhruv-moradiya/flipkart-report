"use client";

import React, { useState } from "react";
import {
  IndianRupee,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { OrderFinancialSummary } from "../models/journey.models";
import { formatINR } from "../excel/value-parser";

interface FinancialBreakdownProps {
  financials: OrderFinancialSummary;
  sourceSheetName?: string;
  className?: string;
}

export function FinancialBreakdownView({
  financials,
  sourceSheetName = "Orders P&L",
  className = "",
}: FinancialBreakdownProps) {
  const [showAllFees, setShowAllFees] = useState(false);

  const exp = financials.expensesBreakup;
  const taxes = financials.taxes;

  const allFeeItems = [
    { label: "Commission Fee", value: exp.commissionFee },
    { label: "Fixed Fee", value: exp.fixedFee },
    { label: "Collection Fee", value: exp.collectionFee },
    { label: "Pick & Pack Fee", value: exp.pickAndPackFee },
    { label: "Forward Shipping", value: exp.forwardShippingFee },
    { label: "Reverse Shipping", value: exp.reverseShippingFee },
    { label: "Offer Adjustments", value: exp.offerAdjustments || 0 },
    { label: "Storage Fee", value: exp.storageFee || 0 },
    { label: "Recall Fee", value: exp.recallFee || 0 },
    { label: "No Cost EMI Subvention", value: exp.noCostEmiFeeReimbursement || 0 },
    { label: "Installation Fee", value: exp.installationFee || 0 },
    { label: "Tech Visit Fee", value: exp.techVisitFee || 0 },
    { label: "Uninstallation & Packaging", value: exp.uninstallationPackagingFee || 0 },
    { label: "Customer Add-ons Recovery", value: exp.customerAddOnsAmountRecovery || 0 },
    { label: "Franchise Fee", value: exp.franchiseFee || 0 },
    { label: "Shopsy Marketing Fee", value: exp.shopsyMarketingFee || 0 },
    { label: "Product Cancellation Penalty", value: exp.productCancellationFee || 0 },
    { label: "Taxes (GST)", value: taxes.gst },
    { label: "Taxes (TCS)", value: taxes.tcs },
    { label: "Taxes (TDS)", value: taxes.tds },
  ];

  // By default, show non-zero fees first; if showAllFees is true, show all 20 fees
  const displayedFees = showAllFees ? allFeeItems : allFeeItems.filter((f) => f.value !== 0);

  return (
    <div className={`rounded-xl border border-border bg-card p-4 space-y-4 shadow-xs ${className}`}>
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
          <IndianRupee className="h-4 w-4" />
          <span>Item Financial Economics</span>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          Source: {sourceSheetName}
        </span>
      </div>

      {/* 4 Step Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-muted/20 border border-border/70 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Selling Price</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-xs">
                Final Selling Price: Listing price visible to customers.
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-base font-bold font-mono text-foreground">{formatINR(financials.finalSellingPrice)}</p>
          <p className="text-[10px] text-muted-foreground">Item Value: {formatINR(financials.orderItemValue)}</p>
        </div>

        <div className="p-3 rounded-lg bg-muted/20 border border-border/70 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Total Expenses</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-xs">
                Total Marketplace fees charged against the order item.
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-base font-bold font-mono text-foreground">{formatINR(financials.totalExpenses)}</p>
          <p className="text-[10px] text-muted-foreground">Benefits: {formatINR(financials.totalBenefits)}</p>
        </div>

        <div className="p-3 rounded-lg bg-muted/20 border border-border/70 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Net Earnings</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-xs">
                Net Earnings = Final Bank Settlement + Input Tax Credits.
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-base font-bold font-mono text-foreground">{formatINR(financials.netEarnings)}</p>
          <p className="text-[10px] text-muted-foreground">ITC: {formatINR(financials.inputTaxCredits)}</p>
        </div>

        <div className="p-3 rounded-lg bg-muted/20 border border-border/70 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Settled / Pending</span>
            <Clock className="h-3 w-3 text-muted-foreground" />
          </div>
          <p className="text-base font-bold font-mono text-foreground">{formatINR(financials.amountSettled)}</p>
          <p className="text-[10px] text-muted-foreground">Pending: {formatINR(financials.amountPending)}</p>
        </div>
      </div>

      {/* Granular Fee Grid */}
      <div className="pt-2 border-t border-border">
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-semibold text-muted-foreground">
            Fee & Tax Breakdown ({displayedFees.length} fields)
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllFees(!showAllFees)}
            className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {showAllFees ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showAllFees ? "Hide Zero-Value Fees" : "Show All 20 Expense Fields"}
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs bg-muted/20 p-3 rounded-lg border border-border">
          {displayedFees.map((item, idx) => (
            <div key={idx} className="p-2 bg-background/50 rounded border border-border/50 space-y-0.5">
              <span className="text-[10px] text-muted-foreground block truncate" title={item.label}>
                {item.label}
              </span>
              <p className={`font-mono font-medium ${item.value < 0 ? "text-foreground" : item.value > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                {formatINR(item.value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
