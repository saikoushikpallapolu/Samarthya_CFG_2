/**
 * Samarthya Civic Tech Platform - TypeScript Interface Definitions
 * Based on API_DOCUMENTATION.md Specification
 */

export type UserRole =
  | "SMC_MEMBER"
  | "CITIZEN"
  | "GOVERNMENT_OFFICER"
  | "SAMARTHYA_ADMIN"
  | "SAMARTHYA_COORDINATOR";

export type SupportedLanguage = "hi" | "pa" | "en";

export type GrievanceStatus =
  | "SUBMITTED"
  | "ACKNOWLEDGED"
  | "UNDER_INSPECTION"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REOPENED"
  | "HANGED"
  | "REJECTED";

export type PriorityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SubmissionChannel = "DIGITAL_DISPATCH" | "PHYSICAL_RECEIPT" | "HYBRID";

export type SmcDesignation =
  | "PARENT_MEMBER"
  | "TEACHER_MEMBER"
  | "HEADMASTER_CHAIRPERSON"
  | "PANCHAYAT_REPRESENTATIVE"
  | "COMMUNITY_VOLUNTEER";

export interface User {
  id: string;
  phoneNumber: string;
  fullName: string;
  email?: string;
  role: UserRole;
  preferredLanguage: SupportedLanguage;
  isPhoneVerified: boolean;
  avatarUrl?: string;
  associatedSchools?: {
    schoolId: string;
    schoolName: string;
    udiseCode: string;
    designation: SmcDesignation;
  }[];
}

export interface School {
  id: string;
  udiseCode: string;
  schoolName: string;
  state: string;
  district: string;
  block?: string;
  cluster?: string;
  villageOrWard?: string;
  pincode: string;
  latitude: number;
  longitude: number;
  category: string;
  managementType: string;
  totalStudentsEnrolled: number;
  headmasterName?: string;
  headmasterPhone?: string;
  totalGrievancesCount: number;
  resolvedGrievancesCount: number;
  hangedGrievancesCount: number;
  distanceKm?: number;
}

export interface Department {
  id: string;
  departmentCode: string;
  departmentName: string;
  description?: string;
}

export interface GrievanceCategory {
  id: string;
  categoryCode: string;
  categoryName: string;
  defaultSlaDays: number;
  defaultPriority: PriorityLevel;
  iconUrl?: string;
  description?: string;
  department?: Department;
}

export interface GovernmentAuthority {
  id: string;
  departmentId?: string;
  designation: string;
  officeName: string;
  officerName: string;
  jurisdictionLevel: "BLOCK" | "DISTRICT" | "STATE";
  jurisdictionState: string;
  jurisdictionDistrict: string;
  jurisdictionBlock?: string;
  officialEmail: string;
  officialPhone: string;
  officeAddress: string;
  pincode?: string;
  department?: Department;
}

export interface GrievanceAttachment {
  id: string;
  fileUrl: string;
  attachmentType: "ISSUE_PHOTO" | "PHYSICAL_ACK_RECEIPT" | "RESOLUTION_PROOF" | "AUDIO_VOICE_NOTE";
  fileMimeType?: string;
  caption?: string;
  createdAt?: string;
}

export interface GrievanceTimelineEvent {
  id: string;
  eventType: string;
  performedBy?: string;
  timestamp: string;
  comment?: string;
  metadata?: Record<string, unknown>;
}

export interface Grievance {
  id: string;
  ticketNumber: string;
  schoolId: string;
  school?: {
    id: string;
    name: string;
    udise: string;
    district: string;
    block?: string;
  };
  categoryId: string;
  category?: {
    id: string;
    code: string;
    name: string;
  };
  templateId?: string;
  subject: string;
  formalLetterContent?: string;
  letterPdfUrl?: string;
  assignedAuthority?: {
    id?: string;
    designation: string;
    officeName: string;
    officerName?: string;
    officialEmail: string;
    officialPhone?: string;
    officeAddress?: string;
  };
  status: GrievanceStatus;
  priority: PriorityLevel;
  submissionChannel: SubmissionChannel;
  sla: {
    slaDays: number;
    deadline: string;
    isHanged: boolean;
    isBreached: boolean;
    daysRemaining: number;
    escalationLevel: number;
  };
  dynamicFieldValues?: Record<string, string>;
  attachments: GrievanceAttachment[];
  timeline: GrievanceTimelineEvent[];
  upvotesCount: number;
  hasUserUpvoted?: boolean;
  actionToken?: string;
  createdAt: string;
  updatedAt?: string;
  reopenCount?: number;
  physicalDiaryNumber?: string;
  physicalSubmittedAt?: string;
  physicalReceiptUrl?: string;
}

export interface RequiredVariable {
  key: string;
  label: string;
  type: "string" | "number" | "select";
  required: boolean;
  placeholder?: string;
}

export interface GrievanceTemplate {
  templateId: string;
  categoryId: string;
  language: SupportedLanguage;
  templateTitle: string;
  subjectTemplate: string;
  bodyMarkdownTemplate: string;
  requiredVariables: RequiredVariable[];
  legalReferences?: string;
}

export interface PublicDashboardStats {
  totalSchoolsEmpowered: number;
  totalGrievancesFiled: number;
  totalResolved: number;
  totalHanged: number;
  resolutionRatePercentage: number;
  averageResolutionDays: number;
  categoryBreakdown: {
    category: string;
    categoryCode: string;
    total: number;
    resolved: number;
    hanged: number;
  }[];
  topPerformingDistricts: {
    district: string;
    resolutionRate: number;
  }[];
}

export interface BottleneckAnalytics {
  worstPerformingDepartments: {
    departmentCode: string;
    departmentName: string;
    openGrievances: number;
    hangedGrievances: number;
    averageDaysToResolve: number;
  }[];
  worstPerformingDistricts: {
    district: string;
    openGrievances: number;
    hangedGrievances: number;
    escalationRatePercentage: number;
  }[];
}

export interface AudioProcessingResult {
  audioUrl: string;
  durationSeconds: number;
  detectedLanguage: SupportedLanguage;
  confidenceScore: number;
  transcriptionRaw: string;
  detectedCategory?: {
    id: string;
    categoryCode: string;
    categoryName: string;
  };
  extractedFields: Record<string, string>;
}
