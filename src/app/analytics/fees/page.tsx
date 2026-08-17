import { FeesView } from "@/features/analytics/routes/fees-view";

export const metadata = {
  title: "Fees & Expenses Analytics | Flipkart Seller Intelligence",
  description: "Granular breakdown of all 20 marketplace fees, forward/reverse shipping, and taxes.",
};

export default function AnalyticsFeesPage() {
  return <FeesView />;
}
