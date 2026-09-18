import { useState, useEffect } from "react";
import PageMeta from "@/components/common/PageMeta";
import { useParams, Link } from "react-router";
import {
  apiGetAuthorityGrievanceByToken,
  apiAcknowledgeByToken,
  apiUpdateStatusByToken,
  apiForwardByToken,
} from "@/services/api";
import type { Grievance } from "@/types/samarthya";
import { TimeIcon } from "@/icons";

export default function AuthorityActionView() {
  const { actionToken } = useParams<{ actionToken?: string }>();
  const [grievance, setGrievance] = useState<Grievance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [activeTab, setActiveTab] = useState<"VIEW" | "ACK" | "UPDATE" | "FORWARD">("VIEW");
  const [ackRemarks, setAckRemarks] = useState("Official receipt acknowledged. Site survey engineer scheduled.");
  const [tentativeDate, setTentativeDate] = useState("2026-09-30");
  const [newStatus, setNewStatus] = useState<"UNDER_INSPECTION" | "IN_PROGRESS" | "RESOLVED">("IN_PROGRESS");
  const [workOrderNumber, setWorkOrderNumber] = useState("WO-2026-PHED-892");
  const [completionSummary, setCompletionSummary] = useState("");
  const [proofPhotoUrl, setProofPhotoUrl] = useState("https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=60");
  const [forwardDept, setForwardDept] = useState("PWD");
  const [forwardReason, setForwardReason] = useState("");

  const token = actionToken || "demo-token";

  const loadGrievance = async () => {
    setIsLoading(true);
    try {
      const g = await apiGetAuthorityGrievanceByToken(token);
      setGrievance(g);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGrievance();
  }, [token]);

  const handleAcknowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiAcknowledgeByToken(token, ackRemarks, tentativeDate);
    setSuccessMessage("Petition successfully acknowledged! SMC committee alerted.");
    setActiveTab("VIEW");
    loadGrievance();
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiUpdateStatusByToken(token, newStatus, completionSummary, workOrderNumber, proofPhotoUrl);
    setSuccessMessage(`Work status updated to ${newStatus}. Completion logged.`);
    setActiveTab("VIEW");
    loadGrievance();
  };

  const handleForward = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiForwardByToken(token, forwardDept, forwardReason);
    setSuccessMessage(`Grievance forwarded to ${forwardDept} Department.`);
    setActiveTab("VIEW");
    loadGrievance();
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!grievance) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Grievance not found or action link expired.</h2>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-6">
      <PageMeta
        title={`Action Portal: ${grievance.ticketNumber} | Samarthya`}
        description="Passwordless 1-Click Government Authority Administrative Action Link"
      />

      {/* Official Government Header Banner */}
      <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50/70 p-5 dark:border-orange-950 dark:bg-orange-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏛️</span>
            <div>
              <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
                Official 1-Click Action Portal (Passwordless HMAC Secure Link)
              </span>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                {grievance.assignedAuthority?.officeName}
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Authorized Officer: {grievance.assignedAuthority?.officerName || grievance.assignedAuthority?.designation}
              </p>
            </div>
          </div>

          <Link
            to="/dashboard/authority"
            className="text-xs text-orange-700 font-semibold underline hover:text-orange-900"
          >
            ← Open Officer Main Dashboard
          </Link>
        </div>
      </div>

      {successMessage && (
        <div className="mb-5 flex items-center justify-between rounded-xl bg-success-50 p-4 text-xs font-bold text-success-800 dark:bg-success-950/30 dark:text-success-300 border border-success-200">
          <span>✅ {successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-success-900">✕</button>
        </div>
      )}

      {/* Ticket Overview Card */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800 gap-2">
          <div>
            <span className="font-mono text-sm font-bold text-brand-600 dark:text-brand-400">
              {grievance.ticketNumber}
            </span>
            <h2 className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
              {grievance.school?.name} (UDISE: {grievance.school?.udise})
            </h2>
            <p className="text-xs text-gray-500">
              📍 {grievance.school?.district} • Category: {grievance.category?.name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                grievance.status === "RESOLVED"
                  ? "bg-success-100 text-success-800"
                  : grievance.status === "IN_PROGRESS"
                  ? "bg-brand-100 text-brand-800"
                  : "bg-orange-100 text-orange-800"
              }`}
            >
              Status: {grievance.status}
            </span>
          </div>
        </div>

        {/* SLA Status Banner */}
        <div className="my-4 flex items-center justify-between rounded-xl bg-gray-50 p-3 text-xs dark:bg-gray-800/50">
          <div className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
            <TimeIcon className="size-4 text-brand-600" />
            <span>SLA Target: <strong>{grievance.sla.slaDays} Days</strong> (Deadline: {grievance.sla.deadline.split("T")[0]})</span>
          </div>
          <span className={`font-bold ${grievance.sla.isHanged ? "text-error-600" : "text-brand-600"}`}>
            {grievance.sla.isHanged ? "⚠️ SLA BREACHED (Level 2 Escalated)" : `⏳ ${grievance.sla.daysRemaining} days remaining`}
          </span>
        </div>

        {/* Action Tabs Bar */}
        <div className="mt-4 flex gap-2 border-b border-gray-100 pb-3 dark:border-gray-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab("VIEW")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "VIEW" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            📄 Review Letter & Photos
          </button>
          <button
            onClick={() => setActiveTab("ACK")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "ACK" ? "bg-orange-600 text-white" : "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300"
            }`}
          >
            ⚡ 1-Click Acknowledge
          </button>
          <button
            onClick={() => setActiveTab("UPDATE")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "UPDATE" ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300"
            }`}
          >
            🛠️ Update Status / Work Order
          </button>
          <button
            onClick={() => setActiveTab("FORWARD")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "FORWARD" ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            ↪️ Forward to Other Dept
          </button>
        </div>

        {/* TAB 1: VIEW FORMAL LETTER */}
        {activeTab === "VIEW" && (
          <div className="pt-4 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-amber-50/20 p-4 font-mono text-xs text-gray-800 whitespace-pre-wrap dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-200">
              <div className="font-bold border-b border-gray-200 pb-2 mb-2 dark:border-gray-700">
                {grievance.subject}
              </div>
              {grievance.formalLetterContent}
            </div>

            {grievance.attachments.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Evidence Photos submitted by School:
                </h4>
                <div className="flex gap-3 overflow-x-auto">
                  {grievance.attachments.map((att) => (
                    <div key={att.id} className="shrink-0">
                      <img src={att.fileUrl} alt="evidence" className="h-32 w-48 rounded-xl object-cover border border-gray-200" />
                      <span className="text-[10px] text-gray-400 block mt-1">{att.caption}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: 1-CLICK ACKNOWLEDGE */}
        {activeTab === "ACK" && (
          <form onSubmit={handleAcknowledge} className="pt-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Official Acknowledgment Receipt
            </h3>
            <p className="text-xs text-gray-500">
              Sending this acknowledgment marks the grievance as formally received by your division and resets the escalation clock.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Official Remarks (अधिकारी टिप्पणी)
              </label>
              <textarea
                rows={3}
                required
                value={ackRemarks}
                onChange={(e) => setAckRemarks(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Tentative Resolution Date (संभावित पूर्णता तिथि)
              </label>
              <input
                type="date"
                required
                value={tentativeDate}
                onChange={(e) => setTentativeDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="rounded-xl bg-orange-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-orange-700 shadow-xs"
              >
                Confirm Official Acknowledgment
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: UPDATE STATUS & WORK ORDER */}
        {activeTab === "UPDATE" && (
          <form onSubmit={handleUpdateStatus} className="pt-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Update Repair Progress & Work Order
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  New Status (नयी स्थिति)
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="UNDER_INSPECTION">निरीक्षण में (Under Inspection)</option>
                  <option value="IN_PROGRESS">कार्य प्रगति पर (In Progress)</option>
                  <option value="RESOLVED">कार्य पूर्ण (Resolved / Repaired)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Work Order / Sanction Ref No.
                </label>
                <input
                  type="text"
                  value={workOrderNumber}
                  onChange={(e) => setWorkOrderNumber(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Completion Photo URL (साइट फोटो)
              </label>
              <input
                type="text"
                value={proofPhotoUrl}
                onChange={(e) => setProofPhotoUrl(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Field Summary / Action Taken (कार्य विवरण)
              </label>
              <textarea
                rows={2}
                value={completionSummary}
                onChange={(e) => setCompletionSummary(e.target.value)}
                placeholder="उदा. नई मोटर व नल स्थापित कर दिए गए हैं, जल आपूर्ति बहाल कर दी गई है।"
                className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="rounded-xl bg-brand-500 px-6 py-2.5 text-xs font-bold text-white hover:bg-brand-600 shadow-xs"
              >
                Save Progress Update
              </button>
            </div>
          </form>
        )}

        {/* TAB 4: FORWARD */}
        {activeTab === "FORWARD" && (
          <form onSubmit={handleForward} className="pt-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Forward to Responsible Department
            </h3>
            <p className="text-xs text-gray-500">
              If this grievance does not fall under your division&apos;s jurisdiction, re-route it immediately.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Forward To Department
              </label>
              <select
                value={forwardDept}
                onChange={(e) => setForwardDept(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="PWD">Public Works Department (Civil/Toilets/Walls)</option>
                <option value="DOE">Directorate of Education (Teachers/Meals)</option>
                <option value="DISCOM">State Electricity Board (Power/Wiring)</option>
                <option value="MCD">Municipal Corporation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Forwarding Justification (अग्रेषण का कारण)
              </label>
              <textarea
                rows={3}
                required
                value={forwardReason}
                onChange={(e) => setForwardReason(e.target.value)}
                placeholder="उदा. स्कूल की चारदीवारी का निर्माण PWD भवन शाखा के अधीन है।"
                className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="rounded-xl bg-gray-900 px-6 py-2.5 text-xs font-bold text-white dark:bg-white dark:text-gray-900 hover:opacity-90 shadow-xs"
              >
                Forward Petition
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
