"use client";

import React, { useState } from "react";
import { Package, IndianRupee, Layers } from "lucide-react";
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
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Package className="h-4 w-4 text-foreground" />
            Top Returned SKUs ({totalUniqueSkus} SKUs)
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === "count" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("count")}
              className="h-6 px-2 text-[11px]"
            >
              By Count
            </Button>
            <Button
              variant={viewMode === "value" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("value")}
              className="h-6 px-2 text-[11px]"
            >
              By Value
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="space-y-2">
          {displayList.slice(0, 5).map((item, idx) => (
            <div
              key={item.sku}
              className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2 text-xs"
            >
              <div className="space-y-0.5 max-w-[240px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-semibold text-foreground truncate">
                    {item.sku}
                  </span>
                  {item.fsn && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                      {item.fsn}
                    </Badge>
                  )}
                </div>
                {item.topReason && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    Top Reason: {item.topReason}
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
        </div>
      </CardContent>
    </Card>
  );
}
