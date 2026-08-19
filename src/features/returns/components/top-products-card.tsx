"use client";

import React, { useState } from "react";
import { Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductAnalytics } from "../types/analytics.types";

interface TopProductsCardProps {
  productAnalytics: ProductAnalytics;
}

export function TopProductsCard({ productAnalytics }: TopProductsCardProps) {
  const [viewMode, setViewMode] = useState<"count" | "value">("count");
  const { topByCount, topByValue, totalUniqueSkus } = productAnalytics;

  const displayList = viewMode === "count" ? topByCount : topByValue;

  if (displayList.length === 0) return null;

  return (
    <Card className="border-border bg-card shadow-2xs hover:shadow-xs transition-shadow">
      <CardHeader className="p-4 pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Package className="h-4 w-4 text-blue-500" />
            Top Returned SKUs ({totalUniqueSkus} Unique SKUs)
          </CardTitle>
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border">
            <Button
              variant={viewMode === "count" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("count")}
              className="h-5.5 px-2 text-[10px] font-medium cursor-pointer"
            >
              By Count
            </Button>
            <Button
              variant={viewMode === "value" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("value")}
              className="h-5.5 px-2 text-[10px] font-medium cursor-pointer"
            >
              By Value
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        {displayList.slice(0, 5).map((item) => (
          <div
            key={item.sku}
            className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-xs transition-colors hover:bg-muted/40"
          >
            <div className="space-y-0.5 max-w-[260px]">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-bold text-foreground truncate">
                  {item.sku}
                </span>
                {item.fsn && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-mono">
                    {item.fsn}
                  </Badge>
                )}
              </div>
              {item.topReason && (
                <p className="text-[11px] text-muted-foreground truncate">
                  Top: {item.topReason}
                </p>
              )}
            </div>

            <div className="text-right space-y-0.5 shrink-0">
              <span className="font-mono font-bold text-foreground">
                {item.returnCount} returns
              </span>
              <p className="text-[11px] text-muted-foreground font-mono">
                ₹{item.returnValue.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
