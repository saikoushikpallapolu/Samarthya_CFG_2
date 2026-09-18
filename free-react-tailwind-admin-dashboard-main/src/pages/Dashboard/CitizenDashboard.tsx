import { useState, useEffect } from "react";
import PageMeta from "@/components/common/PageMeta";
import {
  apiGetPublicDashboardStats,
  apiGetPublicGrievances,
  apiUpvoteGrievance,
  apiGenerateSocialPost,
  apiSearchSchools,
  apiGetNearbySchools,
  apiJoinSmcCommittee,
} from "@/services/api";
import type { Grievance, PublicDashboardStats, School } from "@/types/samarthya";
import { CheckCircleIcon, CloseIcon } from "@/icons";

export default function CitizenDashboard() {
  const [stats, setStats] = useState<PublicDashboardStats | null>(null);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"FEED" | "FIND_SCHOOLS">("FEED");
  const [isLoading, setIsLoading] = useState(true);

  // Social Share modal
  const [shareGrievance, setShareGrievance] = useState<Grievance | null>(null);
  const [sharePlatform, setSharePlatform] = useState<"TWITTER_X" | "WHATSAPP" | "FACEBOOK">("TWITTER_X");
  const [copied, setCopied] = useState(false);

  // Join SMC modal
  const [joinSchool, setJoinSchool] = useState<School | null>(null);
  const [designation, setDesignation] = useState("PARENT_MEMBER");
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("Class 6-B");
  const [joinedSuccess, setJoinedSuccess] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const s = await apiGetPublicDashboardStats();
      setStats(s);
      const list = await apiGetPublicGrievances(searchQuery, selectedCategory);
      setGrievances(list);
      const schRes = await apiSearchSchools();
      setSchools(schRes.schools);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedCategory]);

  const handleUpvote = async (gId: string) => {
    const res = await apiUpvoteGrievance(gId);
    setGrievances((prev) =>
      prev.map((g) => (g.id === gId ? { ...g, upvotesCount: res.newUpvoteCount, hasUserUpvoted: true } : g))
    );
  };

  const handleNearbyLocate = async () => {
    setIsLoading(true);
    try {
      const nearby = await apiGetNearbySchools(28.6698, 77.2689, 15);
      setSchools(nearby);
      setActiveTab("FIND_SCHOOLS");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSmcSubmit = async () => {
    if (!joinSchool) return;
    await apiJoinSmcCommittee(joinSchool.id, designation, studentName, studentClass);
    setJoinedSuccess(true);
    setTimeout(() => {
      setJoinedSuccess(false);
      setJoinSchool(null);
    }, 2000);
  };

  const socialPost = shareGrievance ? apiGenerateSocialPost(shareGrievance, sharePlatform) : null;

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
        title="Public Transparency Portal | Samarthya"
        description="Public Citizen Grievance Transparency, School Locator, Upvoting & Social Advocacy"
      />

      {/* Hero Banner */}
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-900 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10 max-w-3xl">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            🇮🇳 Citizen Public School Transparency Portal
          </span>
          <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">
            प्रत्येक सरकारी स्कूल में स्वच्छ जल, शौचालय व सुरक्षा का अधिकार
          </h1>
          <p className="mt-2 text-sm text-brand-100 max-w-2xl">
            Track official government resolutions, support community schools with your vote, locate nearby institutions, and amplify critical infrastructural bottlenecks through social advocacy.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab("FEED")}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs ${
                activeTab === "FEED" ? "bg-white text-brand-700 font-extrabold" : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              📢 Public Grievance Feed & Upvote
            </button>
            <button
              onClick={() => setActiveTab("FIND_SCHOOLS")}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs ${
                activeTab === "FIND_SCHOOLS" ? "bg-white text-brand-700 font-extrabold" : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              🔍 Search & Locate Schools (GPS)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Schools Empowered</p>
          <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
            {stats?.totalSchoolsEmpowered.toLocaleString()}
          </h3>
          <span className="text-[11px] text-brand-600">Across 4 States</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Resolution Rate</p>
          <h3 className="mt-1 text-xl font-bold text-success-600 dark:text-success-400">
            {stats?.resolutionRatePercentage}%
          </h3>
          <span className="text-[11px] text-success-500">Government Redressed</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Grievances Filed</p>
          <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
            {stats?.totalGrievancesFiled.toLocaleString()}
          </h3>
          <span className="text-[11px] text-gray-400">Digital + Physical</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg Resolution Speed</p>
          <h3 className="mt-1 text-xl font-bold text-brand-600 dark:text-brand-400">
            {stats?.averageResolutionDays} Days
          </h3>
          <span className="text-[11px] text-brand-500">Time to repair</span>
        </div>
      </div>

      {/* MAIN VIEW: FEED TAB */}
      {activeTab === "FEED" && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search grievance ticket, school name, district..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-xs font-semibold text-gray-500">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white p-2 text-xs font-medium dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="ALL">All Categories (सभी श्रेणियां)</option>
                  <option value="WATER_SANITATION">Drinking Water (पेयजल)</option>
                  <option value="TOILET_REPAIR">Toilet Facilities (शौचालय)</option>
                  <option value="BUILDING_INFRA">Building & Wall (भवन)</option>
                  <option value="ELECTRICITY_POWER">Electricity & Fans (बिजली)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grievance Feed Cards */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {grievances.map((g) => {
              const hasUpvoted = g.hasUserUpvoted;
              const isHanged = g.sla.isHanged || g.status === "HANGED";

              return (
                <div
                  key={g.id}
                  className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 hover:shadow-md transition"
                >
                  <div>
                    {/* Header: School & Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                          {g.ticketNumber}
                        </span>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                          {g.school?.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          📍 {g.school?.district} • {g.category?.name}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          g.status === "RESOLVED"
                            ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
                            : isHanged
                            ? "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400"
                            : "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400"
                        }`}
                      >
                        {g.status}
                      </span>
                    </div>

                    {/* Problem Statement */}
                    <p className="mt-3 text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                      {g.subject}
                    </p>

                    {/* Attachment Preview thumbnail if available */}
                    {g.attachments.length > 0 && (
                      <div className="mt-3">
                        <img
                          src={g.attachments[0].fileUrl}
                          alt="Grievance photo"
                          className="h-36 w-full rounded-xl object-cover border border-gray-100 dark:border-gray-800"
                        />
                      </div>
                    )}

                    {/* Assigned Office Info */}
                    <div className="mt-3 rounded-xl bg-gray-50 p-2.5 text-[11px] text-gray-600 dark:bg-gray-800/50 dark:text-gray-400">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">Official Responsibility: </span>
                      {g.assignedAuthority?.designation} • {g.assignedAuthority?.officeName}
                    </div>
                  </div>

                  {/* Actions & Upvote */}
                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                    <button
                      onClick={() => handleUpvote(g.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        hasUpvoted
                          ? "bg-brand-500 text-white shadow-xs"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      <span>▲ Upvote</span>
                      <span className="rounded-md bg-black/10 px-1.5 py-0.2 text-[10px]">
                        {g.upvotesCount}
                      </span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setShareGrievance(g);
                          setSharePlatform("TWITTER_X");
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-blue-light-50 px-3 py-1.5 text-xs font-semibold text-blue-light-700 hover:bg-blue-light-100 dark:bg-blue-light-500/15 dark:text-blue-light-400"
                      >
                        <span>📢 Social Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MAIN VIEW: FIND SCHOOLS TAB */}
      {activeTab === "FIND_SCHOOLS" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Explore Public Schools & SMC Committees
                </h2>
                <p className="text-xs text-gray-500">
                  Search by PIN code, UDISE code, or click GPS locator to discover schools near you
                </p>
              </div>

              <button
                onClick={handleNearbyLocate}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-600 shadow-xs"
              >
                📍 Find Nearby Schools (GPS)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {schools.map((sch) => (
              <div
                key={sch.id}
                className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs text-brand-600 font-bold">{sch.udiseCode}</span>
                    {sch.distanceKm && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {sch.distanceKm} km away
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                    {sch.schoolName}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    📍 {sch.villageOrWard}, {sch.district}, {sch.state} • PIN: {sch.pincode}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Enrolled: {sch.totalStudentsEnrolled} Students • Category: {sch.category}
                  </p>

                  <div className="mt-3 flex gap-2 text-center text-xs">
                    <div className="flex-1 rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                      <span className="block font-bold text-gray-900 dark:text-white">{sch.totalGrievancesCount}</span>
                      <span className="text-[10px] text-gray-400">Total Grievances</span>
                    </div>
                    <div className="flex-1 rounded-lg bg-success-50 p-2 dark:bg-success-950/20">
                      <span className="block font-bold text-success-600">{sch.resolvedGrievancesCount}</span>
                      <span className="text-[10px] text-success-600">Resolved</span>
                    </div>
                    <div className="flex-1 rounded-lg bg-error-50 p-2 dark:bg-error-950/20">
                      <span className="block font-bold text-error-600">{sch.hangedGrievancesCount}</span>
                      <span className="text-[10px] text-error-600">Hanged</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                  <button
                    onClick={() => setJoinSchool(sch)}
                    className="w-full rounded-xl bg-brand-500 py-2 text-xs font-bold text-white hover:bg-brand-600 transition"
                  >
                    🤝 Join School Management Committee (SMC)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SOCIAL MEDIA ADVOCACY GENERATOR */}
      {/* ========================================================================= */}
      {shareGrievance && socialPost && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setShareGrievance(null)}
              className="absolute top-5 end-5 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <CloseIcon className="size-5" />
            </button>

            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              जन-जागरूकता व सोशल मीडिया अपील (Social Advocacy)
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              इस समस्या को उच्च अधिकारियों एवं सोशल मीडिया पर शेयर कर त्वरित कार्रवाई सुनिश्चित करें।
            </p>

            <div className="my-4 flex gap-2">
              <button
                onClick={() => setSharePlatform("TWITTER_X")}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                  sharePlatform === "TWITTER_X"
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                𝕏 Twitter / X
              </button>
              <button
                onClick={() => setSharePlatform("WHATSAPP")}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                  sharePlatform === "WHATSAPP"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                💬 WhatsApp
              </button>
              <button
                onClick={() => setSharePlatform("FACEBOOK")}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                  sharePlatform === "FACEBOOK"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                📘 Facebook
              </button>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-xs text-gray-800 whitespace-pre-wrap dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 font-mono">
              {socialPost.postText}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                Tagged Handles: {socialPost.taggedHandles.join(" ")}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(socialPost.postText);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="text-xs text-brand-600 font-semibold hover:underline"
              >
                {copied ? "Copied!" : "Copy Text"}
              </button>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShareGrievance(null)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300"
              >
                Close
              </button>
              <a
                href={socialPost.shareUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white hover:bg-brand-600 shadow-xs inline-flex items-center gap-1.5"
              >
                <span>🚀 Share Live Now</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: JOIN SMC COMMITTEE */}
      {/* ========================================================================= */}
      {joinSchool && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setJoinSchool(null)}
              className="absolute top-5 end-5 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <CloseIcon className="size-5" />
            </button>

            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Join SMC: {joinSchool.schoolName}
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Apply to join the official School Management Committee under RTE Section 21
            </p>

            {joinedSuccess ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-50 text-success-600">
                  <CheckCircleIcon className="size-8" />
                </div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  SMC Membership Enrolled!
                </h4>
                <p className="mt-1 text-xs text-gray-500">
                  You are now registered for this school committee.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Designation (पद)
                  </label>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="PARENT_MEMBER">अभिभावक सदस्य (Parent Member)</option>
                    <option value="COMMUNITY_VOLUNTEER">सामुदायिक प्रतिनिधि (Community Volunteer)</option>
                    <option value="PANCHAYAT_REPRESENTATIVE">पंचायत सदस्य (Panchayat Rep)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    विद्यार्थी का नाम (Student Name)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. राहुल वर्मा"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    कक्षा (Class)
                  </label>
                  <input
                    type="text"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    onClick={() => setJoinSchool(null)}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleJoinSmcSubmit}
                    className="rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white hover:bg-brand-600 shadow-xs"
                  >
                    Register as Member
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
