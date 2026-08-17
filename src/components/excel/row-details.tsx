"use client";

import React, { useState } from "react";
import {
  RotateCcw,
  Package,
  Truck,
  Calendar,
  ShoppingBag,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { StatusBadge } from "@/components/excel/status-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FlipkartColumnMapping } from "@/lib/flipkart-columns";
import { formatCellValue } from "@/lib/excel-utils";

interface RowDetailsProps {
  row: Record<string, unknown>;
  mapping: FlipkartColumnMapping;
  headers: string[];
}

function DetailItem({
  label,
  value,
  isCopyable = false,
  isStatus = false,
}: {
  label: string;
  value: unknown;
  isCopyable?: boolean;
  isStatus?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const formattedVal = formatCellValue(value);

  if (!formattedVal) {
    return (
      <div className="space-y-0.5">
        <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </dt>
        <dd className="text-xs text-muted-foreground/60">-</dd>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedVal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1">
      <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </dt>
      <dd className="flex items-center gap-1.5 text-xs text-foreground font-medium break-all">
        {isStatus ? (
          <StatusBadge status={formattedVal} />
        ) : (
          <span className={isCopyable ? "font-mono" : ""}>{formattedVal}</span>
        )}
        {isCopyable && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-5 w-5 text-muted-foreground hover:text-foreground shrink-0"
            title="Copy"
          >
            {copied ? (
              <Check className="h-3 w-3 text-foreground" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span className="sr-only">Copy {label}</span>
          </Button>
        )}
      </dd>
    </div>
  );
}

export function RowDetailsContent({ row, mapping, headers }: RowDetailsProps) {
  const [showAllFields, setShowAllFields] = useState(false);

  // Identify fields already shown in the primary sections
  const mappedKeys = Object.values(mapping).filter(Boolean) as string[];
  const remainingHeaders = headers.filter((h) => !mappedKeys.includes(h) && row[h]);

  return (
    <div className="space-y-6 text-foreground">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Section 1: Return Information */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground border-b border-border pb-2">
            <RotateCcw className="h-4 w-4 text-foreground" />
            <span>Return Details</span>
          </div>
          <dl className="grid grid-cols-1 gap-3">
            <DetailItem
              label="Return ID"
              value={mapping.returnId ? row[mapping.returnId] : undefined}
              isCopyable
            />
            <DetailItem
              label="Return Status"
              value={mapping.status ? row[mapping.status] : undefined}
              isStatus
            />
            <DetailItem
              label="Return Type"
              value={mapping.returnType ? row[mapping.returnType] : undefined}
            />
            <DetailItem
              label="Return Reason"
              value={mapping.returnReason ? row[mapping.returnReason] : undefined}
            />
            <DetailItem
              label="Return Sub Reason"
              value={mapping.returnSubReason ? row[mapping.returnSubReason] : undefined}
            />
          </dl>
        </div>

        {/* Section 2: Product Information */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground border-b border-border pb-2">
            <Package className="h-4 w-4 text-foreground" />
            <span>Product Details</span>
          </div>
          <dl className="grid grid-cols-1 gap-3">
            <DetailItem
              label="SKU"
              value={mapping.sku ? row[mapping.sku] : undefined}
              isCopyable
            />
            <DetailItem
              label="FSN"
              value={mapping.fsn ? row[mapping.fsn] : undefined}
              isCopyable
            />
            <DetailItem
              label="Product Title"
              value={mapping.product ? row[mapping.product] : undefined}
            />
            <div className="grid grid-cols-2 gap-2">
              <DetailItem
                label="Quantity"
                value={mapping.quantity ? row[mapping.quantity] : undefined}
              />
              <DetailItem
                label="Price / Value"
                value={mapping.price ? row[mapping.price] : undefined}
              />
            </div>
          </dl>
        </div>

        {/* Section 3: Shipment Information */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground border-b border-border pb-2">
            <Truck className="h-4 w-4 text-foreground" />
            <span>Shipment Details</span>
          </div>
          <dl className="grid grid-cols-1 gap-3">
            <DetailItem
              label="Tracking ID"
              value={mapping.trackingId ? row[mapping.trackingId] : undefined}
              isCopyable
            />
            <DetailItem
              label="Shipment ID"
              value={mapping.shipmentId ? row[mapping.shipmentId] : undefined}
              isCopyable
            />
            <DetailItem
              label="Shipment Type"
              value={mapping.shipmentType ? row[mapping.shipmentType] : undefined}
            />
            <DetailItem
              label="Fulfillment Type"
              value={mapping.ffType ? row[mapping.ffType] : undefined}
            />
            <DetailItem
              label="Logistics Partner"
              value={mapping.logisticsPartner ? row[mapping.logisticsPartner] : undefined}
            />
          </dl>
        </div>

        {/* Section 4: Timeline & Dates */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground border-b border-border pb-2">
            <Calendar className="h-4 w-4 text-foreground" />
            <span>Timeline & Dates</span>
          </div>
          <dl className="grid grid-cols-1 gap-3">
            <DetailItem
              label="Return Requested Date"
              value={mapping.requestedDate ? row[mapping.requestedDate] : undefined}
            />
            <DetailItem
              label="Return Approved Date"
              value={mapping.approvedDate ? row[mapping.approvedDate] : undefined}
            />
            <DetailItem
              label="Picked Up Date"
              value={mapping.pickedUpDate ? row[mapping.pickedUpDate] : undefined}
            />
            <DetailItem
              label="Completed Date"
              value={mapping.completedDate ? row[mapping.completedDate] : undefined}
            />
            <DetailItem
              label="Delivery Promise Date"
              value={mapping.deliveryPromiseDate ? row[mapping.deliveryPromiseDate] : undefined}
            />
          </dl>
        </div>

        {/* Section 5: Order Details */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground border-b border-border pb-2">
            <ShoppingBag className="h-4 w-4 text-foreground" />
            <span>Order Reference</span>
          </div>
          <dl className="grid grid-cols-1 gap-3">
            <DetailItem
              label="Order ID"
              value={mapping.orderId ? row[mapping.orderId] : undefined}
              isCopyable
            />
            <DetailItem
              label="Order Item ID"
              value={mapping.orderItemId ? row[mapping.orderItemId] : undefined}
              isCopyable
            />
            <DetailItem
              label="Replacement Order Item ID"
              value={mapping.replacementOrderId ? row[mapping.replacementOrderId] : undefined}
              isCopyable
            />
            <DetailItem
              label="Vendor"
              value={mapping.vendor ? row[mapping.vendor] : undefined}
            />
            <DetailItem
              label="Location"
              value={mapping.location ? row[mapping.location] : undefined}
            />
          </dl>
        </div>
      </div>

      {/* Section 6: Additional Excel Columns Collapsible */}
      {remainingHeaders.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setShowAllFields(!showAllFields)}
            className="w-full flex items-center justify-between p-3.5 bg-muted/40 hover:bg-muted/70 text-xs font-semibold text-foreground transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-foreground" />
              <span>Additional Sheet Attributes ({remainingHeaders.length} fields)</span>
            </div>
            {showAllFields ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {showAllFields && (
            <div className="p-4 border-t border-border">
              <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {remainingHeaders.map((header) => (
                  <DetailItem
                    key={header}
                    label={header}
                    value={row[header]}
                    isCopyable={header.toLowerCase().includes("id")}
                  />
                ))}
              </dl>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
