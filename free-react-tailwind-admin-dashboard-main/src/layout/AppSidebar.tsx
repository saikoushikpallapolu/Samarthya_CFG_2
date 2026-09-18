import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { useCallback } from "react";
import { Link, useLocation } from "react-router";
import {
  GridIcon,
  AudioIcon,
  ListIcon,
  PieChartIcon,
  TableIcon,
  CheckCircleIcon,
  AlertIcon,
  DownloadIcon,
  GroupIcon,
  UserCircleIcon,
  PlugInIcon,
} from "../icons";
import { cn } from "../utils";
import type { UserRole } from "@/types/samarthya";

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

export default function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { role, switchRole } = useAuth();
  const location = useLocation();

  const isActive = useCallback(
    (path: string) => location.pathname === path || (path === "/dashboard/smc" && location.pathname === "/"),
    [location.pathname]
  );

  // Dynamic Navigation items per role
  const getRoleNavItems = (): { title: string; items: NavItem[] } => {
    switch (role) {
      case "SMC_MEMBER":
        return {
          title: "SMC Member Operations",
          items: [
            { name: "SMC Dashboard", path: "/dashboard/smc", icon: <GridIcon className="size-5" /> },
            { name: "File Grievance (Voice & Letter)", path: "/grievance/new", icon: <AudioIcon className="size-5" />, badge: "AI-STT" },
            { name: "Track Grievances & SLA", path: "/grievance/list", icon: <ListIcon className="size-5" /> },
            { name: "My School Profile", path: "/school/my-school", icon: <UserCircleIcon className="size-5" /> },
          ],
        };
      case "CITIZEN":
        return {
          title: "Citizen Transparency",
          items: [
            { name: "Public Transparency Portal", path: "/dashboard/citizen", icon: <PieChartIcon className="size-5" /> },
            { name: "Search & Locate Schools", path: "/schools/search", icon: <GridIcon className="size-5" /> },
            { name: "Public Grievances & Upvote", path: "/grievances/public", icon: <GroupIcon className="size-5" />, badge: "Live" },
          ],
        };
      case "GOVERNMENT_OFFICER":
        return {
          title: "Government Authority",
          items: [
            { name: "Officer Portal", path: "/dashboard/authority", icon: <GridIcon className="size-5" /> },
            { name: "1-Click Magic Link Action", path: "/authority/action/demo", icon: <CheckCircleIcon className="size-5" />, badge: "Token" },
          ],
        };
      case "SAMARTHYA_ADMIN":
      case "SAMARTHYA_COORDINATOR":
      default:
        return {
          title: "Administrator Portal",
          items: [
            { name: "Bottleneck Analytics", path: "/dashboard/admin", icon: <PieChartIcon className="size-5" /> },
            { name: "Batch Escalations", path: "/admin/escalations", icon: <AlertIcon className="size-5" />, badge: "SLA" },
            { name: "Export Audit Reports", path: "/admin/reports", icon: <DownloadIcon className="size-5" /> },
            { name: "Master Directory", path: "/admin/directory", icon: <TableIcon className="size-5" /> },
          ],
        };
    }
  };

  const roleMenu = getRoleNavItems();

  const allDashboards: { name: string; role: UserRole; path: string; icon: string }[] = [
    { name: "SMC Member Portal", role: "SMC_MEMBER", path: "/dashboard/smc", icon: "🏫" },
    { name: "Citizen Transparency", role: "CITIZEN", path: "/dashboard/citizen", icon: "👥" },
    { name: "Government Authority", role: "GOVERNMENT_OFFICER", path: "/dashboard/authority", icon: "🏛️" },
    { name: "Samarthya Admin", role: "SAMARTHYA_ADMIN", path: "/dashboard/admin", icon: "📊" },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-s-0 top-0 z-50 flex h-screen flex-col border-e border-gray-200 bg-white px-4 text-gray-900 transition-all duration-300 ease-in-out xl:translate-x-0 xl:rtl:translate-x-0 dark:border-gray-800 dark:bg-gray-900",
        isExpanded || isMobileOpen ? "w-72.5" : isHovered ? "w-72.5" : "w-22.5",
        isMobileOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
      )}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Brand Header */}
      <div className={cn("flex py-6 items-center", !isExpanded && !isHovered ? "xl:justify-center" : "justify-start")}>
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white font-bold shadow-md shadow-brand-500/20">
            <span className="text-xl">स</span>
          </div>
          {(isExpanded || isHovered || isMobileOpen) && (
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                  Samarthya
                </span>
                <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  समर्थ्या
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[170px]">
                Public School Grievance Portal
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation List */}
      <div className="no-scrollbar flex flex-col flex-1 overflow-y-auto duration-300 ease-linear">
        <nav className="mb-6 space-y-6">
          {/* Active Role Operations */}
          <div>
            {(isExpanded || isHovered || isMobileOpen) && (
              <h2 className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {roleMenu.title}
              </h2>
            )}
            <ul className="flex flex-col gap-1">
              {roleMenu.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        active
                          ? "bg-brand-500 text-white shadow-xs font-semibold"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
                      )}
                    >
                      <span className={cn("shrink-0", active ? "text-white" : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-white")}>
                        {item.icon}
                      </span>
                      {(isExpanded || isHovered || isMobileOpen) && (
                        <span className="truncate flex-1">{item.name}</span>
                      )}
                      {(isExpanded || isHovered || isMobileOpen) && item.badge && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            active
                              ? "bg-white/20 text-white"
                              : "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Quick Dashboards Switcher */}
          <div>
            {(isExpanded || isHovered || isMobileOpen) && (
              <h2 className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Switch Role Dashboards
              </h2>
            )}
            <ul className="flex flex-col gap-1">
              {allDashboards.map((dash) => {
                const isCurrent = role === dash.role;
                return (
                  <li key={dash.role}>
                    <button
                      type="button"
                      onClick={() => switchRole(dash.role)}
                      className={cn(
                        "w-full text-start flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                        isCurrent
                          ? "bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white font-semibold"
                          : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/3"
                      )}
                    >
                      <span className="text-base shrink-0">{dash.icon}</span>
                      {(isExpanded || isHovered || isMobileOpen) && (
                        <span className="truncate flex-1">{dash.name}</span>
                      )}
                      {(isExpanded || isHovered || isMobileOpen) && isCurrent && (
                        <span className="size-2 rounded-full bg-success-500" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Auth & Profile */}
          <div>
            {(isExpanded || isHovered || isMobileOpen) && (
              <h2 className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Account & Demo Links
              </h2>
            )}
            <ul className="flex flex-col gap-1">
              <li>
                <Link
                  to="/signin"
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/3"
                >
                  <PlugInIcon className="size-4 shrink-0 text-gray-400" />
                  {(isExpanded || isHovered || isMobileOpen) && <span>Role-Based Sign In / OTP</span>}
                </Link>
              </li>
              <li>
                <Link
                  to="/authority/action/demo"
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-500/10"
                >
                  <span className="text-sm">🔗</span>
                  {(isExpanded || isHovered || isMobileOpen) && <span>1-Click Magic Link Demo</span>}
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      {/* Role Badge Footer */}
      {(isExpanded || isHovered || isMobileOpen) && (
        <div className="p-3 mb-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Active Identity</span>
            <span className="inline-block size-2 rounded-full bg-success-500" />
          </div>
          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
            {role}
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            Click switchers above or in top header
          </p>
        </div>
      )}
    </aside>
  );
}
