import * as XLSX from "xlsx";

/**
 * Inspects SheetJS column metadata to determine hidden/collapsed state
 */
export function isColumnHidden(cols: XLSX.ColInfo[] | undefined, colIndex: number): boolean {
  if (!cols || !cols[colIndex]) return false;
  const col = cols[colIndex];
  return Boolean(col.hidden || col.wch === 0 || (col as unknown as { width?: number }).width === 0);
}

/**
 * Gets column statistics including hidden/collapsed count
 */
export function getColumnVisibilityStats(cols: XLSX.ColInfo[] | undefined, maxCols: number): {
  totalColumns: number;
  hiddenColumns: number;
  visibleColumns: number;
} {
  let hiddenCount = 0;
  for (let c = 0; c < maxCols; c++) {
    if (isColumnHidden(cols, c)) {
      hiddenCount++;
    }
  }
  return {
    totalColumns: maxCols,
    hiddenColumns: hiddenCount,
    visibleColumns: maxCols - hiddenCount,
  };
}
