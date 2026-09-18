import { useAuth } from "@/context/AuthContext";
import SmcDashboard from "./SmcDashboard";
import CitizenDashboard from "./CitizenDashboard";
import AuthorityDashboard from "./AuthorityDashboard";
import AdminDashboard from "./AdminDashboard";

export default function DashboardIndex() {
  const { role } = useAuth();

  switch (role) {
    case "SMC_MEMBER":
      return <SmcDashboard />;
    case "CITIZEN":
      return <CitizenDashboard />;
    case "GOVERNMENT_OFFICER":
      return <AuthorityDashboard />;
    case "SAMARTHYA_ADMIN":
    case "SAMARTHYA_COORDINATOR":
      return <AdminDashboard />;
    default:
      return <SmcDashboard />;
  }
}
