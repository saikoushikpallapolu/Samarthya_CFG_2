import { useState, useEffect } from "react";
import PageMeta from "@/components/common/PageMeta";
import {
  apiGetBottleneckAnalytics,
  apiGetPublicGrievances,
  apiBatchEscalateGrievances,
  apiExportReportCsv,
  apiGetDepartments,
  apiGetCategories,
  apiGetAuthorities,
} from "@/services/api";
import type {
  BottleneckAnalytics,
  Grievance,
  Department,
  GrievanceCategory,
  GovernmentAuthority,
} from "@/types/samarthya";
import { DownloadIcon } from "@/icons";

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<BottleneckAnalytics | null>(null);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<GrievanceCategory[]>([]);
  const [authorities, setAuthorities] = useState<GovernmentAuthority[]>([]);
  const [activeTab, setActiveTab] = useState<"BOTTLENECKS" | "ESCALATIONS" | "DIRECTORY">("BOTTLENECKS");
  const [isLoading, setIsLoading] = useState(true);

  // Batch escalation states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [escalationReason, setEscalationReason] = useState("SLA breached over 15 days without physical progress");
  const [targetLevel, setTargetLevel] = useState<"DISTRICT" | "STATE">("DISTRICT");
  const [escalateSuccess, setEscalateSuccess] = useState<string | null>(null);

  // Report Export
  const [exportDistrict, setExportDistrict] = useState("ALL");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bot, gList, depts, cats, auths] = await Promise.all([
        apiGetBottleneckAnalytics(),
        apiGetPublicGrievances(),
        apiGetDepartments(),
        apiGetCategories("hi"),
        apiGetAuthorities(),
      ]);
      setAnalytics(bot);
      setGrievances(gList);
      setDepartments(depts);
      setCategories(cats);
      setAuthorities(auths);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const hanged = grievances.filter((g) => g.sla.isHanged || g.status === "HANGED").map((g) => g.id);
      setSelectedIds(hanged);
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleBatchEscalate = async () => {
    if (selectedIds.length === 0) return;
    const res = await apiBatchEscalateGrievances(selectedIds, escalationReason, targetLevel);
    setEscalateSuccess(`Successfully escalated ${res.escalatedCount} grievances to ${targetLevel === "STATE" ? "State Directorate" : "District Magistrate"}.`);
    setSelectedIds([]);
    loadData();
    setTimeout(() => setEscalateSuccess(null), 4000);
  };

  const handleExportCsv = async () => {
    const csvContent = await apiExportReportCsv(exportDistrict);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Samarthya_Grievance_Audit_${exportDistrict}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const overdueList = grievances.filter((g) => g.sla.isHanged || g.status === "HANGED" || g.sla.daysRemaining <= 0);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <PageMeta
        title="Samarthya Administrator Dashboard | Macro Decision-Making"
        description="State-level bottleneck analytics, batch SLA escalations, directory inspection and CSV exports"
      />

      {/* Admin Title Card */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 font-bold text-2xl">
              📊
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Samarthya Command & Governance Center
                </h1>
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  State Coordination & Macro Analytics
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Identify system-wide departmental bottlenecks, enforce RTE statutory SLAs, and execute bulk escalations to District Magistrates.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={exportDistrict}
              onChange={(e) => setExportDistrict(e.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="ALL">All Districts</option>
              <option value="Sonipat">Sonipat</option>
              <option value="North East Delhi">North East Delhi</option>
              <option value="Patiala">Patiala</option>
              <option value="Gurugram">Gurugram</option>
            </select>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-black dark:bg-white dark:text-gray-900 shadow-xs"
            >
              <DownloadIcon className="size-4" />
              Export CSV Report
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-5 flex gap-2 border-t border-gray-100 pt-4 dark:border-gray-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab("BOTTLENECKS")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "BOTTLENECKS"
                ? "bg-brand-500 text-white shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            📈 Department & District Bottlenecks
          </button>
          <button
            onClick={() => setActiveTab("ESCALATIONS")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "ESCALATIONS"
                ? "bg-brand-500 text-white shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            🚨 Batch Escalation Center ({overdueList.length})
          </button>
          <button
            onClick={() => setActiveTab("DIRECTORY")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "DIRECTORY"
                ? "bg-brand-500 text-white shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            🏛️ Master Department & Authority Directory
          </button>
        </div>
      </div>

      {/* TAB 1: BOTTLENECKS & ANALYTICS */}
      {activeTab === "BOTTLENECKS" && analytics && (
        <div className="space-y-6">
          {/* Department Bottlenecks Table */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Departmental Redressal Delays & Hanged Complaints
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Ranked by average days taken to repair public school infrastructure and percentage of breached deadlines
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold uppercase text-gray-400 dark:border-gray-800">
                    <th className="pb-3 text-start">Department</th>
                    <th className="pb-3 text-start">Open Cases</th>
                    <th className="pb-3 text-start">Hanged / Breached</th>
                    <th className="pb-3 text-start">Avg Resolution Time</th>
                    <th className="pb-3 text-start">Bottleneck Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {analytics.worstPerformingDepartments.map((dept) => {
                    const ratio = (dept.hangedGrievances / dept.openGrievances) * 100;
                    return (
                      <tr key={dept.departmentCode} className="hover:bg-gray-50/50 dark:hover:bg-white/2">
                        <td className="py-4">
                          <span className="font-bold text-gray-900 dark:text-white block">{dept.departmentName}</span>
                          <span className="text-xs text-brand-600 font-mono font-semibold">{dept.departmentCode}</span>
                        </td>
                        <td className="py-4 font-bold text-gray-800 dark:text-gray-200">
                          {dept.openGrievances}
                        </td>
                        <td className="py-4 font-bold text-error-600">
                          {dept.hangedGrievances} ({ratio.toFixed(0)}%)
                        </td>
                        <td className="py-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {dept.averageDaysToResolve} Days
                        </td>
                        <td className="py-4">
                          <div className="w-32 bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${
                                dept.averageDaysToResolve > 30 ? "bg-error-500" : "bg-warning-500"
                              }`}
                              style={{ width: `${Math.min(dept.averageDaysToResolve * 2, 100)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* District Bottlenecks Table */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Worst Performing District Administrations
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Districts with highest SLA breach escalations requiring intervention from District Magistrate
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {analytics.worstPerformingDistricts.map((dist) => (
                <div
                  key={dist.district}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40"
                >
                  <span className="text-xs font-bold text-gray-500 uppercase">District</span>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{dist.district}</h3>

                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Open Complaints:</span>
                      <span className="font-bold">{dist.openGrievances}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hanged Overdue:</span>
                      <span className="font-bold text-error-600">{dist.hangedGrievances}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Escalation Rate:</span>
                      <span className="font-bold text-error-600">{dist.escalationRatePercentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BATCH ESCALATION CENTER */}
      {activeTab === "ESCALATIONS" && (
        <div className="space-y-4">
          {escalateSuccess && (
            <div className="rounded-xl bg-success-50 p-4 text-xs font-bold text-success-800 dark:bg-success-950/30 dark:text-success-300 border border-success-200">
              ✅ {escalateSuccess}
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                SLA Breached & Hanged Grievances Queue
              </h2>
              <p className="text-xs text-gray-500">
                Select petitions and trigger collective statutory escalation to District Magistrate (DM) or State Secretariat
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value as "DISTRICT" | "STATE")}
                className="rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="DISTRICT">Tier 2: District Magistrate</option>
                <option value="STATE">Tier 3: State Secretariat</option>
              </select>
              <input
                type="text"
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                placeholder="Escalation reason..."
                className="rounded-xl border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white w-48"
              />
              <span className="text-xs font-semibold text-gray-500">
                {selectedIds.length} Selected
              </span>
              <button
                disabled={selectedIds.length === 0}
                onClick={handleBatchEscalate}
                className="rounded-xl bg-error-600 px-4 py-2 text-xs font-bold text-white hover:bg-error-700 disabled:opacity-40 shadow-xs"
              >
                🚨 Bulk Escalate
              </button>
            </div>
          </div>

          {/* Batch Grievances Table */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold uppercase text-gray-400 dark:border-gray-800">
                    <th className="pb-3 text-start w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length > 0 && selectedIds.length === overdueList.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded"
                      />
                    </th>
                    <th className="pb-3 text-start">Ticket / School</th>
                    <th className="pb-3 text-start">Issue / Category</th>
                    <th className="pb-3 text-start">Assigned Office</th>
                    <th className="pb-3 text-start">SLA Overdue</th>
                    <th className="pb-3 text-start">Escalation Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {overdueList.map((g) => {
                    const isSelected = selectedIds.includes(g.id);
                    return (
                      <tr key={g.id} className="hover:bg-gray-50/50 dark:hover:bg-white/2">
                        <td className="py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(g.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="py-4">
                          <span className="font-mono text-xs font-bold text-brand-600 block">{g.ticketNumber}</span>
                          <span className="font-semibold text-gray-900 dark:text-white block line-clamp-1">{g.school?.name}</span>
                          <span className="text-xs text-gray-400">{g.school?.district}</span>
                        </td>
                        <td className="py-4">
                          <span className="font-medium text-gray-900 dark:text-white block">{g.category?.name}</span>
                          <span className="text-xs text-gray-500 line-clamp-1">{g.subject}</span>
                        </td>
                        <td className="py-4 text-xs text-gray-600 dark:text-gray-300">
                          {g.assignedAuthority?.officeName}
                        </td>
                        <td className="py-4">
                          <span className="inline-block rounded-md bg-error-50 px-2 py-0.5 text-xs font-bold text-error-700 dark:bg-error-500/15 dark:text-error-400">
                            Breached by {Math.abs(g.sla.daysRemaining || 12)} Days
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                            Tier {g.sla.escalationLevel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MASTER DIRECTORY */}
      {activeTab === "DIRECTORY" && (
        <div className="space-y-6">
          {/* Departments */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
              Government Departments
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {departments.map((d) => (
                <div key={d.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                  <span className="font-mono text-xs font-bold text-brand-600">{d.departmentCode}</span>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{d.departmentName}</h3>
                  <p className="mt-1 text-xs text-gray-500">{d.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Grievance Categories */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
              Grievance Categories & Statutory SLA Limits
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <div key={c.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-brand-600">{c.categoryCode}</span>
                    <span className="rounded bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-800">
                      {c.defaultSlaDays} Days SLA
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-1">{c.categoryName}</h3>
                  <p className="mt-1 text-xs text-gray-500">{c.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Authorities */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
              Government Executive Authorities Directory
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {authorities.map((a) => (
                <div key={a.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                  <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-800 uppercase">
                    {a.jurisdictionLevel} Level • {a.jurisdictionDistrict}
                  </span>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-1">{a.officerName}</h3>
                  <p className="text-xs font-semibold text-brand-600">{a.designation}</p>
                  <p className="text-xs text-gray-500 mt-1">{a.officeName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">📧 {a.officialEmail} • 📞 {a.officialPhone}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
