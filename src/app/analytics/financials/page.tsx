import { FinancialsView } from "@/features/analytics/routes/financials-view";

export const metadata = {
  title: "Financial Analytics | Flipkart Seller Intelligence",
  description: "Revenue waterfall progression, SKU profit contribution, and Input Tax Credits recovery.",
};

export default function AnalyticsFinancialsPage() {
  return <FinancialsView />;
}
