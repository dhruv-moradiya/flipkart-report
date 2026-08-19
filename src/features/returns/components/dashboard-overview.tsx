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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Total Returns & Orders */}
        <Card className="border-border bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Returns
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                  {overview.totalReturns.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">units</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {overview.uniqueOrders} orders • {overview.uniqueSkus} SKUs
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* 2. Total Return Value */}
        <Card className="border-border bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
              <IndianRupee className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* 3. Customer Returns vs Courier Returns */}
        <Card className="border-border bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Courier (RTO) vs Customer (RVP)
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-foreground font-mono">
                  {returnType.courierReturns} <span className="text-xs font-normal text-muted-foreground">RTO</span>
                </span>
                <span className="text-xs text-muted-foreground">/</span>
                <span className="text-lg font-bold text-foreground font-mono">
                  {returnType.customerReturns} <span className="text-xs font-normal text-muted-foreground">RVP</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5">
                  {returnType.total > 0 ? ((returnType.courierReturns / returnType.total) * 100).toFixed(0) : 0}% Courier
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5">
                  {returnType.total > 0 ? ((returnType.customerReturns / returnType.total) * 100).toFixed(0) : 0}% Customer
                </Badge>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
              <Truck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* 4. Status & In Transit */}
        <Card className="border-border bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Status & In Transit
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-foreground font-mono">
                  {status.inTransit} <span className="text-xs font-normal text-muted-foreground">In Transit</span>
                </span>
                <span className="text-xs text-muted-foreground">/</span>
                <span className="text-lg font-bold text-foreground font-mono">
                  {status.start} <span className="text-xs font-normal text-muted-foreground">Started</span>
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                {completion.openReturns} Open Returns Ongoing
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 shrink-0">
              <RotateCcw className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Context & Metadata Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/60 px-4 py-2.5 text-xs text-muted-foreground shadow-2xs">
        <div className="flex items-center gap-4 flex-wrap">
          {location.primaryLocation && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Location:</span>
              <strong className="text-foreground">{location.primaryLocation.locationName}</strong>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>Fulfillment:</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono">
              {logistics.fulfillmentType}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Shipment Type:</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono">
              {logistics.shipmentType}
            </Badge>
          </div>
          {comments.hasData && (
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Customer Comments:</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono font-medium">
                {comments.returnsWithComments} recorded
              </Badge>
            </div>
          )}
        </div>

        <div className="text-[11px] font-mono text-muted-foreground hidden sm:block">
          Official 43-Column Flipkart Reverse Tracking
        </div>
      </div>
    </div>
  );
}
