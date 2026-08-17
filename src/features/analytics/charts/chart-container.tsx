"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ChartCardContainerProps {
  title: string;
  description?: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "outline" | "destructive";
  actionSlot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ChartCardContainer({
  title,
  description,
  badge,
  badgeVariant = "secondary",
  actionSlot,
  children,
  className = "",
}: ChartCardContainerProps) {
  return (
    <Card className={`border border-border bg-card shadow-xs flex flex-col justify-between ${className}`}>
      <CardHeader className="p-4 sm:p-5 pb-2 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-sm font-bold tracking-tight text-foreground">
                {title}
              </CardTitle>
              {badge && (
                <Badge variant={badgeVariant} className="text-[10px] px-1.5 py-0 h-4 font-mono">
                  {badge}
                </Badge>
              )}
            </div>
            {description && (
              <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                {description}
              </CardDescription>
            )}
          </div>
          {actionSlot && <div className="shrink-0">{actionSlot}</div>}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-3 flex-1 flex flex-col justify-center">
        {children}
      </CardContent>
    </Card>
  );
}
