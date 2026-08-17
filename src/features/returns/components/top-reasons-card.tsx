"use client";

import React from "react";
import { AlertCircle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ReasonAnalytics } from "../types/analytics.types";

interface TopReasonsCardProps {
  reasonAnalytics: ReasonAnalytics;
  totalReturns: number;
}

export function TopReasonsCard({ reasonAnalytics, totalReturns }: TopReasonsCardProps) {
  const { topReasons, totalReasonsCount } = reasonAnalytics;

  if (topReasons.length === 0) return null;

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-foreground" />
            Top Return Reasons ({totalReasonsCount} detected)
          </CardTitle>
          <span className="text-[11px] text-muted-foreground">Source: Return Reason</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-2.5">
        {topReasons.slice(0, 6).map((item) => (
          <div key={item.reason} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground truncate max-w-[260px]">
                {item.reason}
              </span>
              <span className="font-mono text-muted-foreground">
                {item.count} ({item.percentage}%)
              </span>
            </div>
            <Progress value={item.percentage} className="h-1.5 bg-muted" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
