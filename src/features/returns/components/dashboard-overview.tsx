"use client";

import React from "react";
import {
  Package,
  IndianRupee,
  Truck,
  RotateCcw,
  Clock,
  MapPin,
  Layers,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReturnAnalytics } from "../types/analytics.types";

interface DashboardOverviewProps {
  analytics: ReturnAnalytics;
}

export function DashboardOverview({ analytics }: DashboardOverviewProps) {
  const { overview, returnType, status, completion, logistics, location, comments } = analytics;

  const formattedReturnValue = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(overview.totalReturnValue);

  return (
    <div className="space-y-4">
      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Returns & Orders */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Total Returns
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {overview.totalReturns.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">records</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {overview.uniqueOrders} unique orders • {overview.uniqueSkus} SKUs
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground border border-border shrink-0">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Total Return Value */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Returned Order Value
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                  {formattedReturnValue}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Avg. ₹{Math.round(overview.averageReturnValue)} per return
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground border border-border shrink-0">
              <IndianRupee className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Customer Returns vs Courier Returns */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Courier vs Customer Returns
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-foreground">
                  {returnType.courierReturns} <span className="text-xs font-normal text-muted-foreground">Courier</span>
                </span>
                <span className="text-xs text-muted-foreground">/</span>
                <span className="text-lg font-bold text-foreground">
                  {returnType.customerReturns} <span className="text-xs font-normal text-muted-foreground">Cust.</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                  {returnType.total > 0 ? ((returnType.courierReturns / returnType.total) * 100).toFixed(0) : 0}% Courier
                </Badge>
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                  {returnType.total > 0 ? ((returnType.customerReturns / returnType.total) * 100).toFixed(0) : 0}% Customer
                </Badge>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground border border-border shrink-0">
              <Truck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Status & Completion */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Status & Completion
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-foreground">
                  {status.inTransit} <span className="text-xs font-normal text-muted-foreground">In Transit</span>
                </span>
                <span className="text-xs text-muted-foreground">/</span>
                <span className="text-lg font-bold text-foreground">
                  {status.start} <span className="text-xs font-normal text-muted-foreground">Start</span>
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {completion.openReturns} Open Returns
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground border border-border shrink-0">
              <RotateCcw className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Context & Metadata Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3.5 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-4 flex-wrap">
          {location.primaryLocation && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-foreground" />
              <span>Location:</span>
              <strong className="text-foreground">{location.primaryLocation.locationName}</strong>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-foreground" />
            <span>Fulfillment:</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              {logistics.fulfillmentType}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Shipment Type:</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              {logistics.shipmentType}
            </Badge>
          </div>
          {comments.hasData && (
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-foreground" />
              <span>Comments:</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {comments.returnsWithComments} with comments
              </Badge>
            </div>
          )}
        </div>

        <div className="text-[11px]">
          Showing calculated analytics from exact 43-column Flipkart specification
        </div>
      </div>
    </div>
  );
}
