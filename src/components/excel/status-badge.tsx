"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) return null;

  const s = status.toLowerCase().trim();

  // Use ONLY standard shadcn badge variants: default, secondary, outline, destructive
  let variant: "default" | "secondary" | "outline" | "destructive" = "secondary";

  if (
    s.includes("delivered") ||
    s.includes("approved") ||
    s.includes("completed") ||
    s.includes("refunded") ||
    s.includes("closed") ||
    s.includes("success")
  ) {
    variant = "default";
  } else if (
    s.includes("transit") ||
    s.includes("dispatched") ||
    s.includes("shipped") ||
    s.includes("start") ||
    s.includes("pickup") ||
    s.includes("in_progress")
  ) {
    variant = "secondary";
  } else if (
    s.includes("pending") ||
    s.includes("awaited") ||
    s.includes("requested") ||
    s.includes("created") ||
    s.includes("open")
  ) {
    variant = "outline";
  } else if (
    s.includes("rejected") ||
    s.includes("damaged") ||
    s.includes("cancelled") ||
    s.includes("failed") ||
    s.includes("lost") ||
    s.includes("disputed")
  ) {
    variant = "destructive";
  }

  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  );
}
