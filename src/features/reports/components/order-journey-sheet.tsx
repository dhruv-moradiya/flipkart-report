"use client";

import React, { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CopyButton } from "@/components/copy-button";
import { StatusBadge } from "@/components/excel/status-badge";
import {
  ShoppingBag,
  Package,
  IndianRupee,
  Receipt,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertOctagon,
  HelpCircle,
  Layers,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useExcelData } from "@/context/excel-context";
import {
  OrderJourney,
  OrderJourneyItem,
  JourneyTimelineEvent,
} from "../models/journey.models";
import { FinancialBreakdownView } from "./financial-breakdown";
import { formatINR } from "../excel/value-parser";
import { formatDate } from "../excel/date-parser";

export function OrderJourneySheet() {
  const { activeJourney, closeOrderJourney, uploadedReportsState } =
    useExcelData();

  const statusSummary = useMemo(() => {
    if (!activeJourney) return null;
    let deliveredCount = 0;
    let returnedCount = 0;
    let cancelledCount = 0;
    let otherCount = 0;

    activeJourney.items.forEach((item) => {
      const s = item.orderStatus.toLowerCase();
      if (s.includes("delivered") || s.includes("completed")) {
        deliveredCount++;
      } else if (s.includes("return") || s.includes("rto") || s.includes("rvp")) {
        returnedCount++;
      } else if (s.includes("cancel")) {
        cancelledCount++;
      } else {
        otherCount++;
      }
    });

    const total = activeJourney.items.length;
    let status = "MIXED";

    if (deliveredCount === total) {
      status = "DELIVERED";
    } else if (returnedCount === total) {
      status = "RETURNED";
    } else if (cancelledCount === total) {
      status = "CANCELLED";
    } else if (deliveredCount > 0 && returnedCount > 0 && cancelledCount === 0 && otherCount === 0) {
      status = "PARTIALLY RETURNED";
    } else if (deliveredCount > 0 && cancelledCount > 0 && returnedCount === 0 && otherCount === 0) {
      status = "PARTIALLY CANCELLED";
    } else if (deliveredCount > 0 || returnedCount > 0 || cancelledCount > 0) {
      status = "MIXED";
    }

    return {
      status,
      deliveredCount,
      returnedCount,
      cancelledCount,
      otherCount,
    };
  }, [activeJourney]);

  if (!activeJourney || !statusSummary) return null;

  const skuParam =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("sku")
      : null;

  return (
    <Sheet
      open={Boolean(activeJourney)}
      onOpenChange={(open) => !open && closeOrderJourney()}
    >
      <SheetContent
        side="right"
        className="w-full sm:min-w-3xl lg:min-w-4xl xl:min-w-5xl overflow-y-auto p-0 flex flex-col bg-background text-foreground border-l border-border shadow-2xl gap-0"
      >
        {/* Sticky Top Header with Back Navigation */}
        <SheetHeader className="p-6 border-b border-border bg-card/80 sticky top-0 z-20 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={closeOrderJourney}
              className="h-8 gap-1.5 px-2.5 text-xs font-medium text-foreground hover:bg-muted bg-background cursor-pointer shadow-2xs font-sans"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{skuParam ? `Back to SKU (${skuParam})` : "Back"}</span>
            </Button>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <StatusBadge status={statusSummary.status} />
              {activeJourney.hasReturn && (
                <Badge
                  variant="destructive"
                  className="text-[11px] font-medium leading-none px-2 py-0.5 gap-1 bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                >
                  <RotateCcw className="h-3 w-3" />
                  Contains Return
                </Badge>
              )}
              {uploadedReportsState.bothActive && (
                <Badge
                  variant="secondary"
                  className="text-[11px] font-medium leading-none px-2 py-0.5 gap-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25"
                >
                  <Sparkles className="h-3 w-3 text-indigo-500" />
                  Unified Cross-Report Match
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pr-8">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.01em] font-sans">
              Complete Order Journey
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              <SheetTitle className="text-xl font-bold tracking-[-0.025em] font-mono text-foreground break-all select-all">
                {activeJourney.orderId}
              </SheetTitle>
              <CopyButton
                text={activeJourney.orderId}
                variant="outline"
                size="sm"
                className="h-7 text-xs font-medium gap-1.5 px-2.5 cursor-pointer bg-background"
              >
                Copy Order ID
              </CopyButton>
            </div>

            <SheetDescription className="text-xs font-normal text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>Order Date: {formatDate(activeJourney.orderDate)}</span>
              <span>•</span>
              <span>{activeJourney.itemsCount} Order Item(s)</span>
              <span>•</span>
              <span className="font-mono font-medium text-foreground tabular-nums">
                Net Earnings: {formatINR(activeJourney.totalNetEarnings)}
              </span>
            </SheetDescription>
          </div>
        </SheetHeader>

        {/* Scrollable Body Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* 1. Overall Order Summary Card */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h2 className="text-xs font-bold text-foreground uppercase tracking-wider font-sans flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  Order Summary
                </h2>
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  Order ID: {activeJourney.orderId}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Items</span>
                  <p className="text-base font-bold font-mono text-foreground">{activeJourney.itemsCount}</p>
                  <p className="text-[10px] text-muted-foreground leading-none">
                    {[
                      statusSummary.deliveredCount > 0 && `${statusSummary.deliveredCount} Del`,
                      statusSummary.returnedCount > 0 && `${statusSummary.returnedCount} Ret`,
                      statusSummary.cancelledCount > 0 && `${statusSummary.cancelledCount} Canc`,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Selling Price</span>
                  <p className="text-base font-bold font-mono text-foreground">
                    {formatINR(activeJourney.totalSellingPrice)}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-none">Total customer billing</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Net Earnings</span>
                  <p
                    className={`text-base font-bold font-mono ${
                      activeJourney.totalNetEarnings >= 0 ? "text-foreground" : "text-destructive"
                    }`}
                  >
                    {formatINR(activeJourney.totalNetEarnings)}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-none">After all fees & taxes</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Payout Status</span>
                  <p className="text-base font-bold font-mono text-foreground">
                    {formatINR(activeJourney.totalAmountSettled)}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-none">
                    Pending: {formatINR(activeJourney.totalAmountPending)}
                  </p>
                </div>
              </div>
            </div>

            {/* Diagnostics Alerts */}
            {activeJourney.diagnostics && activeJourney.diagnostics.length > 0 && (
              <div className="space-y-2">
                {activeJourney.diagnostics.map((diag, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-foreground flex items-start gap-2.5"
                  >
                    <AlertOctagon className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">{diag.title}</strong>
                      <p className="text-muted-foreground mt-0.5">{diag.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. Item Journeys Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-sans">
                  Item Journeys
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  ({activeJourney.items.length} unique items)
                </span>
              </div>

              <div className="space-y-6">
                {activeJourney.items.map((item, idx) => {
                  const {
                    financials,
                    transactions,
                    timeline,
                    skuPerformance,
                    returnRecord,
                    orderPnlRecord,
                    relationship,
                  } = item;

                  const isItemProf = financials.netEarnings >= 0;

                  return (
                    <div
                      key={item.orderItemId}
                      className="rounded-2xl border border-border bg-card p-5 space-y-6 shadow-sm"
                    >
                      {/* Item Sub-header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-mono font-bold text-foreground">
                              Item #{idx + 1}
                            </span>
                            <span className="font-mono font-bold text-sm text-foreground break-all">
                              {item.orderItemId}
                            </span>
                            <CopyButton
                              text={item.orderItemId}
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-muted-foreground hover:text-foreground shrink-0"
                            />
                          </div>
                          {item.sku && (
                            <p className="text-xs text-muted-foreground font-mono mt-1">
                              SKU: <strong className="text-foreground">{item.sku}</strong>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <StatusBadge status={item.orderStatus} className="text-xs" />
                          {item.hasReturn && (
                            <Badge
                              variant="destructive"
                              className="text-[10px] px-1.5 py-0 h-4 bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                            >
                              Returned
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Visual Item Timeline */}
                      <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-4 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-border pb-2.5">
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-sans flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>Item Lifecycle Timeline</span>
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Events: {timeline.length}
                          </span>
                        </div>

                        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                          {timeline.map((evt, eIdx) => {
                            const isCancel = evt.status === "cancelled";
                            const isReturn = evt.stage.startsWith("RETURN");
                            const isDelivered =
                              evt.stage.includes("DELIVERY") || evt.stage.includes("DELIVERED");

                            return (
                              <div key={eIdx} className="relative group">
                                <div
                                  className={`absolute -left-4.75 top-1 h-3 w-3 rounded-full border-2 border-background ${
                                    isCancel
                                      ? "bg-destructive ring-2 ring-destructive/20"
                                      : isReturn
                                      ? "bg-rose-500 ring-2 ring-rose-500/20"
                                      : isDelivered
                                      ? "bg-emerald-500 ring-2 ring-emerald-500/20"
                                      : "bg-primary ring-2 ring-primary/20"
                                  }`}
                                />

                                <div className="space-y-1">
                                  <div className="flex items-baseline justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-semibold text-foreground font-sans">
                                        {evt.title}
                                      </span>
                                      {evt.badgeText && (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] px-1 py-0 h-4 font-normal"
                                        >
                                          {evt.badgeText}
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                                      {formatDate(evt.date)}
                                    </span>
                                  </div>

                                  {evt.subtitle && (
                                    <p className="text-xs text-muted-foreground font-normal">
                                      {evt.subtitle}
                                    </p>
                                  )}
                                  {evt.description && (
                                    <p className="text-[11px] text-muted-foreground/80 italic font-normal">
                                      {evt.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {!item.hasReturn && (
                            <div className="relative pt-1">
                              <div className="absolute -left-4.75 top-2 h-3 w-3 rounded-full border-2 border-background bg-muted-foreground/40" />
                              <span className="text-xs text-muted-foreground italic leading-relaxed block">
                                {orderPnlRecord &&
                                (orderPnlRecord.returnedCancelledUnits > 0 ||
                                  orderPnlRecord.rvpUnits > 0)
                                  ? "P&L indicates return/cancellation, but detailed reverse tracking record was not found in the uploaded Returns report."
                                  : "No customer return or courier return associated with this item."}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Product Details & SKU context */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3 shadow-2xs">
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2.5 font-sans flex items-center gap-1.5">
                            <Package className="h-4 w-4 text-primary" />
                            <span>Item Information</span>
                          </h4>
                          <dl className="space-y-2 text-xs">
                            {returnRecord?.product && (
                              <div className="flex justify-between items-start gap-2">
                                <dt className="text-muted-foreground font-medium shrink-0">Product Title:</dt>
                                <dd className="font-semibold text-foreground text-right text-[11px] truncate max-w-[220px]">
                                  {returnRecord.product}
                                </dd>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <dt className="text-muted-foreground font-medium">Quantity:</dt>
                              <dd className="font-mono text-foreground font-semibold tabular-nums">
                                {item.grossUnits} unit(s)
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-muted-foreground font-medium">Fulfillment Type:</dt>
                              <dd className="font-medium text-foreground">
                                {item.fulfillmentType || "Standard"}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-muted-foreground font-medium">Payment Mode:</dt>
                              <dd className="font-medium text-foreground">
                                {item.modeOfPayment || "Prepaid"}
                              </dd>
                            </div>
                            {relationship && relationship.matched && (
                              <div className="flex justify-between">
                                <dt className="text-muted-foreground font-medium">Matching Confidence:</dt>
                                <dd className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                  {(relationship.confidence * 100).toFixed(0)}% ({relationship.source})
                                </dd>
                              </div>
                            )}
                          </dl>
                        </div>

                        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3 shadow-2xs">
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-indigo-500/10 pb-2.5 font-sans flex items-center gap-1.5">
                            <Layers className="h-4 w-4 text-indigo-500" />
                            <span>SKU Performance Context</span>
                          </h4>
                          {skuPerformance ? (
                            <dl className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <dt className="text-muted-foreground font-medium">SKU Gross Units:</dt>
                                <dd className="font-mono text-foreground font-semibold tabular-nums">
                                  {skuPerformance.grossUnits}
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-muted-foreground font-medium">SKU Return Rate:</dt>
                                <dd className="font-mono text-rose-600 dark:text-rose-400 font-semibold">
                                  {skuPerformance.returnRate}% ({skuPerformance.returnedCancelledUnits} units)
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-muted-foreground font-medium">SKU Avg. EPU:</dt>
                                <dd className="font-mono text-foreground font-bold tabular-nums">
                                  ₹{skuPerformance.earningsPerUnit}
                                </dd>
                              </div>
                            </dl>
                          ) : (
                            <p className="text-xs text-muted-foreground italic py-3 text-center">
                              SKU portfolio summary not available.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Item Financial Breakdown */}
                      <FinancialBreakdownView financials={financials} />

                      {/* Item NEFT Transactions */}
                      {transactions.length > 0 && (
                        <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3 shadow-2xs">
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2.5 font-sans flex items-center gap-1.5">
                            <CreditCard className="h-4 w-4 text-primary" />
                            <span>Settlement Payouts ({transactions.length})</span>
                          </h4>
                          <div className="overflow-x-auto rounded-lg border border-border bg-background">
                            <table className="w-full text-xs">
                              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                                <tr>
                                  <th className="py-2 px-3 text-left">Txn #</th>
                                  <th className="py-2 px-3 text-right">Amount</th>
                                  <th className="py-2 px-3 text-left">Reason</th>
                                  <th className="py-2 px-3 text-center">Status</th>
                                  <th className="py-2 px-3 text-left">NEFT Ref</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/60">
                                {transactions.map((tx) => (
                                  <tr key={tx.transactionIndex} className="hover:bg-muted/30">
                                    <td className="py-2 px-3 font-mono font-bold">#{tx.transactionIndex}</td>
                                    <td className="py-2 px-3 font-mono font-bold text-right text-foreground">
                                      {formatINR(tx.transactionAmount)}
                                    </td>
                                    <td className="py-2 px-3 text-muted-foreground">{tx.reason}</td>
                                    <td className="py-2 px-3 text-center">
                                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-normal">
                                        {tx.currentStatus}
                                      </Badge>
                                    </td>
                                    <td className="py-2 px-3 font-mono text-muted-foreground truncate max-w-[140px]">
                                      {tx.neftId || "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Returns Report Card */}
                      {returnRecord && (
                        <div className="rounded-xl border border-border bg-card p-4 space-y-3.5 shadow-2xs">
                          <div className="flex items-center justify-between border-b border-border pb-2.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider font-sans">
                              <RotateCcw className="h-4 w-4 text-rose-500" />
                              <span>Reverse Logistics Information</span>
                            </div>
                            <span className="font-mono text-xs text-muted-foreground">
                              Return ID: {returnRecord.returnId}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                            <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 space-y-1">
                              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase">Reason</span>
                              <p className="text-xs font-semibold text-foreground">{returnRecord.returnReason || "Customer Return"}</p>
                              {returnRecord.returnSubReason && (
                                <p className="text-[10px] text-muted-foreground">{returnRecord.returnSubReason}</p>
                              )}
                            </div>

                            <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5 space-y-1 text-xs">
                              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">Reverse Tracking</span>
                              <p className="font-mono font-semibold text-foreground truncate">{returnRecord.trackingId || "—"}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">Status: {returnRecord.returnStatus}</p>
                            </div>

                            <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-1">
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">Condition</span>
                              <p className="text-xs font-semibold text-foreground">{returnRecord.finalCondition || "Standard Inspection"}</p>
                              <p className="text-[10px] text-muted-foreground">Status: {returnRecord.completionStatus}</p>
                            </div>
                          </div>

                          {returnRecord.comments && (
                            <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Customer / Hub Comment</span>
                              <p className="italic text-foreground/90 font-medium">"{returnRecord.comments}"</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
