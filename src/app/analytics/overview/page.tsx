import { OverviewView } from "@/features/analytics/routes/overview-view";

export const metadata = {
  title: "Overview Analytics | Flipkart Seller Intelligence",
  description: "High-level Flipkart business performance, net earnings, sales, and units progression.",
};

export default function AnalyticsOverviewPage() {
  return <OverviewView />;
}
