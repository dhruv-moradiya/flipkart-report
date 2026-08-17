"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileSpreadsheet,
  Layers,
  ShoppingBag,
  TrendingUp,
  Table as TableIcon,
  RotateCcw,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useExcelData } from "@/context/excel-context";
import { ANALYTICS_NAV_ITEMS } from "./analytics-sidebar";

export function AnalyticsHeader() {
  const pathname = usePathname();
  const { uploadedReportsState, pnlReport, records } = useExcelData();

  const currentNav = ANALYTICS_NAV_ITEMS.find((n) => n.href === pathname) || ANALYTICS_NAV_ITEMS[0];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer">
            <Link href="/" title="Return to Upload & Home">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-foreground tracking-tight">
                {currentNav.title} Analytics
              </h1>
              {uploadedReportsState.bothActive ? (
                <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 gap-1">
                  <Sparkles className="h-3 w-3" />
                  Dual Datasets
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {uploadedReportsState.pnlActive ? "P&L Active" : "Returns Active"}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{currentNav.description}</p>
          </div>
        </div>

        {/* Global Route Switches */}
        <div className="flex items-center gap-2 flex-wrap">
          {pnlReport && (
            <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1.5 bg-background cursor-pointer">
              <Link href="/pnl">
                <TableIcon className="h-3.5 w-3.5" />
                P&L Tables
              </Link>
            </Button>
          )}

          {records.length > 0 && (
            <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1.5 bg-background cursor-pointer">
              <Link href="/table">
                <ShoppingBag className="h-3.5 w-3.5" />
                Returns Table
              </Link>
            </Button>
          )}

          <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer">
            <Link href="/">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Uploads
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
