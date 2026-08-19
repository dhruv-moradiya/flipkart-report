"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ReasonAnalytics } from "../types/analytics.types";

interface TopReasonsCardProps {
  reasonAnalytics: ReasonAnalytics;
  totalReturns: number;
}

export function TopReasonsCard({ reasonAnalytics }: TopReasonsCardProps) {
  const { topReasons, totalReasonsCount } = reasonAnalytics;

  if (topReasons.length === 0) return null;

  return (
    <Card className="border-border bg-card shadow-2xs hover:shadow-xs transition-shadow">
      <CardHeader className="p-4 pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            Top Return Reasons ({totalReasonsCount} Categories)
          </CardTitle>
          <Badge variant="secondary" className="text-[10px] font-mono">
            {topReasons.length} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {topReasons.slice(0, 6).map((item) => (
          <div key={item.reason} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground truncate max-w-[280px]">
                {item.reason}
              </span>
              <span className="font-mono text-xs font-semibold text-foreground">
                {item.count}{" "}
                <span className="font-normal text-[11px] text-muted-foreground">
                  ({item.percentage}%)
                </span>
              </span>
            </div>
            <Progress value={item.percentage} className="h-1.5 bg-muted" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
