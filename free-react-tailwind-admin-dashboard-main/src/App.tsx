import { Route, BrowserRouter as Router, Routes } from "react-router";
import { ScrollToTop } from "./components/common/ScrollToTop";
import AppLayout from "./layout/AppLayout";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import Calendar from "./pages/Calendar";
import BarChart from "./pages/Charts/BarChart";
import LineChart from "./pages/Charts/LineChart";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/OtherPage/Blank";
import NotFound from "./pages/OtherPage/NotFound";
import BasicTables from "./pages/Tables/BasicTables";
import Alerts from "./pages/UiElements/Alerts";
import Avatars from "./pages/UiElements/Avatars";
import Badges from "./pages/UiElements/Badges";
import Buttons from "./pages/UiElements/Buttons";
import Images from "./pages/UiElements/Images";
import Videos from "./pages/UiElements/Videos";
import UserProfiles from "./pages/UserProfiles";

// Samarthya Pages
import DashboardIndex from "./pages/Dashboard/DashboardIndex";
import SmcDashboard from "./pages/Dashboard/SmcDashboard";
import CitizenDashboard from "./pages/Dashboard/CitizenDashboard";
import AuthorityDashboard from "./pages/Dashboard/AuthorityDashboard";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import AuthorityActionView from "./pages/Authority/AuthorityActionView";
import NewGrievancePage from "./pages/Grievance/NewGrievancePage";
import GrievanceListPage from "./pages/Grievance/GrievanceListPage";
import SchoolSearchPage from "./pages/School/SchoolSearchPage";
import MySchoolPage from "./pages/School/MySchoolPage";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Main App Layout */}
          <Route element={<AppLayout />}>
            {/* Dynamic Role Dashboard Root */}
            <Route index path="/" element={<DashboardIndex />} />

            {/* Explicit Role Dashboards */}
            <Route path="/dashboard/smc" element={<SmcDashboard />} />
            <Route path="/dashboard/citizen" element={<CitizenDashboard />} />
            <Route path="/dashboard/authority" element={<AuthorityDashboard />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />

            {/* Grievance Management Routes */}
            <Route path="/grievance/new" element={<NewGrievancePage />} />
            <Route path="/grievance/list" element={<GrievanceListPage />} />
            <Route path="/grievances/public" element={<CitizenDashboard />} />

            {/* School Exploration & Profiles */}
            <Route path="/schools/search" element={<SchoolSearchPage />} />
            <Route path="/school/my-school" element={<MySchoolPage />} />

            {/* Government Authority 1-Click Action View */}
            <Route path="/authority/action/:actionToken" element={<AuthorityActionView />} />
            <Route path="/authority/action/demo" element={<AuthorityActionView />} />

            {/* Admin Management Routes */}
            <Route path="/admin/escalations" element={<AdminDashboard />} />
            <Route path="/admin/reports" element={<AdminDashboard />} />
            <Route path="/admin/directory" element={<AdminDashboard />} />

            {/* Other Template Pages */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />
            <Route path="/form-elements" element={<FormElements />} />
            <Route path="/basic-tables" element={<BasicTables />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Standalone Auth Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Standalone Magic Link Route (without sidebar layout, for true officer experience) */}
          <Route path="/action/:actionToken" element={<AuthorityActionView />} />

          {/* Fallback 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
