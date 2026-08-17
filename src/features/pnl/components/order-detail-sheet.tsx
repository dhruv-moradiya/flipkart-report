"use client";

import React from "react";
import {
  ShoppingBag,
  Package,
  IndianRupee,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CopyButton } from "@/components/copy-button";
import { StatusBadge } from "@/components/excel/status-badge";
import { OrderPnlRecord } from "../types/pnl.types";

interface OrderDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderPnlRecord | null;
}

function formatINR(val: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

function FieldItem({
  label,
  value,
  isCopyable = false,
  isStatus = false,
  isPrice = false,
}: {
  label: string;
  value: string | number | null | undefined;
  isCopyable?: boolean;
  isStatus?: boolean;
  isPrice?: boolean;
}) {
  let displayStr = "";
  if (value === null || value === undefined || value === "") {
    displayStr = "Not available";
  } else if (isPrice && typeof value === "number") {
    displayStr = formatINR(value);
  } else {
    displayStr = String(value);
  }

  const isBlank = displayStr === "Not available";

  return (
    <div className="space-y-1 p-2.5 rounded-md bg-muted/20 border border-border/60 hover:bg-muted/40 transition-colors">
      <dt className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </dt>
      <dd className="flex items-center justify-between gap-2 text-xs text-foreground font-medium break-all">
        {isStatus && !isBlank ? (
          <StatusBadge status={displayStr} />
        ) : (
          <span className={`${isCopyable && !isBlank ? "font-mono select-all" : ""} ${isBlank ? "text-muted-foreground/60 font-normal italic" : ""}`}>
            {displayStr}
          </span>
        )}
        {isCopyable && !isBlank && (
          <CopyButton
            text={displayStr}
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
          />
        )}
      </dd>
    </div>
  );
}

export function OrderDetailSheet({ isOpen, onClose, order }: OrderDetailSheetProps) {
  if (!order) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:min-w-2xl lg:min-w-3xl overflow-y-auto p-0 flex flex-col bg-background text-foreground border-l border-border shadow-2xl"
      >
        {/* Header */}
        <SheetHeader className="p-6 border-b border-border bg-card/60 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex flex-col gap-1.5 pr-8">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Orders P&L Record Details
              </span>
              <StatusBadge status={order.orderStatus} />
            </div>
            <div className="flex items-center gap-2">
              <SheetTitle className="text-lg font-bold tracking-tight font-mono text-foreground break-all select-all">
                {order.orderId}
              </SheetTitle>
              <CopyButton
                text={order.orderId}
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 px-2.5 cursor-pointer"
              >
                Copy Order ID
              </CopyButton>
            </div>
            <SheetDescription className="text-xs text-muted-foreground">
              Order Item ID: {order.orderItemId}
            </SheetDescription>
          </div>
        </SheetHeader>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-5 max-w-4xl mx-auto">
            {/* 1. Order Identifiers */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2.5">
                <ShoppingBag className="h-4 w-4" />
                <span>Order Identifiers</span>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldItem label="Order ID" value={order.orderId} isCopyable />
                <FieldItem label="Order Item ID" value={order.orderItemId} isCopyable />
                <FieldItem label="Order Status" value={order.orderStatus} isStatus />
                <FieldItem label="Product SKU" value={order.sku} isCopyable />
              </dl>
            </div>

            {/* 2. Units & Quantities */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2.5">
                <Package className="h-4 w-4" />
                <span>Units & Fulfillment</span>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FieldItem label="Gross Units" value={order.grossUnits} />
                <FieldItem label="Returned & Cancelled" value={order.returnedCancelledUnits} />
                <FieldItem label="Net Units" value={order.netUnits} />
              </dl>
            </div>

            {/* 3. Financial Values */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2.5">
                <IndianRupee className="h-4 w-4" />
                <span>Order Economics</span>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldItem label="Final Selling Price" value={order.finalSellingPrice} isPrice />
                <FieldItem label="Order Item Value" value={order.orderItemValue} isPrice />
              </dl>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
