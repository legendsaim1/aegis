import DashboardShell from "../../components/layout/DashboardShell";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Dashboard - AEGIS",
  description: "AEGIS AI-Powered Grading Dashboard",
};

export default function DashboardLayout({ children }) {
  return <DashboardShell>{children}</DashboardShell>;
}