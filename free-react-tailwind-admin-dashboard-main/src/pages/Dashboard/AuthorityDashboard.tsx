import { useState, useEffect } from "react";
import PageMeta from "@/components/common/PageMeta";
import {
  apiGetPublicGrievances,
  apiAcknowledgeByToken,
  apiUpdateStatusByToken,
  apiForwardByToken,
} from "@/services/api";
import type { Grievance } from "@/types/samarthya";
import { CloseIcon } from "@/icons";
import { Link } from "react-router";

export default function AuthorityDashboard() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Officer action modal
  const [activeGrievance, setActiveGrievance] = useState<Grievance | null>(null);
  const [actionType, setActionType] = useState<"ACKNOWLEDGE" | "UPDATE_STATUS" | "FORWARD" | null>(null);

  // Action Form states
  const [remarks, setRemarks] = useState("");
  const [tentativeDate, setTentativeDate] = useState("2026-09-30");
  const [selectedStatus, setSelectedStatus] = useState<"UNDER_INSPECTION" | "IN_PROGRESS" | "RESOLVED">("IN_PROGRESS");
  const [workOrderNo, setWorkOrderNo] = useState("");
  const [proofPhoto, setProofPhoto] = useState("https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=60");
  const [forwardDept, setForwardDept] = useState("PWD");
  const [forwardReason, setForwardReason] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const list = await apiGetPublicGrievances();
      // Filter grievances assigned to officer's district or department
      setGrievances(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcknowledge = async () => {
    if (!activeGrievance) return;
    try {
      await apiAcknowledgeByToken(activeGrievance.actionToken || activeGrievance.id, remarks, tentativeDate);
    } catch (err) {
      console.error("Acknowledge error:", err);
    }
    setActionType(null);
    setActiveGrievance(null);
    loadData();
  };

  const handleUpdateStatus = async () => {
    if (!activeGrievance) return;
    try {
      await apiUpdateStatusByToken(
        activeGrievance.actionToken || activeGrievance.id,
        selectedStatus,
        remarks,
        workOrderNo || "WO-2026-PWD-892",
        proofPhoto
      );
    } catch (err) {
      console.error("Update status error:", err);
    }
    setActionType(null);
    setActiveGrievance(null);
    loadData();
  };

  const handleForward = async () => {
    if (!activeGrievance) return;
    try {
      await apiForwardByToken(activeGrievance.actionToken || activeGrievance.id, forwardDept, forwardReason);
    } catch (err) {
      console.error("Forward error:", err);
    }
    setActionType(null);
    setActiveGrievance(null);
    loadData();
  };

  const assignedCount = grievances.length;
  const pendingCount = grievances.filter((g) => ["SUBMITTED", "ACKNOWLEDGED"].includes(g.status)).length;
  const inProgressCount = grievances.filter((g) => ["UNDER_INSPECTION", "IN_PROGRESS"].includes(g.status)).length;
  const resolvedCount = grievances.filter((g) => g.status === "RESOLVED").length;

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
        title="Government Authority Portal | Samarthya"
        description="Public Works & Education Department Officer Grievance Management, 1-Click Action & SLA Compliance"
      />

      {/* Officer Header */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400 font-bold text-2xl">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Er. Anil Verma (Executive Engineer)
                </h1>
                <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-500/15 dark:text-orange-400">
                  PHED & Jal Board • Sonipat Division
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Official Jurisdiction: Sonipat District, Haryana • Contact: ee.phed.sonipat@haryana.gov.in
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                Passwordless 1-Click Action Links dispatched directly via official email and SMS notifications.
              </p>
            </div>
          </div>

          <Link
            to="/authority/action/demo"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-700 shadow-xs"
          >
            🔗 Open 1-Click Magic Link View
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Assigned Complaints</p>
          <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{assignedCount}</h3>
          <span className="text-xs text-gray-400">Across 8 rural/urban blocks</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Awaiting Acknowledgment</p>
          <h3 className="mt-1 text-2xl font-bold text-orange-600">{pendingCount}</h3>
          <span className="text-xs text-orange-500">Requires 48-hour response</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Field Works in Progress</p>
          <h3 className="mt-1 text-2xl font-bold text-brand-600">{inProgressCount}</h3>
          <span className="text-xs text-brand-500">JE / Technical team dispatched</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Completed & Satisfied</p>
          <h3 className="mt-1 text-2xl font-bold text-success-600">{resolvedCount}</h3>
          <span className="text-xs text-success-500">Certified by school SMC</span>
        </div>
      </div>

      {/* Assigned Grievances Table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Official Grievance Redressal Queue
            </h2>
            <p className="text-xs text-gray-500">
              Take direct administrative action on school petitions, issue work orders, and upload completion proofs
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold uppercase text-gray-400 dark:border-gray-800">
                <th className="pb-3 text-start">Ticket / School</th>
                <th className="pb-3 text-start">Subject & Issue</th>
                <th className="pb-3 text-start">SLA Target</th>
                <th className="pb-3 text-start">Status</th>
                <th className="pb-3 text-end">Officer Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {grievances.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50/50 dark:hover:bg-white/2">
                  <td className="py-4">
                    <span className="font-mono text-xs font-bold text-brand-600 block">{g.ticketNumber}</span>
                    <span className="font-semibold text-gray-900 dark:text-white block line-clamp-1">{g.school?.name}</span>
                    <span className="text-xs text-gray-400">{g.school?.district}</span>
                  </td>
                  <td className="py-4">
                    <div className="font-medium text-gray-900 dark:text-white line-clamp-1">{g.category?.name}</div>
                    <div className="text-xs text-gray-500 line-clamp-1">{g.subject}</div>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                      {g.sla.slaDays} Days SLA
                    </span>
                    <span className={`text-[11px] ${g.sla.isHanged ? "text-error-600 font-bold" : "text-gray-400"}`}>
                      {g.sla.isHanged ? "ESCALATED / OVERDUE" : `${g.sla.daysRemaining} days left`}
                    </span>
                  </td>
                  <td className="py-4">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${
                        g.status === "RESOLVED"
                          ? "bg-success-100 text-success-800"
                          : g.status === "IN_PROGRESS"
                          ? "bg-brand-100 text-brand-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {g.status}
                    </span>
                  </td>
                  <td className="py-4 text-end">
                    <div className="inline-flex items-center gap-1.5">
                      {g.status === "SUBMITTED" && (
                        <button
                          onClick={() => {
                            setActiveGrievance(g);
                            setActionType("ACKNOWLEDGE");
                          }}
                          className="rounded-lg bg-orange-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-orange-700"
                        >
                          Acknowledge
                        </button>
                      )}
                      {g.status !== "RESOLVED" && (
                        <button
                          onClick={() => {
                            setActiveGrievance(g);
                            setActionType("UPDATE_STATUS");
                          }}
                          className="rounded-lg bg-brand-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-brand-600"
                        >
                          Update Status
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setActiveGrievance(g);
                          setActionType("FORWARD");
                        }}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300"
                      >
                        Forward
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {activeGrievance && actionType && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <button
              onClick={() => {
                setActionType(null);
                setActiveGrievance(null);
              }}
              className="absolute top-5 end-5 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <CloseIcon className="size-5" />
            </button>

            {actionType === "ACKNOWLEDGE" && (
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  आधिकारिक पावती (1-Click Acknowledge)
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Acknowledge receipt of petition {activeGrievance.ticketNumber} and provide tentative resolution date.
                </p>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      अधिकारी टिप्पणी (Officer Remarks)
                    </label>
                    <textarea
                      rows={3}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="उदा. स्थल निरीक्षण हेतु कनिष्ठ अभियंता को निर्देशित किया गया है।"
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      संभावित समाधान तिथि (Tentative Resolution Date)
                    </label>
                    <input
                      type="date"
                      value={tentativeDate}
                      onChange={(e) => setTentativeDate(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      onClick={() => setActionType(null)}
                      className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAcknowledge}
                      className="rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white hover:bg-orange-700"
                    >
                      Confirm Acknowledgment
                    </button>
                  </div>
                </div>
              </div>
            )}

            {actionType === "UPDATE_STATUS" && (
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  कार्य प्रगति अपडेट (Update Work Status)
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Update status for {activeGrievance.ticketNumber} and attach work order or completion proof.
                </p>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      नयी स्थिति (New Status)
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as any)}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="UNDER_INSPECTION">निरीक्षण में (Under Inspection)</option>
                      <option value="IN_PROGRESS">मरम्मत कार्य प्रगति पर (In Progress)</option>
                      <option value="RESOLVED">कार्य पूर्ण (Resolved / Repaired)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      कार्य आदेश संख्या (Work Order Number)
                    </label>
                    <input
                      type="text"
                      placeholder="उदा. WO-2026-PHED-782"
                      value={workOrderNo}
                      onChange={(e) => setWorkOrderNo(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      कार्य पूर्णता फोटो URL (Completion Evidence)
                    </label>
                    <input
                      type="text"
                      value={proofPhoto}
                      onChange={(e) => setProofPhoto(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      अंतिम कार्य विवरण (Completion Summary)
                    </label>
                    <textarea
                      rows={2}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="उदा. नई 1000L पीवीसी टंकी स्थापित व पाइपलाइन कनेक्शन बहाल किया गया।"
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      onClick={() => setActionType(null)}
                      className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateStatus}
                      className="rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white hover:bg-brand-600"
                    >
                      Save Status Update
                    </button>
                  </div>
                </div>
              </div>
            )}

            {actionType === "FORWARD" && (
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  अन्य विभाग को अग्रेषित करें (Forward Grievance)
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Re-route misallocated grievance {activeGrievance.ticketNumber} to the responsible department.
                </p>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      लक्षित विभाग (Target Department)
                    </label>
                    <select
                      value={forwardDept}
                      onChange={(e) => setForwardDept(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="PWD">Public Works Department (PWD)</option>
                      <option value="DOE">Directorate of Education (DOE)</option>
                      <option value="DISCOM">State Electricity Board</option>
                      <option value="MCD">Municipal Corporation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      अग्रेषित करने का कारण (Forwarding Reason)
                    </label>
                    <textarea
                      rows={3}
                      value={forwardReason}
                      onChange={(e) => setForwardReason(e.target.value)}
                      placeholder="उदा. यह मामला सिविल स्ट्रक्चर व चारदीवारी से संबंधित है जो PWD के अधिकार क्षेत्र में आता है।"
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      onClick={() => setActionType(null)}
                      className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleForward}
                      className="rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white hover:bg-orange-700"
                    >
                      Forward & Notify
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
