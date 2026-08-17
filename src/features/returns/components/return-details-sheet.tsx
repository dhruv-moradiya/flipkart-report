"use client";

import { CopyButton } from "@/components/copy-button";
import { StatusBadge } from "@/components/excel/status-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Building,
  Calendar,
  MessageSquare,
  Package,
  RotateCcw,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { ReturnRecord } from "../types/return.types";
import { formatDate } from "../utils/date";

interface ReturnDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  record: ReturnRecord | null;
}

function FieldItem({
  label,
  value,
  isCopyable = false,
  isStatus = false,
  isDate = false,
  isPrice = false,
}: {
  label: string;
  value: string | number | Date | null | undefined;
  isCopyable?: boolean;
  isStatus?: boolean;
  isDate?: boolean;
  isPrice?: boolean;
}) {
  let displayStr = "";
  if (value === null || value === undefined || value === "") {
    displayStr = "Not available";
  } else if (isDate && value instanceof Date) {
    displayStr = formatDate(value);
  } else if (isPrice && typeof value === "number") {
    displayStr = `₹${value.toLocaleString("en-IN")}`;
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
            className="h-4! w-4! text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
          />
        )}
      </dd>
    </div>
  );
}

export function ReturnDetailsSheet({ isOpen, onClose, record }: ReturnDetailsSheetProps) {
  if (!record) return null;

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
                Flipkart Return Record Details
              </span>
              <StatusBadge status={record.returnStatus} />
            </div>
            <div className="flex items-center gap-2">
              <SheetTitle className="text-lg font-bold tracking-tight font-mono text-foreground break-all select-all">
                {record.returnId}
              </SheetTitle>
              <CopyButton
                text={record.returnId}
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 px-2.5"
              >
                Copy ID
              </CopyButton>
            </div>
            {record.product && (
              <SheetDescription className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {record.product}
              </SheetDescription>
            )}
          </div>
        </SheetHeader>

        {/* Body Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* 1. Comments & Remarks Section (Prominent) */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                  <MessageSquare className="h-4 w-4" />
                  <span>Return Comments & Remarks</span>
                </div>
                {record.comments && (
                  <CopyButton
                    text={record.comments}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5 px-2.5"
                  >
                    Copy Comment
                  </CopyButton>
                )}
              </div>
              {record.comments ? (
                <div className="rounded-lg border border-border/80 bg-muted/40 p-3.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap select-all font-normal">
                  {record.comments}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic py-1">
                  No return comments recorded for this item.
                </p>
              )}
            </div>

            {/* 2. Return Core Details */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2.5">
                <RotateCcw className="h-4 w-4" />
                <span>Return Core Details</span>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <FieldItem label="Return ID" value={record.returnId} isCopyable />
                <FieldItem label="Return Status" value={record.returnStatus} isStatus />
                <FieldItem label="Return Type" value={record.returnType} />
                <FieldItem label="Completion Status" value={record.completionStatus} />
                <FieldItem label="Return Reason" value={record.returnReason} />
                <FieldItem label="Return Sub-Reason" value={record.returnSubReason} />
              </dl>
            </div>

            {/* 3. Product Details */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2.5">
                <Package className="h-4 w-4" />
                <span>Product Information</span>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <FieldItem label="SKU" value={record.sku} isCopyable />
                <FieldItem label="FSN" value={record.fsn} isCopyable />
                <FieldItem label="Quantity" value={record.quantity} />
                <FieldItem label="Total Price" value={record.totalPrice} isPrice />
                <div className="sm:col-span-2 lg:col-span-2">
                  <FieldItem label="Product Title" value={record.product} />
                </div>
              </dl>
            </div>

            {/* 4. Shipment & Logistics */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2.5">
                <Truck className="h-4 w-4" />
                <span>Shipment & Logistics</span>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <FieldItem label="Tracking ID" value={record.trackingId} isCopyable />
                <FieldItem label="Shipment ID" value={record.shipmentId} isCopyable />
                <FieldItem label="Bag Tracking ID" value={record.bagTrackingId} isCopyable />
                <FieldItem label="Shipment Type" value={record.shipmentType} />
                <FieldItem label="Fulfillment Type (FF)" value={record.ffType} />
                <FieldItem label="Vendor Name" value={record.vendorName} />
              </dl>
            </div>

            {/* 5. Timeline & Dates */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2.5">
                <Calendar className="h-4 w-4" />
                <span>Timeline & Critical Dates</span>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <FieldItem label="Return Requested Date" value={record.returnRequestedDate} isDate />
                <FieldItem label="Return Approval Date" value={record.returnApprovalDate} isDate />
                <FieldItem label="Picked Up Date" value={record.pickedUpDate} isDate />
                <FieldItem label="Out For Delivery Date" value={record.outForDeliveryDate} isDate />
                <FieldItem label="Delivery Promise Date" value={record.returnDeliveryPromiseDate} isDate />
                <FieldItem label="Completed Date" value={record.completedDate} isDate />
              </dl>
            </div>

            {/* 6. Order & Invoice Reference */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2.5">
                <ShoppingBag className="h-4 w-4" />
                <span>Order & Invoice Reference</span>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <FieldItem label="Order ID" value={record.orderId} isCopyable />
                <FieldItem label="Order Item ID" value={record.orderItemId} isCopyable />
                <FieldItem label="Replacement Order Item ID" value={record.replacementOrderItemId} isCopyable />
                <FieldItem label="Order Type" value={record.orderType} />
                <FieldItem label="Customer GSTIN" value={record.customerGstin} isCopyable />
                <FieldItem label="Customer Company Name" value={record.customerCompanyName} />
                <FieldItem label="Invoice Number" value={record.invoiceNumber} isCopyable />
                <FieldItem label="Invoice Date" value={record.invoiceDate} isDate />
                <FieldItem label="IRN Number" value={record.irnNumber} isCopyable />
              </dl>
            </div>

            {/* 7. Location & Operational Verification */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2.5">
                <Building className="h-4 w-4" />
                <span>Location & Operational Verification</span>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <FieldItem label="Location ID" value={record.locationId} isCopyable />
                <FieldItem label="Location Name" value={record.locationName} />
                <FieldItem label="Flyer Status" value={record.flyerStatus} />
                <FieldItem label="Flyer Captured" value={record.flyerCaptured} />
                <FieldItem label="Flyer Actual" value={record.flyerActual} />
                <FieldItem label="Delivery Proof Time" value={record.deliveryProofTime} />
                <FieldItem label="Delivery Proof OTC" value={record.deliveryProofOtc} />
                <FieldItem label="OBD Eligible" value={record.obdEligible} />
                <FieldItem label="OBD Status" value={record.obdStatus} />
                <FieldItem label="OBD Remarks" value={record.obdRemarks} />
              </dl>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
