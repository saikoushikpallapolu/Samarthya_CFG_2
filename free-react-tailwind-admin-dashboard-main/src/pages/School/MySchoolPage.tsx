import PageMeta from "@/components/common/PageMeta";
import SmcDashboard from "../Dashboard/SmcDashboard";

export default function MySchoolPage() {
  return (
    <div>
      <PageMeta
        title="My School Profile & Committee | Samarthya"
        description="Public School Details, Enrollment, Headmaster, and Committee Records"
      />
      <SmcDashboard />
    </div>
  );
}
