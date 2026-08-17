"use client";

import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CopyButton } from "@/components/copy-button";

interface CompactIdCellProps {
  id: string;
  label?: string;
  maxChars?: number;
  className?: string;
}

export function CompactIdCell({
  id,
  label = "ID",
  maxChars = 15,
  className,
}: CompactIdCellProps) {
  if (!id) return <span className="text-muted-foreground text-xs">—</span>;

  const isLong = id.length > maxChars;
  const displayId = isLong ? `${id.slice(0, maxChars)}...` : id;

  return (
    <div className={`group/cell inline-flex items-center gap-1.5 max-w-full ${className || ""}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="font-mono text-xs font-medium text-foreground bg-muted/60 hover:bg-muted/90 border border-border px-1.5 py-0.5 rounded cursor-default truncate max-w-[140px] select-all transition-colors">
            {displayId}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="font-mono text-xs max-w-xs break-all">
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground font-sans font-normal uppercase tracking-wider">
              {label}
            </p>
            <p className="font-mono text-xs font-semibold">{id}</p>
          </div>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div onClick={(e) => e.stopPropagation()}>
            <CopyButton
              text={id}
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover/cell:opacity-100 focus-visible:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Copy {label}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
