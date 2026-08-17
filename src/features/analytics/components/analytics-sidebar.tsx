"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Package,
  ShoppingBag,
  RotateCcw,
  IndianRupee,
  Receipt,
  CreditCard,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useExcelData } from "@/context/excel-context";

export const ANALYTICS_NAV_ITEMS = [
  {
    title: "Overview",
    href: "/analytics/overview",
    icon: LayoutDashboard,
    description: "Business KPIs & high-level summaries",
  },
  {
    title: "SKU Performance",
    href: "/analytics/sku",
    icon: Layers,
    description: "Top earnings, sales, rates & EPU",
  },
  {
    title: "Products",
    href: "/analytics/products",
    icon: Package,
    description: "Product sales, units, RVP & RTO",
  },
  {
    title: "Orders",
    href: "/analytics/orders",
    icon: ShoppingBag,
    description: "Order status, fulfillment & channel",
  },
  {
    title: "Returns",
    href: "/analytics/returns",
    icon: RotateCcw,
    description: "Reasons, sub-reasons & conditions",
    requiresReturns: true,
  },
  {
    title: "Financials",
    href: "/analytics/financials",
    icon: IndianRupee,
    description: "Revenue waterfall & settlement balance",
    requiresPnl: true,
  },
  {
    title: "Fees & Expenses",
    href: "/analytics/fees",
    icon: Receipt,
    description: "20 fee breakups & SKU tax split",
    requiresPnl: true,
  },
  {
    title: "Settlement",
    href: "/analytics/settlements",
    icon: CreditCard,
    description: "Projected vs settled & payouts",
    requiresPnl: true,
  },
  {
    title: "Cross-Report",
    href: "/analytics/cross-report",
    icon: Sparkles,
    description: "Correlation scatters & return rates",
    requiresBoth: true,
  },
];

export function AnalyticsSidebar() {
  const pathname = usePathname();
  const { uploadedReportsState } = useExcelData();

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-4">
      {/* Navigation Menu */}
      <nav className="rounded-xl border border-border bg-card p-2 space-y-1 shadow-xs">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Analytics Navigation
        </div>
        {ANALYTICS_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.title}</span>
              </div>

              {item.requiresBoth && !uploadedReportsState.bothActive && (
                <Badge variant="outline" className={`text-[9px] px-1 py-0 h-3.5 ${isActive ? "border-primary-foreground/40 text-primary-foreground" : "text-muted-foreground"}`}>
                  Dual
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
