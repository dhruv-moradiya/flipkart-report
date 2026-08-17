"use client";

import React from "react";
import { TopNCount } from "../types/analytics.types";
import { Button } from "@/components/ui/button";

interface TopNSelectProps {
  value: TopNCount;
  onChange: (val: TopNCount) => void;
  options?: TopNCount[];
}

export function TopNSelect({ value, onChange, options = [5, 10, 15, 20] }: TopNSelectProps) {
  return (
    <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border">
      <span className="text-[10px] text-muted-foreground font-semibold px-1.5">Top:</span>
      {options.map((opt) => (
        <Button
          key={opt}
          variant={value === opt ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onChange(opt)}
          className={`h-6 px-2 text-[11px] font-mono cursor-pointer ${
            value === opt ? "bg-background shadow-xs font-bold text-foreground" : "text-muted-foreground"
          }`}
        >
          {opt}
        </Button>
      ))}
    </div>
  );
}
