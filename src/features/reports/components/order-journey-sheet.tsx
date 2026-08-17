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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
  Sparkles,
  CreditCard,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { useExcelData } from "@/context/excel-context";
import { OrderJourney, OrderJourneyItem, JourneyTimelineEvent } from "../models/journey.models";
import { FinancialBreakdownView } from "./financial-breakdown";
import { formatINR } from "../excel/value-parser";
import { formatDate } from "../excel/date-parser";

export function OrderJourneySheet() {
  const { activeJourney, closeOrderJourney, uploadedReportsState } = useExcelData();
  const [selectedItemIdx, setSelectedItemIdx] = useState<number>(0);

  if (!activeJourney) return null;

  const currentItem: OrderJourneyItem = activeJourney.items[selectedItemIdx] || activeJourney.items[0];
  const { financials, transactions, timeline, skuPerformance, returnRecord, orderPnlRecord, relationship } = currentItem;

  return (
    <Sheet open={Boolean(activeJourney)} onOpenChange={(open) => !open && closeOrderJourney()}>
      <SheetContent
        side="right"
        className="w-full sm:min-w-3xl lg:min-w-4xl xl:min-w-5xl overflow-y-auto p-0 flex flex-col bg-background text-foreground border-l border-border shadow-2xl gap-0"
      >
        {/* Sticky Top Header */}
        <SheetHeader className="p-6 border-b border-border bg-card/80 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex flex-col gap-3 pr-8">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Complete Order Journey
              </span>
              <StatusBadge status={currentItem.orderStatus} />
              {currentItem.hasReturn && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 gap-1">
                  <RotateCcw className="h-3 w-3" />
                  {returnRecord?.returnType === "courier_return" ? "Courier Return (RTO)" : "Customer Return (RVP)"}
                </Badge>
              )}
              {uploadedReportsState.bothActive && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 gap-1">
                  <Sparkles className="h-3 w-3" />
                  Unified Cross-Report Match
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <SheetTitle className="text-xl font-bold tracking-tight font-mono text-foreground break-all select-all">
                {activeJourney.orderId}
              </SheetTitle>
              <CopyButton
                text={activeJourney.orderId}
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 px-2.5 cursor-pointer"
              >
                Copy Order ID
              </CopyButton>
            </div>

            <SheetDescription className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>Order Date: {formatDate(activeJourney.orderDate)}</span>
              <span>•</span>
              <span>{activeJourney.itemsCount} Order Item(s)</span>
              <span>•</span>
              <span className="font-mono font-medium text-foreground">
                Net Earnings: {formatINR(activeJourney.totalNetEarnings)}
              </span>
            </SheetDescription>
          </div>

          {/* Multi-Item Selector Tabs (if order has >1 items) */}
          {activeJourney.items.length > 1 && (
            <div className="flex items-center gap-2 pt-3 border-t border-border mt-3 overflow-x-auto">
              <span className="text-xs text-muted-foreground font-medium shrink-0">Order Items:</span>
              {activeJourney.items.map((item, idx) => (
                <Button
                  key={item.orderItemId}
                  variant={selectedItemIdx === idx ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedItemIdx(idx)}
                  className="h-7 text-xs gap-1.5 font-mono cursor-pointer shrink-0"
                >
                  Item {idx + 1}: {item.orderItemId}
                  {item.hasReturn && <RotateCcw className="h-3 w-3" />}
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
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> P&L Report
                    </span>
                  ) : (
                    <span className="text-amber-500 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> P&L Not Uploaded
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Reverse Logistics:</span>
                  {currentItem.hasReturn ? (
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Returns Report (Matched by {relationship?.source === "order_item_id" ? "Order Item ID" : "Order ID"})
                    </span>
                  ) : uploadedReportsState.returnsActive ? (
                    <span className="text-muted-foreground italic">
                      No matching return record in Returns report
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> Returns Report Not Uploaded
                    </span>
                  )}
                </div>
              </div>

              {skuPerformance && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  SKU Context Attached
                </Badge>
              )}
            </div>

            {/* 2. Visual Order Lifecycle Timeline */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                  <Clock className="h-4 w-4" />
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

                  return (
                    <div key={idx} className="relative group">
                      <div
                        className={`absolute -left-4.75 top-1 h-3 w-3 rounded-full border-2 border-background ${
                          isCancel
                            ? "bg-destructive ring-2 ring-destructive/20"
                            : isReturn
                            ? "bg-foreground ring-2 ring-foreground/20"
                            : "bg-primary ring-2 ring-primary/20"
                        }`}
                      />

                      <div className="space-y-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground">{evt.title}</span>
                            {evt.badgeText && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                                {evt.badgeText}
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {formatDate(evt.date)}
                          </span>
                        </div>

                        {evt.subtitle && (
                          <p className="text-xs text-muted-foreground">{evt.subtitle}</p>
                        )}
                        {evt.description && (
                          <p className="text-[11px] text-muted-foreground/80 italic">{evt.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {!currentItem.hasReturn && (
                  <div className="relative pt-1">
                    <div className="absolute -left-4.75 top-2 h-3 w-3 rounded-full border-2 border-background bg-muted-foreground/40" />
                    <span className="text-xs text-muted-foreground italic">
                      {orderPnlRecord && (orderPnlRecord.returnedCancelledUnits > 0 || orderPnlRecord.rvpUnits > 0)
                        ? "P&L indicates return/cancellation, but detailed tracking events were not found in the uploaded Returns report."
                        : "No customer return or courier return associated with this item."}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Product Details & SKU Performance Context */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Identity */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2.5">
                  <Package className="h-4 w-4" />
                  <span>Product & Order Item Details</span>
                </div>
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <dt className="text-muted-foreground">Product SKU:</dt>
                    <dd className="font-mono font-bold text-foreground flex items-center gap-1">
                      <span>{currentItem.sku || "—"}</span>
                      {currentItem.sku && (
                        <CopyButton text={currentItem.sku} variant="ghost" size="icon" className="h-5 w-5" />
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-muted-foreground">Order Item ID:</dt>
                    <dd className="font-mono text-foreground flex items-center gap-1">
                      <span>{currentItem.orderItemId}</span>
                      <CopyButton text={currentItem.orderItemId} variant="ghost" size="icon" className="h-5 w-5" />
                    </dd>
                  </div>
                  {returnRecord?.product && (
                    <div className="flex justify-between items-start gap-2">
                      <dt className="text-muted-foreground shrink-0">Product Title:</dt>
                      <dd className="font-medium text-foreground text-right text-[11px] truncate max-w-[240px]">
                        {returnRecord.product}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Quantity:</dt>
                    <dd className="font-medium text-foreground">{currentItem.grossUnits} unit(s)</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Fulfillment Type:</dt>
                    <dd className="font-medium text-foreground">{currentItem.fulfillmentType || "Standard"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Payment Mode:</dt>
                    <dd className="font-medium text-foreground">{currentItem.modeOfPayment || "Prepaid"}</dd>
                  </div>
                </dl>
              </div>

              {/* SKU Portfolio Financial Context */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                    <Layers className="h-4 w-4" />
                    <span>SKU Performance Context</span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs max-w-xs">
                      SKU-level and order-level P&L may differ because Flipkart includes certain SKU-level expenses/benefits (storage, recall, non-order SPF) not allocated to individual orders.
                    </TooltipContent>
                  </Tooltip>
                </div>

                {skuPerformance ? (
                  <dl className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Overall Gross Units:</dt>
                      <dd className="font-mono text-foreground">{skuPerformance.grossUnits}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Ret + Canc Units:</dt>
                      <dd className="font-mono text-foreground">
                        {skuPerformance.returnedCancelledUnits} ({skuPerformance.returnRate}%)
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Portfolio Net Sales:</dt>
                      <dd className="font-mono text-foreground">{formatINR(skuPerformance.sales)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Portfolio Net Earnings:</dt>
                      <dd className="font-mono font-bold text-foreground">{formatINR(skuPerformance.earnings)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Avg. EPU (Earnings / Unit):</dt>
                      <dd className="font-mono text-foreground">₹{skuPerformance.earningsPerUnit}</dd>
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
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2.5">
                  <CreditCard className="h-4 w-4" />
                  <span>Settlement Transactions History ({transactions.length})</span>
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
                        <tr key={tx.transactionIndex} className="hover:bg-muted/30">
                          <td className="py-2 px-3 font-mono font-bold">#{tx.transactionIndex}</td>
                          <td className="py-2 px-3 font-mono font-bold text-right text-foreground">
                            {formatINR(tx.transactionAmount)}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">{tx.reason}</td>
                          <td className="py-2 px-3 text-center">
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                              {tx.currentStatus}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 font-mono text-muted-foreground">
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

            {/* 6. Return Lifecycle & Verbatim Comments */}
            {returnRecord ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-destructive/20 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                    <RotateCcw className="h-4 w-4 text-destructive" />
                    <span>Flipkart Returns Report Details</span>
                  </div>
                  <Badge variant="destructive" className="text-[10px]">
                    Return ID: {returnRecord.returnId}
                  </Badge>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Return Reason:</dt>
                    <dd className="font-semibold text-foreground">{returnRecord.returnReason || "Customer Return"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Return Sub-reason:</dt>
                    <dd className="font-medium text-foreground">{returnRecord.returnSubReason || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Return Status:</dt>
                    <dd><StatusBadge status={returnRecord.returnStatus || "Completed"} /></dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Tracking ID:</dt>
                    <dd className="font-mono text-foreground">{returnRecord.trackingId || "—"}</dd>
                  </div>

                  {/* Operational Customer / Inspection Comments strictly preserved */}
                  <div className="sm:col-span-2 p-3 rounded-lg bg-background border border-border space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5 text-primary" />
                      <span>Customer / Hub Comments:</span>
                    </div>
                    <dd className="text-xs text-foreground font-normal whitespace-pre-wrap leading-relaxed">
                      {returnRecord.comments ? returnRecord.comments : "—"}
                    </dd>
                  </div>

                  {returnRecord.finalCondition && (
                    <div>
                      <dt className="text-muted-foreground">Returned Product Condition:</dt>
                      <dd className="font-medium text-foreground">{returnRecord.finalCondition}</dd>
                    </div>
                  )}
                  {returnRecord.vendorName && (
                    <div>
                      <dt className="text-muted-foreground">Vendor / Warehouse:</dt>
                      <dd className="font-medium text-foreground">{returnRecord.vendorName} ({returnRecord.locationName})</dd>
                    </div>
                  )}
                </dl>
              </div>
            ) : (
              !uploadedReportsState.returnsActive && (
                <div className="rounded-xl border border-dashed border-border bg-muted/10 p-4 text-xs text-muted-foreground flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span>Detailed return lifecycle not connected. Upload a Flipkart Returns report to view full reverse logistics.</span>
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
