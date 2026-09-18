import { useState, useEffect } from "react";
import PageMeta from "@/components/common/PageMeta";
import {
  apiGetGrievancesBySchool,
  apiGetSchoolById,
  apiGetCategories,
  apiProcessAudio,
  apiPreviewLetter,
  apiSubmitGrievance,
  apiUploadPhysicalAck,
  apiVerifyResolution,
} from "@/services/api";
import type { Grievance, School, GrievanceCategory } from "@/types/samarthya";
import { useAuth } from "@/context/AuthContext";
import {
  AudioIcon,
  CheckCircleIcon,
  AlertIcon,
  TimeIcon,
  FileIcon,
  CloseIcon,
  DownloadIcon,
} from "@/icons";

export default function SmcDashboard() {
  const { currentUser } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [categories, setCategories] = useState<GrievanceCategory[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal states
  const [isNewGrievanceOpen, setIsNewGrievanceOpen] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  // New Grievance Wizard Form states
  const [step, setStep] = useState<number>(1); // 1: Voice/Input, 2: Details, 3: Letterhead Preview, 4: Success
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("HIGH");
  const [facilityAffected, setFacilityAffected] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [durationOfIssue, setDurationOfIssue] = useState("");
  const [photoUrl, setPhotoUrl] = useState("https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=800&auto=format&fit=crop&q=60");
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewLetter, setPreviewLetter] = useState("");
  const [submittedGrievance, setSubmittedGrievance] = useState<Grievance | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Physical Receipt form
  const [diaryNumber, setDiaryNumber] = useState("");
  const [receiptPhoto, setReceiptPhoto] = useState("https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=60");

  // Ground Verification form
  const [isSatisfied, setIsSatisfied] = useState(true);
  const [verificationFeedback, setVerificationFeedback] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const schId = currentUser.associatedSchools?.[0]?.schoolId || "sch-sonipat-01";
      const sch = await apiGetSchoolById(schId);
      setSchool(sch);
      const list = await apiGetGrievancesBySchool(sch.id);
      setGrievances(list);
      const cats = await apiGetCategories("hi");
      setCategories(cats);
      if (cats.length > 0) setSelectedCategoryId(cats[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Voice recording timer simulation
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    setIsProcessingAudio(true);
    try {
      const res = await apiProcessAudio(undefined, "hi", selectedCategoryId);
      setTranscription(res.transcriptionRaw);
      if (res.extractedFields.facility_affected) setFacilityAffected(res.extractedFields.facility_affected);
      if (res.extractedFields.specific_problem) setProblemDescription(res.extractedFields.specific_problem);
      if (res.extractedFields.duration_of_issue) setDurationOfIssue(res.extractedFields.duration_of_issue);
      if (res.detectedCategory) setSelectedCategoryId(res.detectedCategory.id);
      setStep(2);
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const handleGeneratePreview = async () => {
    if (!school) return;
    setIsLoading(true);
    try {
      const result = await apiPreviewLetter("tpl-water-hi", school.id, {
        facility_affected: facilityAffected || "पीने के पानी की सुविधा",
        specific_problem: problemDescription || "सुविधा में खराबी है",
        duration_of_issue: durationOfIssue || "2 सप्ताह से",
      });
      setPreviewSubject(result.renderedSubject);
      setPreviewLetter(result.renderedMarkdown);
      setStep(3);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!school) return;
    setIsSubmitting(true);
    try {
      const newG = await apiSubmitGrievance({
        schoolId: school.id,
        categoryId: selectedCategoryId,
        templateId: "tpl-water-hi",
        submissionChannel: "HYBRID",
        priority,
        dynamicFieldValues: {
          facility_affected: facilityAffected,
          specific_problem: problemDescription,
          duration_of_issue: durationOfIssue,
        },
        audioTranscriptionRaw: transcription,
        photoAttachmentUrls: [photoUrl],
      });
      setSubmittedGrievance(newG);
      setStep(4);
      loadData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadReceiptSubmit = async () => {
    if (!selectedGrievance) return;
    await apiUploadPhysicalAck(
      selectedGrievance.id,
      receiptPhoto,
      new Date().toISOString(),
      diaryNumber || "DIARY-2026/894"
    );
    setIsReceiptModalOpen(false);
    setSelectedGrievance(null);
    loadData();
  };

  const handleVerifySubmit = async () => {
    if (!selectedGrievance) return;
    await apiVerifyResolution(
      selectedGrievance.id,
      isSatisfied,
      verificationFeedback || (isSatisfied ? "Ground work verified by SMC." : "Work incomplete, reopened.")
    );
    setIsVerifyModalOpen(false);
    setSelectedGrievance(null);
    loadData();
  };

  const filteredGrievances = grievances.filter((g) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "OPEN") return ["SUBMITTED", "ACKNOWLEDGED", "UNDER_INSPECTION"].includes(g.status);
    if (statusFilter === "IN_PROGRESS") return g.status === "IN_PROGRESS";
    if (statusFilter === "RESOLVED") return g.status === "RESOLVED";
    if (statusFilter === "HANGED") return g.status === "HANGED" || g.sla.isHanged;
    return true;
  });

  const totalCount = grievances.length;
  const resolvedCount = grievances.filter((g) => g.status === "RESOLVED").length;
  const hangedCount = grievances.filter((g) => g.status === "HANGED" || g.sla.isHanged).length;
  const inProgressCount = grievances.filter((g) => ["IN_PROGRESS", "UNDER_INSPECTION"].includes(g.status)).length;

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
        title="SMC Member Dashboard | Samarthya"
        description="Public School SMC Member Dashboard - Voice Grievance Filing, SLA Tracking, and Ground Verification"
      />

      {/* School Header Card */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 font-bold text-2xl">
              🏫
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {school?.schoolName || "Government Public School"}
                </h1>
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  UDISE: {school?.udiseCode || "06080100101"}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                📍 {school?.villageOrWard}, {school?.block}, {school?.district}, {school?.state} • PIN: {school?.pincode}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                Principal: {school?.headmasterName} • Phone: {school?.headmasterPhone} • Enrolled Students: {school?.totalStudentsEnrolled}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setStep(1);
              setIsNewGrievanceOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600 transition"
          >
            <AudioIcon className="size-5" />
            File Grievance (बोलकर / Voice)
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Grievances</p>
              <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-400">
              <FileIcon className="size-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Official registered petitions</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">In Active Progress</p>
              <h3 className="mt-1 text-2xl font-bold text-brand-600 dark:text-brand-400">{inProgressCount}</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              <TimeIcon className="size-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Under authority inspection</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Resolved & Verified</p>
              <h3 className="mt-1 text-2xl font-bold text-success-600 dark:text-success-400">{resolvedCount}</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400">
              <CheckCircleIcon className="size-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">SMC certified completed works</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">SLA Overdue / Hanged</p>
              <h3 className="mt-1 text-2xl font-bold text-error-600 dark:text-error-400">{hangedCount}</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400">
              <AlertIcon className="size-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-error-500">Auto-escalated to District Magistrate</p>
        </div>
      </div>

      {/* Grievances List Section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              School Grievance Redressal Records
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Track government department SLAs, upload stamped physical receipts, and verify ground repairs
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "HANGED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === st
                    ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold uppercase text-gray-400 dark:border-gray-800">
                <th className="pb-3 text-start">Ticket / Date</th>
                <th className="pb-3 text-start">Category & Issue</th>
                <th className="pb-3 text-start">Assigned Authority</th>
                <th className="pb-3 text-start">SLA Status</th>
                <th className="pb-3 text-start">Current State</th>
                <th className="pb-3 text-end">SMC Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredGrievances.map((g) => {
                const isOverdue = g.sla.isHanged || g.sla.isBreached;
                return (
                  <tr key={g.id} className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition">
                    <td className="py-4 font-medium text-gray-900 dark:text-white">
                      <div className="font-semibold text-brand-600 dark:text-brand-400">{g.ticketNumber}</div>
                      <div className="text-xs text-gray-400">{g.createdAt.split("T")[0]}</div>
                    </td>
                    <td className="py-4">
                      <div className="font-medium text-gray-900 dark:text-white line-clamp-1">{g.category?.name}</div>
                      <div className="text-xs text-gray-500 line-clamp-1">{g.subject}</div>
                    </td>
                    <td className="py-4 text-xs text-gray-600 dark:text-gray-300">
                      <div className="font-semibold">{g.assignedAuthority?.designation}</div>
                      <div className="text-gray-400 truncate max-w-[180px]">{g.assignedAuthority?.officeName}</div>
                    </td>
                    <td className="py-4">
                      {g.status === "RESOLVED" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-success-600 font-medium">
                          <CheckCircleIcon className="size-4" /> Completed
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-error-50 px-2 py-0.5 text-xs font-bold text-error-600 dark:bg-error-500/15 dark:text-error-400">
                          <AlertIcon className="size-3.5" /> Overdue (Level {g.sla.escalationLevel})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-600">
                          <TimeIcon className="size-3.5" /> {g.sla.daysRemaining} days left
                        </span>
                      )}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${
                          g.status === "RESOLVED"
                            ? "bg-success-100 text-success-800 dark:bg-success-500/15 dark:text-success-400"
                            : g.status === "HANGED"
                            ? "bg-error-100 text-error-800 dark:bg-error-500/15 dark:text-error-400"
                            : g.status === "IN_PROGRESS"
                            ? "bg-brand-100 text-brand-800 dark:bg-brand-500/15 dark:text-brand-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {g.status}
                      </span>
                    </td>
                    <td className="py-4 text-end">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setSelectedGrievance(g)}
                          className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          Details
                        </button>
                        {g.status !== "RESOLVED" && !g.physicalReceiptUrl && (
                          <button
                            onClick={() => {
                              setSelectedGrievance(g);
                              setIsReceiptModalOpen(true);
                            }}
                            className="rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600 hover:bg-orange-100 dark:bg-orange-500/15 dark:text-orange-400"
                          >
                            + Stamped Receipt
                          </button>
                        )}
                        {["IN_PROGRESS", "UNDER_INSPECTION"].includes(g.status) && (
                          <button
                            onClick={() => {
                              setSelectedGrievance(g);
                              setIsVerifyModalOpen(true);
                            }}
                            className="rounded-lg bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-600 hover:bg-success-100 dark:bg-success-500/15 dark:text-success-400"
                          >
                            Verify Work
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: VOICE SPEECH-TO-TEXT GRIEVANCE FILING WIZARD */}
      {/* ========================================================================= */}
      {isNewGrievanceOpen && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsNewGrievanceOpen(false)}
              className="absolute top-5 end-5 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
            >
              <CloseIcon className="size-5" />
            </button>

            {/* Stepper indicator */}
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
              <span className={`text-xs font-bold ${step === 1 ? "text-brand-600" : "text-gray-400"}`}>
                1. Voice / Audio Note
              </span>
              <span className="text-gray-300">→</span>
              <span className={`text-xs font-bold ${step === 2 ? "text-brand-600" : "text-gray-400"}`}>
                2. Details & Photo
              </span>
              <span className="text-gray-300">→</span>
              <span className={`text-xs font-bold ${step === 3 ? "text-brand-600" : "text-gray-400"}`}>
                3. Letterhead Preview
              </span>
              <span className="text-gray-300">→</span>
              <span className={`text-xs font-bold ${step === 4 ? "text-brand-600" : "text-gray-400"}`}>
                4. Dispatched
              </span>
            </div>

            {/* Step 1: Voice Recording */}
            {step === 1 && (
              <div className="text-center py-6">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  <AudioIcon className="size-10" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  बोलकर समस्या दर्ज करें (Record Voice Grievance)
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  अपनी मातृभाषा (हिंदी / ਪੰਜਾਬੀ / English) में विद्यालय की समस्या बोलें। हमारा AI सिस्टम इसे औपचारिक सरकारी पत्र में परिवर्तित करेगा।
                </p>

                <div className="my-6">
                  {isRecording ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-1.5 text-error-600 font-bold text-sm animate-pulse">
                        <span className="size-3 rounded-full bg-error-500" /> Recording: {recordingSeconds}s
                      </div>
                      <div className="flex items-center gap-1 h-8">
                        {[40, 70, 30, 90, 60, 80, 40, 100, 50, 75, 45].map((h, i) => (
                          <div
                            key={i}
                            className="w-1.5 bg-brand-500 rounded-full animate-bounce"
                            style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                          />
                        ))}
                      </div>
                      <button
                        onClick={handleStopRecording}
                        className="rounded-xl bg-error-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-error-700"
                      >
                        ⏹️ Stop & Process Audio
                      </button>
                    </div>
                  ) : isProcessingAudio ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <div className="size-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Analyzing audio waveform & extracting grievance parameters...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        onClick={handleStartRecording}
                        className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600 transition"
                      >
                        🎙️ Start Voice Recording
                      </button>
                      <button
                        onClick={() => {
                          setTranscription("स्कूल में पीने के पानी की टंकी पिछले 2 महीने से टूटी है और नलों में पानी नहीं आ रहा।");
                          setFacilityAffected("पीने के पानी की टंकी व नल");
                          setProblemDescription("टंकी टूटी है और नलों में पानी नहीं आ रहा");
                          setDurationOfIssue("2 महीने से");
                          setStep(2);
                        }}
                        className="rounded-xl border border-gray-300 px-4 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        Type Text Instead / Skip Voice
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Form Variables & Photos */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  समस्या विवरण व श्रेणी (Grievance Parameters)
                </h3>

                {transcription && (
                  <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3 text-xs text-brand-900 dark:border-brand-900/50 dark:bg-brand-950/20 dark:text-brand-200">
                    <span className="font-bold">AI Transcribed Voice:</span> &quot;{transcription}&quot;
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      समस्या श्रेणी (Category)
                    </label>
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-medium dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.categoryName} ({c.defaultSlaDays} Days SLA)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      प्राथमिकता (Priority Level)
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-medium dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="CRITICAL">🚨 Critical (Safety Risk)</option>
                      <option value="HIGH">⚠️ High (RTE Norms)</option>
                      <option value="MEDIUM">⏳ Medium (Routine Repair)</option>
                      <option value="LOW">ℹ️ Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    प्रभावित सुविधा (Facility Affected)
                  </label>
                  <input
                    type="text"
                    value={facilityAffected}
                    onChange={(e) => setFacilityAffected(e.target.value)}
                    placeholder="उदा. पीने के पानी की 1000L टंकी"
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    विस्तृत समस्या (Specific Problem)
                  </label>
                  <textarea
                    rows={2}
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                    placeholder="समस्या का स्पष्ट विवरण लिखें..."
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      समस्या की अवधि (Duration)
                    </label>
                    <input
                      type="text"
                      value={durationOfIssue}
                      onChange={(e) => setDurationOfIssue(e.target.value)}
                      placeholder="उदा. 2 महीने से"
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      मौका तस्वीर URL (Photo Evidence)
                    </label>
                    <input
                      type="text"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => setStep(1)}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleGeneratePreview}
                    className="rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white hover:bg-brand-600 shadow-sm"
                  >
                    Generate Official Letterhead →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Formal Administrative Letterhead Preview */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    औपचारिक प्रशासनिक पत्र पूर्वावलोकन (Official Letter Preview)
                  </h3>
                  <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                    RTE Act 2009 Standards
                  </span>
                </div>

                <div className="rounded-xl border border-gray-300 bg-amber-50/20 p-4 font-mono text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-200 space-y-2 whitespace-pre-wrap">
                  <div className="font-bold border-b border-gray-200 pb-2 dark:border-gray-700">
                    {previewSubject}
                  </div>
                  <div>{previewLetter}</div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => setStep(2)}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300"
                  >
                    Edit Details
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={handleFinalSubmit}
                    className="rounded-xl bg-success-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-success-700 shadow-md flex items-center gap-2"
                  >
                    {isSubmitting ? "Dispatching..." : "🚀 Sign & Dispatch to Government Authority"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Success Confirmation */}
            {step === 4 && submittedGrievance && (
              <div className="text-center py-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400">
                  <CheckCircleIcon className="size-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  शिकायत सफलतापूर्वक दर्ज व प्रेषित!
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Official ticket generated and digital notice dispatched to responsible executive officer.
                </p>

                <div className="my-5 rounded-2xl border border-success-200 bg-success-50/40 p-4 text-start dark:border-success-900/50 dark:bg-success-950/20 max-w-md mx-auto">
                  <div className="flex justify-between text-xs py-1">
                    <span className="font-semibold text-gray-500">Ticket Number:</span>
                    <span className="font-mono font-bold text-brand-600">{submittedGrievance.ticketNumber}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1">
                    <span className="font-semibold text-gray-500">Assigned Authority:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{submittedGrievance.assignedAuthority?.designation}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1">
                    <span className="font-semibold text-gray-500">SLA Resolution Target:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{submittedGrievance.sla.slaDays} Days ({submittedGrievance.sla.deadline.split("T")[0]})</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={submittedGrievance.letterPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300"
                  >
                    <DownloadIcon className="size-4" /> Download Official PDF Letter
                  </a>
                  <button
                    onClick={() => {
                      setIsNewGrievanceOpen(false);
                      setStep(1);
                    }}
                    className="rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-600"
                  >
                    Done & Return to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: UPLOAD STAMPED PHYSICAL RECEIPT */}
      {/* ========================================================================= */}
      {isReceiptModalOpen && selectedGrievance && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setIsReceiptModalOpen(false)}
              className="absolute top-5 end-5 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <CloseIcon className="size-5" />
            </button>

            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              सरकारी पावती अपलोड करें (Upload Stamped Receipt)
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              सरकारी कार्यालय (BEO/DEO/PWD) से प्राप्त मुहर लगी पावती की फोटो एवं डायरी नंबर दर्ज करें।
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  कार्यालय डायरी नंबर (Diary / Receipt No.)
                </label>
                <input
                  type="text"
                  placeholder="उदा. DIARY/2026/PWD/894"
                  value={diaryNumber}
                  onChange={(e) => setDiaryNumber(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  पावती फोटो URL (Stamped Receipt Photo)
                </label>
                <input
                  type="text"
                  value={receiptPhoto}
                  onChange={(e) => setReceiptPhoto(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadReceiptSubmit}
                  className="rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white hover:bg-orange-700 shadow-sm"
                >
                  Save & Update Status to Acknowledged
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: GROUND VERIFICATION */}
      {/* ========================================================================= */}
      {isVerifyModalOpen && selectedGrievance && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setIsVerifyModalOpen(false)}
              className="absolute top-5 end-5 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <CloseIcon className="size-5" />
            </button>

            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              SMC जमीनी सत्यापन (Ground Verification)
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              सत्यापित करें कि क्या कार्य विद्यालय परिसर में संतोषजनक ढंग से पूर्ण हो चुका है।
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsSatisfied(true)}
                  className={`flex-1 rounded-xl p-3 border text-xs font-bold transition ${
                    isSatisfied
                      ? "border-success-500 bg-success-50 text-success-800 dark:bg-success-950/30 dark:text-success-300"
                      : "border-gray-200 text-gray-600 dark:border-gray-700"
                  }`}
                >
                  ✅ कार्य पूर्ण व संतोषजनक (Satisfied)
                </button>
                <button
                  type="button"
                  onClick={() => setIsSatisfied(false)}
                  className={`flex-1 rounded-xl p-3 border text-xs font-bold transition ${
                    !isSatisfied
                      ? "border-error-500 bg-error-50 text-error-800 dark:bg-error-950/30 dark:text-error-300"
                      : "border-gray-200 text-gray-600 dark:border-gray-700"
                  }`}
                >
                  ❌ कार्य अपूर्ण / असंतोषजनक (Reopen)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  टिप्पणी / कारण (Verification Remarks)
                </label>
                <textarea
                  rows={3}
                  value={verificationFeedback}
                  onChange={(e) => setVerificationFeedback(e.target.value)}
                  placeholder={
                    isSatisfied
                      ? "उदा. नए नल व पाइपलाइन कार्य पूर्ण हो चुकी है।"
                      : "उदा. अभी भी 2 नलों में पानी नहीं आ रहा है, काम अधूरा छोड़ा गया।"
                  }
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  onClick={() => setIsVerifyModalOpen(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifySubmit}
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-sm ${
                    isSatisfied ? "bg-success-600 hover:bg-success-700" : "bg-error-600 hover:bg-error-700"
                  }`}
                >
                  {isSatisfied ? "Confirm & Mark Resolved" : "Reject & Reopen Grievance"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: FULL GRIEVANCE DETAILS & TIMELINE */}
      {/* ========================================================================= */}
      {selectedGrievance && !isReceiptModalOpen && !isVerifyModalOpen && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedGrievance(null)}
              className="absolute top-5 end-5 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <CloseIcon className="size-5" />
            </button>

            <div className="flex items-center gap-3">
              <span className="font-mono text-base font-bold text-brand-600 dark:text-brand-400">
                {selectedGrievance.ticketNumber}
              </span>
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                {selectedGrievance.status}
              </span>
            </div>

            <h3 className="mt-2 text-base font-bold text-gray-900 dark:text-white">
              {selectedGrievance.subject}
            </h3>

            {/* SLA Alert Box */}
            <div className="my-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs dark:border-gray-800 dark:bg-gray-800/50">
              <div className="flex justify-between font-semibold">
                <span>SLA Target: {selectedGrievance.sla.slaDays} Days</span>
                <span className={selectedGrievance.sla.isHanged ? "text-error-600" : "text-brand-600"}>
                  {selectedGrievance.sla.isHanged ? "BREACHED / HANGED" : `${selectedGrievance.sla.daysRemaining} days remaining`}
                </span>
              </div>
              <p className="mt-1 text-gray-500">
                Assigned: {selectedGrievance.assignedAuthority?.designation} ({selectedGrievance.assignedAuthority?.officialEmail})
              </p>
            </div>

            {/* Attachments */}
            {selectedGrievance.attachments.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Attached Photos & Receipts:</p>
                <div className="flex gap-2 overflow-x-auto">
                  {selectedGrievance.attachments.map((att) => (
                    <a key={att.id} href={att.fileUrl} target="_blank" rel="noreferrer" className="shrink-0">
                      <img src={att.fileUrl} alt={att.caption || "evidence"} className="h-20 w-28 object-cover rounded-lg border border-gray-200" />
                      <span className="text-[10px] text-gray-500 block truncate max-w-[110px]">{att.caption}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline Events */}
            <div>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Audit Timeline Trail:</p>
              <div className="space-y-3 border-s-2 border-brand-200 ps-4 ms-2 dark:border-brand-900">
                {selectedGrievance.timeline.map((evt) => (
                  <div key={evt.id} className="relative text-xs">
                    <span className="absolute -start-[21px] top-1 size-2 rounded-full bg-brand-500" />
                    <div className="flex justify-between font-semibold text-gray-800 dark:text-gray-200">
                      <span>{evt.eventType.replace(/_/g, " ")}</span>
                      <span className="text-[10px] text-gray-400">{evt.timestamp.split("T")[0]}</span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">{evt.comment}</p>
                    {evt.performedBy && <p className="text-[10px] text-gray-400">By: {evt.performedBy}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedGrievance(null)}
                className="rounded-xl bg-gray-100 px-5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
