"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, FileSpreadsheet, ArrowRight, RotateCcw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface MissingReportBannerProps {
  reportRequired: "pnl" | "returns" | "both";
  featureTitle: string;
  benefits?: string[];
}

export function MissingReportBanner({
  reportRequired,
  featureTitle,
  benefits = [],
}: MissingReportBannerProps) {
  const isReturns = reportRequired === "returns";
  const isPnl = reportRequired === "pnl";

  return (
    <Card className="border border-dashed border-border bg-card p-6 sm:p-8 text-center max-w-xl mx-auto shadow-xs">
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
          {isReturns ? (
            <RotateCcw className="h-6 w-6 text-foreground" />
          ) : (
            <TrendingUp className="h-6 w-6 text-foreground" />
          )}
        </div>

        <div className="space-y-1">
          <CardTitle className="text-base font-bold text-foreground">
            {isReturns ? "Flipkart Returns Report Required" : "Flipkart P&L Report Required"}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Upload your official {isReturns ? "Returns Report" : "Profit & Loss (SKU-level & Orders)"} to unlock {featureTitle}.
          </CardDescription>
        </div>

        {benefits.length > 0 && (
          <ul className="text-left text-xs text-muted-foreground space-y-1 py-2 font-mono">
            {benefits.map((b, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        <Button asChild size="sm" className="gap-2 cursor-pointer mt-2">
          <Link href="/">
            <FileSpreadsheet className="h-4 w-4" />
            Upload {isReturns ? "Returns Report" : "P&L Report"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
