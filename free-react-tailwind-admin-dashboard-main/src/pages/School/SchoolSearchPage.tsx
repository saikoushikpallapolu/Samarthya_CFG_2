import PageMeta from "@/components/common/PageMeta";
import CitizenDashboard from "../Dashboard/CitizenDashboard";

export default function SchoolSearchPage() {
  return (
    <div>
      <PageMeta
        title="Search & Locate Schools | Samarthya"
        description="Public School Directory, Geolocation Radius Finder, and Citizen School Report Cards"
      />
      <CitizenDashboard />
    </div>
  );
}
