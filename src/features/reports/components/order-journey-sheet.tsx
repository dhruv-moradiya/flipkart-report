"use client";

import React, { useState } from "react";
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
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  Truck,
  MapPin,
  Tag,
  Building,
  Calendar,
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
  const [selectedItemIdx, setSelectedItemIdx] = useState<number>(0);

  if (!activeJourney) return null;

  const skuParam =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("sku")
      : null;

  const currentItem: OrderJourneyItem =
    activeJourney.items[selectedItemIdx] || activeJourney.items[0];
  const {
    financials,
    transactions,
    timeline,
    skuPerformance,
    returnRecord,
    orderPnlRecord,
    relationship,
  } = currentItem;

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
              <StatusBadge status={currentItem.orderStatus} />
              {currentItem.hasReturn && (
                <Badge
                  variant="destructive"
                  className="text-[11px] font-medium leading-none px-2 py-0.5 gap-1 bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                >
                  <RotateCcw className="h-3 w-3" />
                  {returnRecord?.returnType === "courier_return"
                    ? "Courier Return (RTO)"
                    : "Customer Return (RVP)"}
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

          {/* Multi-Item Selector Tabs (if order has >1 items) */}
          {activeJourney.items.length > 1 && (
            <div className="flex items-center gap-2 pt-3 border-t border-border mt-3 overflow-x-auto">
              <span className="text-xs text-muted-foreground font-medium shrink-0">
                Order Items:
              </span>
              {activeJourney.items.map((item, idx) => (
                <Button
                  key={item.orderItemId}
                  variant={selectedItemIdx === idx ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedItemIdx(idx)}
                  className="h-7 text-xs gap-1.5 font-mono cursor-pointer shrink-0"
                >
                  Item {idx + 1}: {item.orderItemId}
                  {item.hasReturn && <RotateCcw className="h-3 w-3 text-rose-500" />}
                </Button>
              ))}
            </div>
          )}
        </SheetHeader>

        {/* Scrollable Body Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* 1. Data Source Transparency Bar */}
            <div className="p-3 rounded-lg bg-muted/20 border border-border flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Financials:</span>
                  {currentItem.hasPnl ? (
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> P&L
                      Report
                    </span>
                  ) : (
                    <span className="text-amber-500 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> P&L Not Uploaded
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">
                    Reverse Logistics:
                  </span>
                  {currentItem.hasReturn ? (
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />{" "}
                      Returns Report (Matched by{" "}
                      {relationship?.source === "order_item_id"
                        ? "Order Item ID"
                        : "Order ID"}
                      )
                    </span>
                  ) : uploadedReportsState.returnsActive ? (
                    <span className="text-muted-foreground italic">
                      No matching return record in Returns report
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> Returns Report Not
                      Uploaded
                    </span>
                  )}
                </div>
              </div>

              {skuPerformance && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10"
                >
                  SKU Context Attached
                </Badge>
              )}
            </div>

            {/* 2. Visual Order Lifecycle Timeline */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider font-sans">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Order & Return Lifecycle Timeline</span>
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Item ID: {currentItem.orderItemId}
                </span>
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {timeline.map((evt, idx) => {
                  const isCancel = evt.status === "cancelled";
                  const isReturn = evt.stage.startsWith("RETURN");
                  const isDelivered = evt.stage.includes("DELIVERY") || evt.stage.includes("DELIVERED");

                  return (
                    <div key={idx} className="relative group">
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

                {!currentItem.hasReturn && (
                  <div className="relative pt-1">
                    <div className="absolute -left-4.75 top-2 h-3 w-3 rounded-full border-2 border-background bg-muted-foreground/40" />
                    <span className="text-xs text-muted-foreground italic">
                      {orderPnlRecord &&
                      (orderPnlRecord.returnedCancelledUnits > 0 ||
                        orderPnlRecord.rvpUnits > 0)
                        ? "P&L indicates return/cancellation, but detailed tracking events were not found in the uploaded Returns report."
                        : "No customer return or courier return associated with this item."}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Product Details & SKU Performance Context */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Identity Card */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2.5 font-sans">
                  <Package className="h-4 w-4 text-primary" />
                  <span>Product & Order Item Details</span>
                </div>
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <dt className="text-muted-foreground font-medium">Product SKU:</dt>
                    <dd className="font-mono font-bold text-foreground flex items-center gap-1">
                      <span>{currentItem.sku || "—"}</span>
                      {currentItem.sku && (
                        <CopyButton
                          text={currentItem.sku}
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-muted-foreground hover:text-foreground"
                        />
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-muted-foreground font-medium">Order Item ID:</dt>
                    <dd className="font-mono text-foreground flex items-center gap-1">
                      <span>{currentItem.orderItemId}</span>
                      <CopyButton
                        text={currentItem.orderItemId}
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-foreground"
                      />
                    </dd>
                  </div>
                  {returnRecord?.product && (
                    <div className="flex justify-between items-start gap-2">
                      <dt className="text-muted-foreground font-medium shrink-0">
                        Product Title:
                      </dt>
                      <dd className="font-medium text-foreground text-right text-[11px] truncate max-w-[240px]">
                        {returnRecord.product}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground font-medium">Quantity:</dt>
                    <dd className="font-semibold text-foreground tabular-nums">
                      {currentItem.grossUnits} unit(s)
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground font-medium">Fulfillment Type:</dt>
                    <dd className="font-medium text-foreground">
                      {currentItem.fulfillmentType || "Standard"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground font-medium">Payment Mode:</dt>
                    <dd className="font-medium text-foreground">
                      {currentItem.modeOfPayment || "Prepaid"}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* SKU Portfolio Financial Context Card */}
              <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/5 dark:bg-indigo-950/20 p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider font-sans">
                    <Layers className="h-4 w-4 text-indigo-500" />
                    <span>SKU Performance Context</span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs max-w-xs">
                      SKU-level and order-level P&L may differ because Flipkart
                      includes certain SKU-level expenses/benefits (storage,
                      recall, non-order SPF) not allocated to individual orders.
                    </TooltipContent>
                  </Tooltip>
                </div>

                {skuPerformance ? (
                  <dl className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground font-medium">
                        Overall Gross Units:
                      </dt>
                      <dd className="font-mono text-foreground font-semibold tabular-nums">
                        {skuPerformance.grossUnits}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground font-medium">
                        Ret + Canc Units:
                      </dt>
                      <dd className="font-mono text-rose-600 dark:text-rose-400 font-semibold tabular-nums">
                        {skuPerformance.returnedCancelledUnits} (
                        {skuPerformance.returnRate}%)
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground font-medium">
                        Portfolio Net Sales:
                      </dt>
                      <dd className="font-mono text-foreground font-bold tabular-nums">
                        {formatINR(skuPerformance.sales)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground font-medium">
                        Portfolio Net Earnings:
                      </dt>
                      <dd className="font-mono font-bold text-foreground tabular-nums">
                        {formatINR(skuPerformance.earnings)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground font-medium">
                        Avg. EPU (Earnings / Unit):
                      </dt>
                      <dd className="font-mono text-foreground font-semibold tabular-nums">
                        ₹{skuPerformance.earningsPerUnit}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-3 text-center">
                    SKU summary not available in current P&L sheet.
                  </p>
                )}
              </div>
            </div>

            {/* 4. Detailed Financial Journey (P&L Waterfall with Negative Fees) */}
            <FinancialBreakdownView financials={financials} />

            {/* 5. Settlement History & Transactions */}
            {transactions.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2.5 font-sans">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span>
                    Settlement Transactions History ({transactions.length})
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/60 border-b border-border text-muted-foreground font-semibold">
                      <tr>
                        <th className="py-2 px-3 text-left">Txn #</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                        <th className="py-2 px-3 text-left">Reason</th>
                        <th className="py-2 px-3 text-center">Status</th>
                        <th className="py-2 px-3 text-left">Payment Date</th>
                        <th className="py-2 px-3 text-left">NEFT Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {transactions.map((tx) => (
                        <tr
                          key={tx.transactionIndex}
                          className="hover:bg-muted/30"
                        >
                          <td className="py-2 px-3 font-mono font-bold">
                            #{tx.transactionIndex}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-right text-foreground tabular-nums">
                            {formatINR(tx.transactionAmount)}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground font-normal">
                            {tx.reason}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1 py-0 h-4 font-normal"
                            >
                              {tx.currentStatus}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 font-mono text-muted-foreground tabular-nums">
                            {formatDate(tx.paymentDate)}
                          </td>
                          <td className="py-2 px-3 font-mono text-muted-foreground truncate max-w-[150px]">
                            {tx.neftId || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. Multi-Colored Differentiated Flipkart Return Record Details */}
            {returnRecord ? (
              <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
                {/* Main Header with Return ID & Type */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
                      <RotateCcw className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground uppercase tracking-wider block font-sans">
                        Flipkart Returns Report Details
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      Return ID: <strong className="text-foreground">{returnRecord.returnId}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[11px] font-medium leading-none px-2.5 py-1 border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10 font-sans"
                    >
                      {returnRecord.returnType === "courier_return"
                        ? "Courier Return (RTO)"
                        : "Customer Return (RVP)"}
                    </Badge>
                  </div>
                </div>

                {/* Color-Differentiated Sub-Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* Sub-Card 1: Return Cause & Classification (Rose Theme) */}
                  <div className="p-3.5 rounded-xl border border-rose-500/25 bg-rose-500/5 dark:bg-rose-950/20 space-y-2.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 font-sans">
                      <AlertOctagon className="h-3.5 w-3.5 text-rose-500" />
                      <span>Return Reason & Root Cause</span>
                    </div>
                    <div className="space-y-1.5">
                      <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/15 text-rose-800 dark:text-rose-200 border border-rose-500/30 font-sans">
                        {returnRecord.returnReason || "Customer Return"}
                      </span>
                      {returnRecord.returnSubReason && (
                        <div className="pt-1 text-xs">
                          <span className="text-muted-foreground text-[11px] block font-medium">Sub-Reason:</span>
                          <span className="font-medium text-foreground">{returnRecord.returnSubReason}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sub-Card 2: Reverse Logistics & Tracking (Blue Theme) */}
                  <div className="p-3.5 rounded-xl border border-blue-500/25 bg-blue-500/5 dark:bg-blue-950/20 space-y-2.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 font-sans">
                      <Truck className="h-3.5 w-3.5 text-blue-500" />
                      <span>Reverse Logistics & Tracking</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-muted-foreground text-[11px] block font-medium">Tracking ID:</span>
                        <div className="flex items-center justify-between gap-1.5 bg-background/80 px-2 py-1 rounded border border-border mt-0.5">
                          <span className="font-mono text-xs font-semibold text-foreground truncate">
                            {returnRecord.trackingId || "—"}
                          </span>
                          {returnRecord.trackingId && (
                            <CopyButton
                              text={returnRecord.trackingId}
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-muted-foreground hover:text-foreground shrink-0"
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-muted-foreground text-[11px] font-medium">Status:</span>
                        <StatusBadge
                          status={returnRecord.returnStatus || "Completed"}
                          className="text-[10px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sub-Card 3: Inspection Condition & Location (Amber Theme) */}
                  <div className="p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-950/20 space-y-2.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 font-sans">
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                      <span>Inspection & Location</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-muted-foreground text-[11px] block font-medium">Product Condition:</span>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30">
                          {returnRecord.finalCondition || "Standard Inspection"}
                        </span>
                      </div>

                      {returnRecord.vendorName && (
                        <div>
                          <span className="text-muted-foreground text-[11px] block font-medium">Warehouse / Vendor:</span>
                          <span className="font-medium text-foreground text-xs">
                            {returnRecord.vendorName} {returnRecord.locationName ? `(${returnRecord.locationName})` : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sub-Card 4: Customer & Hub Verbatim Feedback (Indigo Theme) */}
                <div className="p-4 rounded-xl border border-indigo-500/25 bg-indigo-500/5 dark:bg-indigo-950/20 space-y-2 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 font-sans">
                    <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Customer & Hub Verbatim Inspection Feedback</span>
                  </div>
                  <div className="p-3 rounded-lg bg-background border border-indigo-500/20 text-xs text-foreground font-normal whitespace-pre-wrap leading-relaxed shadow-2xs">
                    {returnRecord.comments ? (
                      <p className="italic text-foreground/90">"{returnRecord.comments}"</p>
                    ) : (
                      <p className="italic text-muted-foreground">No specific customer or hub verbatim comment recorded in returns sheet.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              !uploadedReportsState.returnsActive && (
                <div className="rounded-xl border border-dashed border-border bg-muted/10 p-4 text-xs text-muted-foreground flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Detailed return lifecycle not connected. Upload a Flipkart
                      Returns report to view full reverse logistics.
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
