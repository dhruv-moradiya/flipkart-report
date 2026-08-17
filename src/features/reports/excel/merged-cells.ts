import * as XLSX from "xlsx";

/**
 * Propagates merged cell values across horizontal and vertical ranges
 */
export function resolveMergedHeaders(
  row0: (string | null)[],
  row1: (string | null)[],
  merges: XLSX.Range[],
  maxCols: number
): { resolvedRow0: (string | null)[]; resolvedRow1: (string | null)[] } {
  const resolvedRow0 = [...row0];
  const resolvedRow1 = [...row1];

  merges.forEach((merge) => {
    const { s, e } = merge;

    // Horizontal merge across Row 0 (e.g. O1:AH1 -> s.r=0, e.r=0, s.c=14, e.c=33)
    if (s.r === 0) {
      const parentVal = resolvedRow0[s.c];
      if (parentVal) {
        for (let c = s.c; c <= e.c && c < maxCols; c++) {
          resolvedRow0[c] = parentVal;
        }
      }
    }

    // Horizontal merge across Row 1
    if (s.r === 1 && e.r === 1) {
      const childVal = resolvedRow1[s.c];
      if (childVal) {
        for (let c = s.c; c <= e.c && c < maxCols; c++) {
          resolvedRow1[c] = childVal;
        }
      }
    }

    // Vertical merge from Row 0 to Row 1 (e.g. A1:A2 -> s.r=0, e.r>=1, s.c=e.c)
    if (s.r === 0 && e.r >= 1 && s.c === e.c) {
      const topVal = resolvedRow0[s.c];
      if (topVal && !resolvedRow1[s.c]) {
        resolvedRow1[s.c] = topVal;
      }
    }
  });

  return { resolvedRow0, resolvedRow1 };
}
