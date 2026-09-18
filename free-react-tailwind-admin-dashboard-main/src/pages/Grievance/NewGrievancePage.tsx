import PageMeta from "@/components/common/PageMeta";
import SmcDashboard from "../Dashboard/SmcDashboard";

export default function NewGrievancePage() {
  return (
    <div>
      <PageMeta
        title="File Voice Grievance | Samarthya"
        description="Speech-to-Text Voice Recording and Administrative Letter Generator for SMC Members"
      />
      <SmcDashboard />
    </div>
  );
}
