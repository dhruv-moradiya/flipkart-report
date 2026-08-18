"use client";

import React from "react";
import { AnalyticsHeader } from "@/features/analytics/components/analytics-header";
import { AnalyticsSidebar } from "@/features/analytics/components/analytics-sidebar";
import { OrderJourneySheet } from "@/features/reports/components/order-journey-sheet";

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background text-foreground flex flex-col">
      <AnalyticsHeader />

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <AnalyticsSidebar />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </main>

      {/* Cross-report Order Journey Drawer Accessible Everywhere */}
      <OrderJourneySheet />
    </div>
  );
}
