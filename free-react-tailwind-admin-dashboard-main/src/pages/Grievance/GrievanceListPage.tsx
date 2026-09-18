import PageMeta from "@/components/common/PageMeta";
import SmcDashboard from "../Dashboard/SmcDashboard";

export default function GrievanceListPage() {
  return (
    <div>
      <PageMeta
        title="School Grievances & SLA Redressal Queue | Samarthya"
        description="Comprehensive list of school grievances with SLA countdowns and ground verification"
      />
      <SmcDashboard />
    </div>
  );
}
