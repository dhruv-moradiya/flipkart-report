import { ReturnRecord } from "../types/return.types";
import { LocationAnalytics, LocationMetric } from "../types/analytics.types";

/**
 * Calculates Location return analytics
 *
 * Source Columns: Location ID, Location Name
 */
export function calculateLocationAnalytics(returns: ReturnRecord[]): LocationAnalytics {
  if (returns.length === 0) {
    return {
      isSingleLocation: true,
      primaryLocation: null,
      locations: [],
    };
  }

  const map: Record<string, { locationName: string; count: number; totalValue: number }> = {};

  returns.forEach((r) => {
    const locId = r.locationId.trim() || "UNKNOWN";
    const locName = r.locationName.trim() || locId;

    if (!map[locId]) {
      map[locId] = { locationName: locName, count: 0, totalValue: 0 };
    }
    map[locId].count++;
    map[locId].totalValue += r.totalPrice;
  });

  const locations: LocationMetric[] = Object.entries(map).map(([locationId, data]) => ({
    locationId,
    locationName: data.locationName,
    count: data.count,
    totalValue: data.totalValue,
  })).sort((a, b) => b.count - a.count);

  const isSingleLocation = locations.length <= 1;
  const primaryLocation = locations.length > 0 ? locations[0] : null;

  return {
    isSingleLocation,
    primaryLocation,
    locations,
  };
}
