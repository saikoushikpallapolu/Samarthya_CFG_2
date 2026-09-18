import {
  MOCK_CATEGORIES,
  MOCK_DEPARTMENTS,
  MOCK_AUTHORITIES,
  MOCK_SCHOOLS,
  MOCK_GRIEVANCES,
  MOCK_TEMPLATES,
  MOCK_USERS,
  MOCK_PUBLIC_STATS,
  MOCK_BOTTLENECK_ANALYTICS,
} from "./mockData";
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

// In-browser LocalStorage keys for stateful persistence
const STORAGE_KEYS = {
  GRIEVANCES: "samarthya_grievances",
  SCHOOLS: "samarthya_schools",
  UPVOTES: "samarthya_upvoted_ids",
  CURRENT_USER: "samarthya_current_user",
  AUTH_TOKEN: "samarthya_access_token",
};

// Initialize localStorage with mock defaults if empty
const getStoredGrievances = (): Grievance[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GRIEVANCES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Storage parse error", e);
  }
  localStorage.setItem(STORAGE_KEYS.GRIEVANCES, JSON.stringify(MOCK_GRIEVANCES));
  return MOCK_GRIEVANCES;
};

const saveStoredGrievances = (grievances: Grievance[]) => {
  localStorage.setItem(STORAGE_KEYS.GRIEVANCES, JSON.stringify(grievances));
};

const getStoredSchools = (): School[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHOOLS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Storage parse error", e);
  }
  localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(MOCK_SCHOOLS));
  return MOCK_SCHOOLS;
};

const saveStoredSchools = (schools: School[]) => {
  localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(schools));
};

const getUpvotedIds = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.UPVOTES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(e);
  }
  return ["grievance-02"];
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
export const apiRequestOtp = async (phoneNumber: string): Promise<{ success: boolean; testOtp: string; message: string }> => {
  // Always provide test OTP 459123 as specified in system specification
  return {
    success: true,
    testOtp: "459123",
    message: `OTP sent successfully to ${phoneNumber}. Demo Universal OTP is 459123`,
  };
};

export const apiVerifyOtp = async (
  phoneNumber: string,
  _otp: string,
  fullName?: string,
  selectedRole?: UserRole
): Promise<{ user: User; accessToken: string }> => {
  const role = selectedRole || "SMC_MEMBER";
  const baseUser = MOCK_USERS[role] || MOCK_USERS.SMC_MEMBER;

  const user: User = {
    ...baseUser,
    phoneNumber,
    fullName: fullName || baseUser.fullName,
    role,
  };

  const accessToken = `samarthya_jwt_${role}_${Date.now()}`;
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);

  return { user, accessToken };
};

export const apiGetCurrentUser = async (): Promise<User> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(e);
  }
  return MOCK_USERS.SMC_MEMBER;
};

export const apiUpdateLanguage = async (language: SupportedLanguage): Promise<boolean> => {
  const user = await apiGetCurrentUser();
  user.preferredLanguage = language;
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  return true;
};

export const apiLogout = async (): Promise<boolean> => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  return true;
};

/**
 * =====================================================================
 * MODULE 2: SCHOOL DISCOVERY & LOCATION SEARCH
 * =====================================================================
 */
export const apiSearchSchools = async (
  query?: string,
  state?: string,
  district?: string,
  pincode?: string
): Promise<{ total: number; schools: School[] }> => {
  const schools = getStoredSchools();
  let filtered = [...schools];

  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    filtered = filtered.filter(
      (s) =>
        s.schoolName.toLowerCase().includes(q) ||
        s.udiseCode.includes(q) ||
        s.district.toLowerCase().includes(q) ||
        s.pincode.includes(q)
    );
  }

  if (state && state.trim()) {
    filtered = filtered.filter((s) => s.state.toLowerCase().includes(state.toLowerCase()));
  }

  if (district && district.trim()) {
    filtered = filtered.filter((s) => s.district.toLowerCase().includes(district.toLowerCase()));
  }

  if (pincode && pincode.trim()) {
    filtered = filtered.filter((s) => s.pincode.includes(pincode.trim()));
  }

  return { total: filtered.length, schools: filtered };
};

export const apiGetNearbySchools = async (
  _latitude: number,
  _longitude: number,
  _radiusKm = 15
): Promise<School[]> => {
  const schools = getStoredSchools();
  return schools.map((s) => ({
    ...s,
    distanceKm: parseFloat((Math.random() * 8 + 0.5).toFixed(1)),
  }));
};

export const apiGetSchoolById = async (schoolId: string): Promise<School> => {
  const schools = getStoredSchools();
  const school = schools.find((s) => s.id === schoolId || s.udiseCode === schoolId);
  if (!school) {
    return schools[0];
  }
  return school;
};

export const apiJoinSmcCommittee = async (
  schoolId: string,
  designation: string,
  _studentName?: string,
  _studentClass?: string
): Promise<boolean> => {
  const user = await apiGetCurrentUser();
  const school = await apiGetSchoolById(schoolId);

  const existing = user.associatedSchools || [];
  if (!existing.some((s) => s.schoolId === school.id)) {
    existing.push({
      schoolId: school.id,
      schoolName: school.schoolName,
      udiseCode: school.udiseCode,
      designation: designation as any,
    });
    user.associatedSchools = existing;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }
  return true;
};

/**
 * =====================================================================
 * MODULE 3: MASTER DATA & DIRECTORY
 * =====================================================================
 */
export const apiGetCategories = async (_language: SupportedLanguage = "hi"): Promise<GrievanceCategory[]> => {
  return MOCK_CATEGORIES;
};

export const apiGetDepartments = async (): Promise<Department[]> => {
  return MOCK_DEPARTMENTS;
};

export const apiGetAuthorities = async (state?: string, district?: string): Promise<GovernmentAuthority[]> => {
  if (district) {
    const matched = MOCK_AUTHORITIES.filter((a) =>
      a.jurisdictionDistrict.toLowerCase().includes(district.toLowerCase())
    );
    if (matched.length > 0) return matched;
  }
  if (state) {
    const matched = MOCK_AUTHORITIES.filter((a) =>
      a.jurisdictionState.toLowerCase().includes(state.toLowerCase())
    );
    if (matched.length > 0) return matched;
  }
  return MOCK_AUTHORITIES;
};

/**
 * =====================================================================
 * MODULE 4: SPEECH-TO-TEXT & TEMPLATE ENGINE
 * =====================================================================
 */
export const apiProcessAudio = async (
  _audioFile?: File | Blob,
  languageHint: SupportedLanguage = "hi",
  categoryId?: string
): Promise<AudioProcessingResult> => {
  // Simulate regional STT pipeline transcription with latency
  await new Promise((r) => setTimeout(r, 900));

  const transcriptions: Record<SupportedLanguage, string> = {
    hi: "हमारे स्कूल में पिछले दो महीने से पीने के पानी की 1000 लीटर की टंकी टूटी हुई है और नलों में पानी नहीं आ रहा है, जिससे 480 विद्यार्थियों को भारी परेशानी हो रही है।",
    pa: "ਸਾਡੇ ਸਕੂਲ ਵਿੱਚ ਪਿਛਲੇ ਦੋ ਮਹੀਨਿਆਂ ਤੋਂ ਪੀਣ ਵਾਲੇ ਪਾਣੀ ਦੀ ਟੈਂਕੀ ਟੁੱਟੀ ਹੋਈ ਹੈ ਅਤੇ ਨਲਾਂ ਵਿੱਚ ਪਾਣੀ ਨਹੀਂ ਆ ਰਿਹਾ, ਜਿਸ ਨਾਲ ਵਿਦਿਆਰਥੀਆਂ ਨੂੰ ਭਾਰੀ ਮੁਸ਼ਕਲ ਹੋ ਰਹੀ ਹੈ।",
    en: "In our school, the main drinking water storage tank has been broken for two months and taps are dry, causing immense hardship to 480 enrolled students.",
  };

  const selectedCategory = categoryId
    ? MOCK_CATEGORIES.find((c) => c.id === categoryId) || MOCK_CATEGORIES[0]
    : MOCK_CATEGORIES[0];

  return {
    audioUrl: "https://storage.samarthya.org/audio/sample_voice_rec.m4a",
    durationSeconds: 19,
    detectedLanguage: languageHint,
    confidenceScore: 96.8,
    transcriptionRaw: transcriptions[languageHint] || transcriptions.hi,
    detectedCategory: {
      id: selectedCategory.id,
      categoryCode: selectedCategory.categoryCode,
      categoryName: selectedCategory.categoryName,
    },
    extractedFields: {
      facility_affected: "पीने के पानी की टंकी व नल",
      specific_problem: "टंकी टूटी है और नलों में पानी नहीं आ रहा",
      duration_of_issue: "2 महीने से",
      impact: "480 विद्यार्थियों को गंभीर परेशानी",
    },
  };
};

export const apiGetTemplateByCategory = async (
  categoryId: string,
  language: SupportedLanguage = "hi"
): Promise<GrievanceTemplate> => {
  const tpl = MOCK_TEMPLATES.find((t) => t.categoryId === categoryId && t.language === language);
  if (tpl) return tpl;
  return MOCK_TEMPLATES[0];
};

export const apiPreviewLetter = async (
  templateId: string,
  schoolId: string,
  dynamicFieldValues: Record<string, string>
): Promise<{ renderedSubject: string; renderedMarkdown: string; assignedAuthority: GovernmentAuthority }> => {
  const school = await apiGetSchoolById(schoolId);
  const authority = MOCK_AUTHORITIES.find((a) => a.jurisdictionDistrict === school.district) || MOCK_AUTHORITIES[0];
  const template = MOCK_TEMPLATES.find((t) => t.templateId === templateId) || MOCK_TEMPLATES[0];

  const facility = dynamicFieldValues.facility_affected || "पीने के पानी की सुविधा";
  const problem = dynamicFieldValues.specific_problem || "उपकरण क्षतिग्रस्त है";
  const duration = dynamicFieldValues.duration_of_issue || "अज्ञात समय";

  const renderedSubject = `विषय: ${school.schoolName} (UDISE: ${school.udiseCode}) में ${facility} की तत्काल मरम्मत एवं कार्यशीलता सुनिश्चित करने हेतु।`;

  const renderedMarkdown = template.bodyMarkdownTemplate
    ? template.bodyMarkdownTemplate
        .replace(/{school_name}/g, school.schoolName)
        .replace(/{udise_code}/g, school.udiseCode)
        .replace(/{village}/g, school.villageOrWard || "मुख्य परिसर")
        .replace(/{block}/g, school.block || "ग्रामीण")
        .replace(/{district}/g, school.district)
        .replace(/{facility_affected}/g, facility)
        .replace(/{specific_problem}/g, problem)
        .replace(/{duration_of_issue}/g, duration)
        .replace(/{authority_office_name}/g, authority.officeName)
        .replace(/{authority_address}/g, authority.officeAddress)
    : `सेवा में,
श्रीमान ${authority.designation} महोदय,
${authority.officeName},
${authority.officeAddress}

महोदय,

सविनय निवेदन है कि हम विद्यालय प्रबंधन समिति (SMC) के सदस्य आपका ध्यान विद्यालय की एक अत्यंत गंभीर समस्या की ओर आकर्षित करना चाहते हैं।

विद्यालय विवरण:
- विद्यालय: **${school.schoolName}**
- UDISE कोड: **${school.udiseCode}**
- ग्राम/वार्ड: **${school.villageOrWard || "मुख्य परिसर"}**, ब्लॉक: **${school.block || "ग्रामीण"}**, जिला: **${school.district}**

समस्या का विवरण:
- प्रभावित सुविधा: **${facility}**
- समस्या की प्रकृति: **${problem}**
- समस्या की अवधि: **${duration}**

उल्लेखनीय है कि निःशुल्क और अनिवार्य बाल शिक्षा का अधिकार अधिनियम (RTE Act, 2009) की धारा 19 एवं अनुसूची के अनुसार प्रत्येक विद्यालय में स्वच्छ पेयजल एवं क्रियाशील प्रसाधन सुविधा प्रदान करना राज्य का संवैधानिक उत्तरदायित्व है।

अतः आपसे करबद्ध निवेदन है कि जनहित एवं बालिकाओं के स्वास्थ्य को ध्यान में रखते हुए इस प्रार्थना पत्र पर त्वरित संज्ञान लेते हुए संबंधित तकनीकी शाखा को निरीक्षण एवं मरम्मत का आदेश जारी करने की कृपा करें।

भवदीय / भवदीया,
विद्यालय प्रबंधन समिति (SMC)
${school.schoolName}`;

  return { renderedSubject, renderedMarkdown, assignedAuthority: authority };
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
  const grievances = getStoredGrievances();
  const school = await apiGetSchoolById(payload.schoolId);
  const category = MOCK_CATEGORIES.find((c) => c.id === payload.categoryId) || MOCK_CATEGORIES[0];
  const authority = MOCK_AUTHORITIES.find((a) => a.jurisdictionDistrict === school.district) || MOCK_AUTHORITIES[0];

  const now = new Date();
  const ticketNumber = `SAM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
  const slaDays = category.defaultSlaDays || 10;
  const deadlineDate = new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000);

  const preview = await apiPreviewLetter(payload.templateId || "tpl-water-hi", school.id, payload.dynamicFieldValues || {});

  const newGrievance: Grievance = {
    id: `grievance-${Date.now()}`,
    ticketNumber,
    schoolId: school.id,
    school: {
      id: school.id,
      name: school.schoolName,
      udise: school.udiseCode,
      district: school.district,
      block: school.block,
    },
    categoryId: category.id,
    category: {
      id: category.id,
      code: category.categoryCode,
      name: category.categoryName,
    },
    templateId: payload.templateId,
    subject: preview.renderedSubject,
    formalLetterContent: preview.renderedMarkdown,
    letterPdfUrl: `https://storage.samarthya.org/letters/${ticketNumber}.pdf`,
    assignedAuthority: {
      id: authority.id,
      designation: authority.designation,
      officeName: authority.officeName,
      officerName: authority.officerName,
      officialEmail: authority.officialEmail,
      officialPhone: authority.officialPhone,
      officeAddress: authority.officeAddress,
    },
    status: "SUBMITTED",
    priority: payload.priority || category.defaultPriority,
    submissionChannel: payload.submissionChannel || "HYBRID",
    sla: {
      slaDays,
      deadline: deadlineDate.toISOString(),
      isHanged: false,
      isBreached: false,
      daysRemaining: slaDays,
      escalationLevel: 1,
    },
    dynamicFieldValues: payload.dynamicFieldValues,
    attachments: (payload.photoAttachmentUrls || []).map((url, idx) => ({
      id: `att-new-${idx}`,
      fileUrl: url,
      attachmentType: "ISSUE_PHOTO",
      caption: "Ground problem site photo",
    })),
    timeline: [
      {
        id: `evt-created-${Date.now()}`,
        eventType: "CREATED",
        performedBy: "SMC Member",
        timestamp: now.toISOString(),
        comment: "Official grievance submitted and verified by SMC",
      },
      {
        id: `evt-dispatch-${Date.now()}`,
        eventType: "DISPATCHED_DIGITALLY",
        performedBy: "Samarthya System Dispatcher",
        timestamp: new Date(now.getTime() + 60000).toISOString(),
        comment: `Digital notice with 1-click action link dispatched to ${authority.officialEmail}`,
      },
    ],
    upvotesCount: 1,
    actionToken: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    createdAt: now.toISOString(),
  };

  const updatedGrievances = [newGrievance, ...grievances];
  saveStoredGrievances(updatedGrievances);

  // Update school count
  const schools = getStoredSchools();
  const schoolIndex = schools.findIndex((s) => s.id === school.id);
  if (schoolIndex !== -1) {
    schools[schoolIndex].totalGrievancesCount += 1;
    saveStoredSchools(schools);
  }

  return newGrievance;
};

export const apiGetGrievanceById = async (idOrTicket: string): Promise<Grievance> => {
  const grievances = getStoredGrievances();
  const found = grievances.find((g) => g.id === idOrTicket || g.ticketNumber === idOrTicket);
  if (!found) {
    return grievances[0];
  }
  const upvotedIds = getUpvotedIds();
  return {
    ...found,
    hasUserUpvoted: upvotedIds.includes(found.id),
  };
};

export const apiGetGrievancesBySchool = async (schoolId: string, status?: string): Promise<Grievance[]> => {
  const grievances = getStoredGrievances();
  let list = grievances.filter((g) => g.schoolId === schoolId);
  if (status && status !== "ALL") {
    if (status === "HANGED") {
      list = list.filter((g) => g.status === "HANGED" || g.sla.isHanged);
    } else {
      list = list.filter((g) => g.status === status);
    }
  }
  return list;
};

export const apiUploadPhysicalAck = async (
  grievanceId: string,
  receiptPhotoUrl: string,
  submissionDate: string,
  diaryNumber?: string
): Promise<Grievance> => {
  const grievances = getStoredGrievances();
  const idx = grievances.findIndex((g) => g.id === grievanceId || g.ticketNumber === grievanceId);
  if (idx === -1) throw new Error("Grievance not found");

  const target = grievances[idx];
  target.status = "ACKNOWLEDGED";
  target.physicalDiaryNumber = diaryNumber;
  target.physicalSubmittedAt = submissionDate;
  target.physicalReceiptUrl = receiptPhotoUrl;

  target.attachments.push({
    id: `att-receipt-${Date.now()}`,
    fileUrl: receiptPhotoUrl,
    attachmentType: "PHYSICAL_ACK_RECEIPT",
    caption: `Stamped receiving receipt (Diary: ${diaryNumber || "N/A"})`,
    createdAt: new Date().toISOString(),
  });

  target.timeline.push({
    id: `evt-ack-${Date.now()}`,
    eventType: "PHYSICAL_ACK_UPLOADED",
    performedBy: "SMC Member",
    timestamp: new Date().toISOString(),
    comment: `Stamped receiving receipt uploaded with Diary Number: ${diaryNumber || "N/A"}`,
  });

  saveStoredGrievances(grievances);
  return target;
};

export const apiVerifyResolution = async (
  grievanceId: string,
  isSatisfied: boolean,
  feedbackComment: string
): Promise<Grievance> => {
  const grievances = getStoredGrievances();
  const idx = grievances.findIndex((g) => g.id === grievanceId || g.ticketNumber === grievanceId);
  if (idx === -1) throw new Error("Grievance not found");

  const target = grievances[idx];
  if (isSatisfied) {
    target.status = "RESOLVED";
    target.sla.isHanged = false;
    target.timeline.push({
      id: `evt-verify-${Date.now()}`,
      eventType: "VERIFIED_BY_SMC",
      performedBy: "SMC Chairperson / Parent",
      timestamp: new Date().toISOString(),
      comment: `Ground verification confirmed: ${feedbackComment}`,
    });
  } else {
    target.status = "IN_PROGRESS";
    target.reopenCount = (target.reopenCount || 0) + 1;
    target.timeline.push({
      id: `evt-reopen-${Date.now()}`,
      eventType: "REOPENED",
      performedBy: "SMC Ground Inspector",
      timestamp: new Date().toISOString(),
      comment: `Resolution rejected: ${feedbackComment}`,
    });
  }

  saveStoredGrievances(grievances);
  return target;
};

export const apiReopenGrievance = async (grievanceId: string, reason: string): Promise<Grievance> => {
  return apiVerifyResolution(grievanceId, false, reason);
};

/**
 * =====================================================================
 * MODULE 6: GOVERNMENT AUTHORITY 1-CLICK ACTION (MAGIC LINK)
 * =====================================================================
 */
export const apiGetAuthorityGrievanceByToken = async (actionToken: string): Promise<Grievance> => {
  const grievances = getStoredGrievances();
  const found = grievances.find((g) => g.actionToken === actionToken);
  if (found) return found;
  // Fallback to first grievance for smooth testing
  return grievances[0];
};

export const apiAcknowledgeByToken = async (
  actionToken: string,
  officerRemarks: string,
  tentativeDate?: string
): Promise<Grievance> => {
  const grievances = getStoredGrievances();
  const idx = grievances.findIndex((g) => g.actionToken === actionToken) !== -1
    ? grievances.findIndex((g) => g.actionToken === actionToken)
    : 0;

  const target = grievances[idx];
  target.status = "ACKNOWLEDGED";
  target.timeline.push({
    id: `evt-auth-ack-${Date.now()}`,
    eventType: "ACKNOWLEDGED_BY_OFFICER",
    performedBy: target.assignedAuthority?.officerName || "Responsible Authority",
    timestamp: new Date().toISOString(),
    comment: officerRemarks || "Grievance acknowledged by department officer",
    metadata: { tentativeResolutionDate: tentativeDate },
  });

  saveStoredGrievances(grievances);
  return target;
};

export const apiUpdateStatusByToken = async (
  actionToken: string,
  newStatus: "UNDER_INSPECTION" | "IN_PROGRESS" | "RESOLVED",
  completionSummary: string,
  workOrderNumber?: string,
  proofPhotoUrl?: string
): Promise<Grievance> => {
  const grievances = getStoredGrievances();
  const idx = grievances.findIndex((g) => g.actionToken === actionToken) !== -1
    ? grievances.findIndex((g) => g.actionToken === actionToken)
    : 0;

  const target = grievances[idx];
  target.status = newStatus;

  if (proofPhotoUrl) {
    target.attachments.push({
      id: `att-proof-${Date.now()}`,
      fileUrl: proofPhotoUrl,
      attachmentType: "RESOLUTION_PROOF",
      caption: `Official work completion photo (${workOrderNumber || "WO"})`,
      createdAt: new Date().toISOString(),
    });
  }

  target.timeline.push({
    id: `evt-status-${Date.now()}`,
    eventType: newStatus === "RESOLVED" ? "RESOLVED_BY_OFFICER" : "STATUS_UPDATED",
    performedBy: target.assignedAuthority?.officerName || "Official Engineer",
    timestamp: new Date().toISOString(),
    comment: completionSummary || `Work status updated to ${newStatus}`,
    metadata: { workOrderNumber },
  });

  saveStoredGrievances(grievances);
  return target;
};

export const apiForwardByToken = async (
  actionToken: string,
  targetDepartmentCode: string,
  reason: string
): Promise<Grievance> => {
  const grievances = getStoredGrievances();
  const idx = grievances.findIndex((g) => g.actionToken === actionToken) !== -1
    ? grievances.findIndex((g) => g.actionToken === actionToken)
    : 0;

  const target = grievances[idx];
  const newDept = MOCK_DEPARTMENTS.find((d) => d.departmentCode === targetDepartmentCode) || MOCK_DEPARTMENTS[1];

  target.status = "SUBMITTED";
  target.timeline.push({
    id: `evt-fwd-${Date.now()}`,
    eventType: "FORWARDED",
    performedBy: target.assignedAuthority?.officerName || "Officer",
    timestamp: new Date().toISOString(),
    comment: `Forwarded to ${newDept.departmentName}. Reason: ${reason}`,
  });

  saveStoredGrievances(grievances);
  return target;
};

/**
 * =====================================================================
 * MODULE 7: SLA TRACKING & ESCALATIONS
 * =====================================================================
 */
export const apiEscalateGrievance = async (
  grievanceId: string,
  escalationReason: string,
  targetLevel = 2
): Promise<Grievance> => {
  const grievances = getStoredGrievances();
  const idx = grievances.findIndex((g) => g.id === grievanceId || g.ticketNumber === grievanceId);
  if (idx === -1) throw new Error("Grievance not found");

  const target = grievances[idx];
  target.sla.escalationLevel = targetLevel;
  target.sla.isHanged = true;
  target.status = "HANGED";

  target.timeline.push({
    id: `evt-esc-${Date.now()}`,
    eventType: "MANUALLY_ESCALATED",
    performedBy: "Samarthya Administrator",
    timestamp: new Date().toISOString(),
    comment: `Escalated to Level ${targetLevel} (District Magistrate). Reason: ${escalationReason}`,
  });

  saveStoredGrievances(grievances);
  return target;
};

/**
 * =====================================================================
 * MODULE 8: PUBLIC TRANSPARENCY & CITIZEN UPVOTING
 * =====================================================================
 */
export const apiGetPublicDashboardStats = async (): Promise<PublicDashboardStats> => {
  const grievances = getStoredGrievances();
  const total = grievances.length;
  const resolved = grievances.filter((g) => g.status === "RESOLVED").length;
  const hanged = grievances.filter((g) => g.status === "HANGED" || g.sla.isHanged).length;

  return {
    ...MOCK_PUBLIC_STATS,
    totalGrievancesFiled: total + 14850,
    totalResolved: resolved + 11980,
    totalHanged: hanged + 1420,
  };
};

export const apiGetPublicGrievances = async (
  search?: string,
  categoryCode?: string,
  status?: string,
  district?: string
): Promise<Grievance[]> => {
  const grievances = getStoredGrievances();
  const upvotedIds = getUpvotedIds();

  let list = grievances.map((g) => ({
    ...g,
    hasUserUpvoted: upvotedIds.includes(g.id),
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

  if (categoryCode && categoryCode !== "ALL") {
    list = list.filter((g) => g.category?.code === categoryCode);
  }

  if (status && status !== "ALL") {
    if (status === "HANGED") {
      list = list.filter((g) => g.status === "HANGED" || g.sla.isHanged);
    } else {
      list = list.filter((g) => g.status === status);
    }
  }

  if (district && district.trim()) {
    list = list.filter((g) => g.school?.district.toLowerCase().includes(district.toLowerCase()));
  }

  return list;
};

export const apiUpvoteGrievance = async (grievanceId: string): Promise<{ newUpvoteCount: number; alreadyVoted: boolean }> => {
  const upvotedIds = getUpvotedIds();
  const grievances = getStoredGrievances();
  const idx = grievances.findIndex((g) => g.id === grievanceId || g.ticketNumber === grievanceId);

  if (upvotedIds.includes(grievanceId)) {
    return {
      newUpvoteCount: idx !== -1 ? grievances[idx].upvotesCount : 1,
      alreadyVoted: true,
    };
  }

  saveUpvotedId(grievanceId);

  if (idx !== -1) {
    grievances[idx].upvotesCount += 1;
    saveStoredGrievances(grievances);
    return { newUpvoteCount: grievances[idx].upvotesCount, alreadyVoted: false };
  }

  return { newUpvoteCount: 1, alreadyVoted: false };
};

/**
 * =====================================================================
 * MODULE 9: SOCIAL MEDIA ADVOCACY GENERATOR
 * =====================================================================
 */
export const apiGenerateSocialPost = (
  grievance: Grievance,
  platform: "TWITTER_X" | "WHATSAPP" | "FACEBOOK"
): { postText: string; shareUrl: string; taggedHandles: string[] } => {
  const schoolName = grievance.school?.name || "Government School";
  const district = grievance.school?.district || "Haryana";
  const facility = grievance.dynamicFieldValues?.facility_affected || grievance.category?.name || "मूलभूत सुविधा";
  const days = grievance.sla.isHanged ? 25 : 8;
  const ticket = grievance.ticketNumber;

  const handles = ["@cmohry", "@DIPRHaryana", "@EduMinOfIndia", "@DC_Sonipat"];
  const trackingUrl = `https://samarthya.org/track/${ticket}`;

  if (platform === "TWITTER_X") {
    const postText = `🚨 URGENT: ${schoolName} (${district}) में ${facility} पिछले ${days} दिनों से खराब है। 480+ विद्यार्थियों की शिक्षा व स्वास्थ्य प्रभावित!\n\nकृपया तुरंत संज्ञान लें ${handles.join(" ")}\n\nट्रैकिंग: ${trackingUrl} #Samarthya #RTEIndia #PublicSchool`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}`;
    return { postText, shareUrl, taggedHandles: handles };
  } else if (platform === "WHATSAPP") {
    const postText = `*समर्थ्या जन-जागरूकता अपील*\n\n🏫 *विद्यालय:* ${schoolName}\n📍 *जिला:* ${district}\n⚠️ *समस्या:* ${facility} (${days} दिनों से लंबित)\n🎫 *शिकायत संख्या:* ${ticket}\n\nइस समस्या को जल्द सुलझाने हेतु कृपया इसे शेयर करें एवं समर्थ्या पोर्टल पर अपवोट करें:\n${trackingUrl}`;
    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(postText)}`;
    return { postText, shareUrl, taggedHandles: handles };
  } else {
    const postText = `Public School Grievance Alert: ${facility} damaged at ${schoolName}, ${district}. Complaint Ticket ${ticket}. Follow live progress on Samarthya: ${trackingUrl}`;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(trackingUrl)}`;
    return { postText, shareUrl, taggedHandles: handles };
  }
};

/**
 * =====================================================================
 * MODULE 10: SAMARTHYA ADMIN & MACRO DECISION-MAKING
 * =====================================================================
 */
export const apiGetBottleneckAnalytics = async (): Promise<BottleneckAnalytics> => {
  return MOCK_BOTTLENECK_ANALYTICS;
};

export const apiBatchEscalateGrievances = async (
  grievanceIds: string[],
  escalationReason: string,
  targetAuthorityLevel: "DISTRICT" | "STATE" = "DISTRICT"
): Promise<{ escalatedCount: number; notificationsDispatched: number }> => {
  const grievances = getStoredGrievances();
  let count = 0;

  grievances.forEach((g) => {
    if (grievanceIds.includes(g.id)) {
      g.sla.escalationLevel = targetAuthorityLevel === "STATE" ? 3 : 2;
      g.sla.isHanged = true;
      g.status = "HANGED";
      g.timeline.push({
        id: `evt-batch-esc-${Date.now()}-${count}`,
        eventType: "BATCH_ESCALATED",
        performedBy: "Samarthya Administrator",
        timestamp: new Date().toISOString(),
        comment: `Batch escalation to ${targetAuthorityLevel === "STATE" ? "State Directorate" : "District Magistrate"}: ${escalationReason}`,
      });
      count++;
    }
  });

  saveStoredGrievances(grievances);
  return { escalatedCount: count, notificationsDispatched: count * 2 };
};

export const apiExportReportCsv = async (district?: string): Promise<string> => {
  const grievances = getStoredGrievances();
  let list = grievances;
  if (district && district !== "ALL") {
    list = list.filter((g) => g.school?.district.toLowerCase().includes(district.toLowerCase()));
  }

  const headers = [
    "Ticket Number",
    "School Name",
    "UDISE Code",
    "District",
    "Category",
    "Status",
    "Priority",
    "SLA Days",
    "Is Hanged",
    "Upvotes",
    "Created Date",
    "Assigned Office",
  ];

  const rows = list.map((g) => [
    `"${g.ticketNumber}"`,
    `"${g.school?.name || ""}"`,
    `"${g.school?.udise || ""}"`,
    `"${g.school?.district || ""}"`,
    `"${g.category?.name || ""}"`,
    `"${g.status}"`,
    `"${g.priority}"`,
    g.sla.slaDays,
    g.sla.isHanged ? "YES" : "NO",
    g.upvotesCount,
    `"${g.createdAt.split("T")[0]}"`,
    `"${g.assignedAuthority?.officeName || ""}"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
};
