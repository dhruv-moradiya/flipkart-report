import { SettlementsView } from "@/features/analytics/routes/settlements-view";

export const metadata = {
  title: "Settlement Analytics | Flipkart Seller Intelligence",
  description: "Bank settlement projections, settled vs pending payouts, and transaction history.",
};

export default function AnalyticsSettlementsPage() {
  return <SettlementsView />;
}
