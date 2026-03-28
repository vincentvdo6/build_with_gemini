import type { Metadata } from "next";
import GeminiDashboard from "@/components/dashboard/GeminiDashboard";

export const metadata: Metadata = {
  title: "Dashboard — AdCraft",
};

export default function DashboardPage() {
  return <GeminiDashboard />;
}
