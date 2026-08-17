"use client";

import React from "react";
import {
  Package,
  IndianRupee,
  Receipt,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { StatusBadge } from "@/components/excel/status-badge";
import { SkuPnlAnalytics } from "../types/pnl-analytics.types";
import { OrderPnlRecord } from "../types/pnl.types";

interface SkuDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  skuData: SkuPnlAnalytics | null;
  onSelectOrder?: (order: OrderPnlRecord) => void;
}

function formatINR(val: number): string {
  if (val === 0) return "₹0";
  const absVal = Math.abs(val);
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(absVal);
  return val < 0 ? `-₹${formatted}` : `₹${formatted}`;
}

function MetricBox({
  label,
  value,
  subLabel,
  isPrice = false,
}: {
  label: string;
  value: string | number;
  subLabel?: string;
  isPrice?: boolean;
}) {
  const formattedVal = isPrice && typeof value === "number" ? formatINR(value) : String(value);

  return (
    <div className="p-3 rounded-lg bg-muted/20 border border-border/60 space-y-1">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
        {label}
      </span>
      <p className="text-sm font-bold font-mono text-foreground">{formattedVal}</p>
      {subLabel && <p className="text-[11px] text-muted-foreground">{subLabel}</p>}
    </div>
  );
}

export function SkuDetailSheet({
  isOpen,
  onClose,
  skuData,
  onSelectOrder,
}: SkuDetailSheetProps) {
  if (!skuData) return null;

  const isProfitable = skuData.earnings >= 0;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:min-w-3xl lg:min-w-4xl xl:min-w-5xl overflow-y-auto p-0 flex flex-col bg-background text-foreground border-l border-border shadow-2xl"
      >
        {/* Header */}
        <SheetHeader className="p-6 border-b border-border bg-card/60 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex flex-col gap-1.5 pr-8">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Product SKU Financial Performance
              </span>
              <Badge variant={isProfitable ? "secondary" : "destructive"} className="text-[10px] px-1.5 py-0 h-4">
                {isProfitable ? "Profitable" : "Loss-Making"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <SheetTitle className="text-lg font-bold tracking-tight font-mono text-foreground break-all select-all">
                {skuData.sku}
              </SheetTitle>
              <CopyButton
                text={skuData.sku}
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 px-2.5 cursor-pointer"
              >
                Copy SKU
              </CopyButton>
            </div>
            <SheetDescription className="text-xs text-muted-foreground">
              {skuData.netUnits} net units sold • {skuData.relatedOrdersCount} connected orders in Orders P&L
            </SheetDescription>
          </div>
        </SheetHeader>

        {/* Body Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* 1. Units & Returns / Cancellations */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                  <Package className="h-4 w-4" />
                  <span>Units & Fulfillment Summary</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Return/Cancellation Rate: {skuData.returnRate}%
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricBox label="Gross Units" value={skuData.grossUnits} />
                <MetricBox
                  label="Returned & Cancelled"
                  value={skuData.returnedCancelledUnits}
                  subLabel={`${skuData.returnRate}% of gross`}
                />
                <MetricBox label="Net Units" value={skuData.netUnits} />
                <MetricBox
                  label="Earnings / Net Unit"
                  value={skuData.earningsPerUnit}
                  isPrice
                />
              </div>
            </div>

            {/* 2. Financial Economics (Sales, Expenses, Earnings) */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2.5">
                <IndianRupee className="h-4 w-4" />
                <span>Sales, Expenses & Net Earnings</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg bg-muted/30 border border-border/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Sales Revenue</span>
                    <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xl font-bold font-mono text-foreground">{formatINR(skuData.sales)}</p>
                  <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1 border-t border-border/60">
                    <p>Accounted: {formatINR(skuData.accountedSales)}</p>
                    <p>Item Value: {formatINR(skuData.orderItemValue)}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-muted/30 border border-border/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Marketplace Expenses</span>
                    <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xl font-bold font-mono text-foreground">{formatINR(skuData.expenses)}</p>
                  <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1 border-t border-border/60">
                    <p>Rewards: {formatINR(skuData.rewards)}</p>
                    <p>{skuData.sales > 0 ? ((skuData.expenses / skuData.sales) * 100).toFixed(1) : 0}% of sales</p>
                  </div>
                </div>

                <div className={`p-3.5 rounded-lg border space-y-2 ${isProfitable ? "bg-muted/40 border-border" : "bg-destructive/10 border-destructive/30"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Net Earnings</span>
                    {isProfitable ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
                  </div>
                  <p className="text-xl font-bold font-mono text-foreground">{formatINR(skuData.earnings)}</p>
                  <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1 border-t border-border/60">
                    <p>Per Unit: ₹{skuData.earningsPerUnit}</p>
                    <p>{skuData.sales > 0 ? ((skuData.earnings / skuData.sales) * 100).toFixed(1) : 0}% profit margin</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Settlement Breakdown */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2.5">
                <Clock className="h-4 w-4" />
                <span>Bank Settlement & Pending Payout</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <MetricBox
                  label="Amount Settled"
                  value={skuData.settledAmount}
                  isPrice
                  subLabel="Cleared bank settlement"
                />
                <MetricBox
                  label="Amount Pending"
                  value={skuData.pendingAmount}
                  isPrice
                  subLabel="Pending release"
                />
              </div>
            </div>

            {/* 4. Orders Containing This SKU */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                  <ShoppingBag className="h-4 w-4" />
                  <span>Orders Containing this SKU ({skuData.relatedOrdersCount})</span>
                </div>
                <span className="text-xs text-muted-foreground">Source: Orders P&L</span>
              </div>

              {skuData.relatedOrders.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-3 text-center">
                  No individual order records matched this SKU in the Orders P&L sheet.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/60 border-b border-border text-muted-foreground font-semibold">
                      <tr>
                        <th className="py-2 px-3 text-left">Order ID</th>
                        <th className="py-2 px-3 text-left">Item ID</th>
                        <th className="py-2 px-3 text-center">Net Units</th>
                        <th className="py-2 px-3 text-right">Selling Price</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {skuData.relatedOrders.map((order, idx) => (
                        <tr
                          key={`${order.orderItemId}_${idx}`}
                          onClick={() => onSelectOrder?.(order)}
                          className="hover:bg-muted/40 transition-colors cursor-pointer"
                        >
                          <td className="py-2 px-3 font-mono font-medium text-foreground">
                            {order.orderId}
                          </td>
                          <td className="py-2 px-3 font-mono text-muted-foreground">
                            {order.orderItemId}
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-medium">
                            {order.netUnits}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-foreground">
                            {formatINR(order.finalSellingPrice)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <StatusBadge status={order.orderStatus} className="text-[10px]" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
