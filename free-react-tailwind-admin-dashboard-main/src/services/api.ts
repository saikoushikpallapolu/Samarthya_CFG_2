/**
 * Samarthya Civic Tech Platform - Production Backend API Client Layer
 * Connected to live Node.js / Express & PostgreSQL (Neon) Backend
 */

import type {
  Grievance,
  School,
  GrievanceCategory,
  Department,
  GovernmentAuthority,
  GrievanceTemplate,
  PublicDashboardStats,
  BottleneckAnalytics,
  AudioProcessingResult,
  User,
  UserRole,
  SupportedLanguage,
} from "../types/samarthya";

// Base URL for API endpoints. In Vite dev, requests starting with /api/v1 are proxied to http://localhost:8000
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "samarthya_access_token",
  REFRESH_TOKEN: "samarthya_refresh_token",
  CURRENT_USER: "samarthya_current_user",
  UPVOTES: "samarthya_upvoted_ids",
};

/**
 * Standard fetch wrapper with automatic JWT authorization and error extraction
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle CSV export or non-json responses
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("text/csv")) {
    const text = await response.text();
    if (!response.ok) throw new Error(text || "Failed to download CSV");
    return text as unknown as T;
  }

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      json.message ||
      json.errors?.[0] ||
      `HTTP Request Failed (${response.status} ${response.statusText})`;
    throw new Error(message);
  }

  return (json.data !== undefined ? json.data : json) as T;
}

const getUpvotedIds = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.UPVOTES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(e);
  }
  return [];
};

const saveUpvotedId = (id: string) => {
  const ids = getUpvotedIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(STORAGE_KEYS.UPVOTES, JSON.stringify(ids));
  }
};

/**
 * =====================================================================
 * MODULE 1: AUTHENTICATION & USER PROFILE
 * =====================================================================
 */

export const apiRequestOtp = async (
  phoneNumber: string,
  language: SupportedLanguage = "hi"
): Promise<{ success: boolean; testOtp: string; message: string }> => {
  const data = await apiFetch<{
    phoneNumber: string;
    expiresInSeconds: number;
    resendCooldownSeconds: number;
    testOtp?: string;
  }>("/auth/request-otp", {
    method: "POST",
    body: JSON.stringify({ phoneNumber, language }),
  });

  return {
    success: true,
    testOtp: data.testOtp || "459123",
    message: `OTP sent successfully to ${data.phoneNumber}. ${
      data.testOtp ? `(Dev Code: ${data.testOtp})` : ""
    }`,
  };
};

export const apiVerifyOtp = async (
  phoneNumber: string,
  otp: string,
  role?: UserRole,
  fullName?: string,
  preferredLanguage?: SupportedLanguage
): Promise<{ accessToken: string; user: User }> => {
  const data = await apiFetch<{
    accessToken: string;
    refreshToken: string;
    user: User;
  }>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({
      phoneNumber,
      otp,
      role,
      fullName,
      preferredLanguage,
    }),
  });

  if (data.accessToken) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
  }
  if (data.refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
  }
  if (data.user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.user));
  }

  return { accessToken: data.accessToken, user: data.user };
};

export const apiGetCurrentUser = async (): Promise<User> => {
  const user = await apiFetch<User>("/auth/me");
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  return user;
};

export const apiUpdateLanguage = async (
  language: SupportedLanguage
): Promise<boolean> => {
  await apiFetch("/auth/language", {
    method: "PUT",
    body: JSON.stringify({ preferredLanguage: language }),
  });
  return true;
};

export const apiLogout = async (): Promise<boolean> => {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch (e) {
    console.warn("Backend logout notification failed", e);
  } finally {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
  return true;
};

/**
 * =====================================================================
 * MODULE 2: SCHOOL DISCOVERY & CITIZEN SMC
 * =====================================================================
 */

export const apiSearchSchools = async (
  query?: string,
  state?: string,
  district?: string,
  block?: string,
  page = 1,
  limit = 20
): Promise<{
  schools: School[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const params = new URLSearchParams();
  if (query) params.append("query", query);
  if (state) params.append("state", state);
  if (district) params.append("district", district);
  if (block) params.append("block", block);
  params.append("page", String(page));
  params.append("limit", String(limit));

  const data = await apiFetch<{
    schools: School[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/schools/search?${params.toString()}`);

  return data;
};

export const apiGetNearbySchools = async (
  latitude: number,
  longitude: number,
  radiusKm = 10,
  limit = 10
): Promise<School[]> => {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    radiusKm: String(radiusKm),
    limit: String(limit),
  });

  const data = await apiFetch<School[]>(`/schools/nearby?${params.toString()}`);
  return data;
};

export const apiGetSchoolById = async (schoolId: string): Promise<School> => {
  const data = await apiFetch<{ school: School } | School>(`/schools/${schoolId}`);
  if ("school" in data && data.school) {
    return data.school;
  }
  return data as School;
};

export const apiJoinSmcCommittee = async (
  schoolId: string,
  designation: string,
  studentChildName?: string,
  studentChildGrade?: string
): Promise<any> => {
  const data = await apiFetch(`/schools/${schoolId}/join-smc`, {
    method: "POST",
    body: JSON.stringify({
      designation,
      studentChildName,
      studentChildGrade,
    }),
  });
  return data;
};

/**
 * =====================================================================
 * MODULE 3: MASTER DATA & DIRECTORY
 * =====================================================================
 */

export const apiGetCategories = async (
  language: SupportedLanguage = "hi"
): Promise<GrievanceCategory[]> => {
  const data = await apiFetch<GrievanceCategory[]>(`/categories?language=${language}`);
  return data;
};

export const apiGetDepartments = async (): Promise<Department[]> => {
  const data = await apiFetch<Department[]>("/departments");
  return data;
};

export const apiGetAuthorities = async (
  state?: string,
  district?: string,
  departmentId?: string
): Promise<GovernmentAuthority[]> => {
  const params = new URLSearchParams();
  if (state) params.append("state", state);
  if (district) params.append("district", district);
  if (departmentId) params.append("departmentId", departmentId);

  const query = params.toString();
  const data = await apiFetch<GovernmentAuthority[]>(
    `/authorities${query ? `?${query}` : ""}`
  );
  return data;
};

/**
 * =====================================================================
 * MODULE 4: SPEECH-TO-TEXT & TEMPLATE ENGINE
 * =====================================================================
 */

export const apiProcessAudio = async (
  audioFile?: File | Blob,
  languageHint: SupportedLanguage = "hi",
  categoryId?: string
): Promise<AudioProcessingResult> => {
  const formData = new FormData();
  if (audioFile) {
    formData.append("audio", audioFile, "voice_recording.webm");
  } else {
    // Development fallback mock blob if no physical mic recording provided
    const dummyBlob = new Blob(["dummy audio bytes"], { type: "audio/webm" });
    formData.append("audio", dummyBlob, "sample.webm");
  }

  formData.append("languageHint", languageHint);
  if (categoryId) formData.append("categoryId", categoryId);

  const data = await apiFetch<AudioProcessingResult>("/voice/process-audio", {
    method: "POST",
    body: formData,
  });

  return data;
};

export const apiGetTemplateByCategory = async (
  categoryId: string,
  language: SupportedLanguage = "hi"
): Promise<GrievanceTemplate> => {
  const data = await apiFetch<GrievanceTemplate>(
    `/templates/category/${categoryId}?language=${language}`
  );
  return data;
};

export const apiPreviewLetter = async (
  templateId: string,
  schoolId: string,
  dynamicFieldValues: Record<string, string>,
  language = "hi"
): Promise<{
  renderedSubject: string;
  renderedMarkdown: string;
  assignedAuthority: GovernmentAuthority;
}> => {
  const data = await apiFetch<{
    renderedSubject: string;
    renderedMarkdown: string;
    assignedAuthority: GovernmentAuthority;
  }>("/templates/preview-letter", {
    method: "POST",
    body: JSON.stringify({
      templateId,
      schoolId,
      dynamicFieldValues,
      language,
    }),
  });

  return data;
};

/**
 * =====================================================================
 * MODULE 5: GRIEVANCE LIFECYCLE
 * =====================================================================
 */

export const apiSubmitGrievance = async (payload: {
  schoolId: string;
  categoryId: string;
  templateId?: string;
  submissionChannel?: "DIGITAL_DISPATCH" | "PHYSICAL_RECEIPT" | "HYBRID";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dynamicFieldValues?: Record<string, string>;
  audioRecordingUrl?: string;
  audioTranscriptionRaw?: string;
  photoAttachmentUrls?: string[];
}): Promise<Grievance> => {
  const data = await apiFetch<any>("/grievances", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  // Fetch full detailed object
  const grievanceId = data.id || data.ticketNumber;
  return await apiGetGrievanceById(grievanceId);
};

export const apiGetGrievanceById = async (
  idOrTicket: string
): Promise<Grievance> => {
  const data = await apiFetch<Grievance>(`/grievances/${idOrTicket}`);
  return data;
};

export const apiGetGrievancesBySchool = async (
  schoolId: string,
  status?: string
): Promise<Grievance[]> => {
  const params = new URLSearchParams();
  if (status && status !== "ALL") params.append("status", status);

  const query = params.toString();
  const data = await apiFetch<{
    grievances: any[];
    total: number;
    page: number;
    limit: number;
  }>(`/grievances/my-school/${schoolId}${query ? `?${query}` : ""}`);

  const rows = data.grievances || [];
  return rows.map((g) => ({
    id: g.id,
    ticketNumber: g.ticketNumber,
    schoolId: schoolId,
    school: {
      id: schoolId,
      name: "",
      udise: "",
      district: "",
    },
    categoryId: "",
    category: {
      id: "",
      code: "",
      name: g.categoryName || "Infrastructure",
    },
    subject: g.subject || `${g.categoryName} issue at school`,
    status: g.status,
    priority: g.priority || "HIGH",
    submissionChannel: "HYBRID",
    sla: {
      slaDays: 10,
      deadline: g.slaDeadline || "",
      isHanged: Boolean(g.isHanged),
      isBreached: Boolean(g.isHanged),
      daysRemaining: 0,
      escalationLevel: 1,
    },
    attachments: [],
    timeline: [],
    upvotesCount: g.upvotesCount || 0,
    hasUserUpvoted: false,
    createdAt: g.createdAt,
  }));
};

export const apiUploadPhysicalAck = async (
  grievanceId: string,
  receiptPhoto: File | Blob,
  diaryNumber: string,
  submittedAtDate: string
): Promise<Grievance> => {
  const formData = new FormData();
  formData.append("receiptPhoto", receiptPhoto);
  formData.append("diaryNumber", diaryNumber);
  formData.append("submissionDate", submittedAtDate);

  const data = await apiFetch<Grievance>(
    `/grievances/${grievanceId}/upload-physical-ack`,
    {
      method: "POST",
      body: formData,
    }
  );

  return data;
};

export const apiVerifyResolution = async (
  grievanceId: string,
  isSatisfied: boolean,
  remarks: string
): Promise<Grievance> => {
  const data = await apiFetch<Grievance>(
    `/grievances/${grievanceId}/verify-resolution`,
    {
      method: "POST",
      body: JSON.stringify({
        isSatisfied,
        verificationRemarks: remarks,
        satisfactionScore: isSatisfied ? 5 : 2,
      }),
    }
  );

  return data;
};

export const apiReopenGrievance = async (
  grievanceId: string,
  reason: string
): Promise<Grievance> => {
  const data = await apiFetch<Grievance>(`/grievances/${grievanceId}/reopen`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  return data;
};

export const apiEscalateGrievance = async (
  grievanceId: string,
  reason: string
): Promise<Grievance> => {
  const data = await apiFetch<Grievance>(
    `/grievances/${grievanceId}/escalate`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    }
  );
  return data;
};

/**
 * =====================================================================
 * MODULE 6: GOVERNMENT AUTHORITY 1-CLICK MAGIC LINK ACTION
 * =====================================================================
 */

export const apiGetAuthorityGrievanceByToken = async (
  actionToken: string
): Promise<Grievance> => {
  const data = await apiFetch<Grievance>(`/authority/grievances/${actionToken}`);
  return data;
};

export const apiAcknowledgeByToken = async (
  actionToken: string,
  notes?: string,
  expectedResolutionDays?: number | string
): Promise<Grievance> => {
  const data = await apiFetch<Grievance>(
    `/authority/grievances/${actionToken}/acknowledge`,
    {
      method: "POST",
      body: JSON.stringify({
        notes,
        expectedResolutionDays: Number(expectedResolutionDays) || 10,
      }),
    }
  );
  return data;
};

export const apiUpdateStatusByToken = async (
  actionToken: string,
  newStatus: string,
  officerComment: string,
  workOrderNumber?: string,
  workOrderAmount?: number | string
): Promise<Grievance> => {
  const data = await apiFetch<Grievance>(
    `/authority/grievances/${actionToken}/update-status`,
    {
      method: "POST",
      body: JSON.stringify({
        newStatus,
        officerComment,
        workOrderNumber,
        workOrderAmount: workOrderAmount ? Number(workOrderAmount) : undefined,
      }),
    }
  );
  return data;
};

export const apiForwardByToken = async (
  actionToken: string,
  targetDepartmentId: string,
  forwardReason: string
): Promise<Grievance> => {
  const data = await apiFetch<Grievance>(
    `/authority/grievances/${actionToken}/forward`,
    {
      method: "POST",
      body: JSON.stringify({
        targetDepartmentId,
        forwardReason,
      }),
    }
  );
  return data;
};

/**
 * =====================================================================
 * MODULE 8: PUBLIC TRANSPARENCY & CITIZEN UPVOTING
 * =====================================================================
 */

export const apiGetPublicDashboardStats = async (): Promise<PublicDashboardStats> => {
  const data = await apiFetch<PublicDashboardStats>("/public/dashboard-stats");
  return data;
};

export const apiGetPublicGrievances = async (
  search?: string,
  categoryCode?: string,
  status?: string,
  district?: string
): Promise<Grievance[]> => {
  const params = new URLSearchParams();
  if (district) params.append("district", district);
  if (status && status !== "ALL") params.append("status", status);
  if (categoryCode && categoryCode !== "ALL") params.append("category", categoryCode);

  const query = params.toString();
  const data = await apiFetch<{
    grievances: any[];
    totalCount: number;
    page: number;
    limit: number;
  }>(`/public/grievances${query ? `?${query}` : ""}`);

  const upvotedIds = getUpvotedIds();
  const rawList = data.grievances || [];

  let list: Grievance[] = rawList.map((g) => ({
    id: g.id,
    ticketNumber: g.ticketNumber,
    schoolId: g.schoolId || "",
    school: {
      id: g.schoolId || "",
      name: g.schoolName,
      udise: "",
      district: g.district,
      block: g.block,
    },
    categoryId: "",
    category: {
      id: "",
      code: "",
      name: g.categoryName || "Infrastructure",
    },
    subject: g.subject,
    status: g.status,
    priority: "HIGH",
    submissionChannel: "HYBRID",
    sla: {
      slaDays: 10,
      deadline: "",
      isHanged: Boolean(g.isHanged),
      isBreached: Boolean(g.isHanged),
      daysRemaining: 0,
      escalationLevel: 1,
    },
    attachments: [],
    timeline: [],
    upvotesCount: g.upvotesCount || 0,
    hasUserUpvoted: upvotedIds.includes(g.id),
    createdAt: g.createdAt,
  }));

  if (search && search.trim()) {
    const q = search.toLowerCase();
    list = list.filter(
      (g) =>
        g.ticketNumber.toLowerCase().includes(q) ||
        g.school?.name.toLowerCase().includes(q) ||
        g.subject.toLowerCase().includes(q) ||
        g.school?.district.toLowerCase().includes(q)
    );
  }

  return list;
};

export const apiUpvoteGrievance = async (
  grievanceId: string
): Promise<{ newUpvoteCount: number; alreadyVoted: boolean }> => {
  const data = await apiFetch<{
    grievanceId: string;
    upvotesCount: number;
    message: string;
  }>(`/public/grievances/${grievanceId}/upvote`, {
    method: "POST",
    body: JSON.stringify({
      deviceFingerprint: `device-${navigator.userAgent.slice(0, 30)}`,
    }),
  });

  saveUpvotedId(grievanceId);
  return {
    newUpvoteCount: data.upvotesCount,
    alreadyVoted: false,
  };
};

/**
 * =====================================================================
 * MODULE 9: SOCIAL MEDIA ADVOCACY GENERATOR
 * =====================================================================
 */

export const apiGenerateSocialPost = async (
  grievanceId: string,
  platform: "TWITTER_X" | "WHATSAPP" | "FACEBOOK" = "TWITTER_X"
): Promise<{
  postText: string;
  shareUrl: string;
  taggedHandles: string[];
  callToAction: string;
}> => {
  const data = await apiFetch<{
    postText: string;
    shareUrl: string;
    taggedHandles: string[];
    callToAction: string;
  }>(`/social/generate-post/${grievanceId}`, {
    method: "POST",
    body: JSON.stringify({
      platform,
      tone: "URGENT",
    }),
  });

  return data;
};

/**
 * =====================================================================
 * MODULE 10: SAMARTHYA ADMIN & BOTTLENECK ANALYTICS
 * =====================================================================
 */

export const apiGetBottleneckAnalytics = async (): Promise<BottleneckAnalytics> => {
  const data = await apiFetch<BottleneckAnalytics>(
    "/admin/analytics/bottlenecks"
  );
  return data;
};

export const apiBatchEscalateGrievances = async (
  payloadOrIds:
    | {
        grievanceIds?: string[];
        olderThanDays?: number;
        targetEscalationLevel?: number;
        reason: string;
      }
    | string[],
  reason?: string,
  targetLevel?: "DISTRICT" | "STATE" | number
): Promise<{ escalatedCount: number; affectedGrievanceIds: string[] }> => {
  let body: any;
  if (Array.isArray(payloadOrIds)) {
    const levelNum =
      typeof targetLevel === "number"
        ? targetLevel
        : targetLevel === "STATE"
        ? 3
        : 2;
    body = {
      grievanceIds: payloadOrIds,
      reason: reason || "SLA breached",
      targetEscalationLevel: levelNum,
    };
  } else {
    body = payloadOrIds;
  }

  const data = await apiFetch<{
    escalatedCount: number;
    affectedGrievanceIds: string[];
  }>("/admin/escalate-batch", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return data;
};

export const apiExportReportCsv = async (district?: string): Promise<string> => {
  const params = new URLSearchParams();
  if (district && district !== "ALL") params.append("district", district);

  const query = params.toString();
  const csvText = await apiFetch<string>(
    `/admin/reports/export${query ? `?${query}` : ""}`
  );

  return csvText;
};
