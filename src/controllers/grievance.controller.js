import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  Grievance,
  School,
  GrievanceCategory,
  GovernmentAuthority,
  GrievanceAttachment,
  GrievanceTimelineEvent,
  JurisdictionMapping,
} from "../models/index.js";

/**
 * =====================================================================
 * MEMBER 2: GRIEVANCE LIFECYCLE & SLA ESCALATION CONTROLLERS
 * =====================================================================
 */

// POST /api/v1/grievances
export const submitGrievance = asyncHandler(async (req, res) => {
  const {
    schoolId,
    categoryId,
    templateId,
    submissionChannel,
    dynamicFieldValues,
    priority,
    audioRecordingUrl,
    audioTranscriptionRaw,
    photoAttachmentUrls,
  } = req.body;

  // TODO: Member 2 - Map authority geographically, generate ticket number, generate PDF, schedule dispatch
  const ticketNumber = `SAM-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        ticketNumber,
        status: "SUBMITTED",
        slaDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        pdfLetterDownloadUrl: `https://storage.samarthya.org/letters/${ticketNumber}.pdf`,
        publicTrackingUrl: `https://samarthya.org/track/${ticketNumber}`,
      },
      "Grievance submitted and dispatched successfully"
    )
  );
});

// GET /api/v1/grievances/:id
export const getGrievanceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Member 2 - Fetch grievance by UUID or ticketNumber with attachments and timeline
  return res.status(200).json(
    new ApiResponse(200, { id, status: "IN_PROGRESS" }, "Grievance details retrieved")
  );
});

// GET /api/v1/grievances/my-school/:schoolId
export const getGrievancesBySchool = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;
  const { status, page = 1, limit = 15 } = req.query;
  // TODO: Member 2 - List all grievances for a specific school
  return res.status(200).json(
    new ApiResponse(
      200,
      { total: 0, page: Number(page), limit: Number(limit), grievances: [] },
      "School grievances retrieved"
    )
  );
});

// POST /api/v1/grievances/:id/upload-physical-ack
export const uploadPhysicalAckReceipt = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { submissionDate, diaryNumber } = req.body;
  const receiptFile = req.file;

  if (!receiptFile) {
    throw new ApiError(400, "Physical stamped receipt photo is required");
  }

  // TODO: Member 2 - Upload receipt photo, update status to ACKNOWLEDGED, log timeline event
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        status: "ACKNOWLEDGED",
        diaryNumber,
        physicalSubmittedAt: submissionDate,
        receiptUrl: "https://storage.samarthya.org/receipts/sample_ack.jpg",
      },
      "Physical stamped receipt uploaded and verified"
    )
  );
});

// POST /api/v1/grievances/:id/verify-resolution
export const verifyResolution = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isSatisfied, feedbackComment, proofPhotoUrls } = req.body;
  // TODO: Member 2 - Ground verification by SMC: if satisfied, mark RESOLVED; if not, reopen
  return res.status(200).json(
    new ApiResponse(
      200,
      { status: isSatisfied ? "RESOLVED" : "IN_PROGRESS", resolvedAt: new Date() },
      "Ground verification recorded"
    )
  );
});

// POST /api/v1/grievances/:id/reopen
export const reopenGrievance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reopenReason, photoUrls } = req.body;
  // TODO: Member 2 - Increment reopenCount, set status to IN_PROGRESS, send escalation alert
  return res.status(200).json(
    new ApiResponse(
      200,
      { status: "IN_PROGRESS", reopenCount: 1, reopenedAt: new Date() },
      "Grievance reopened successfully"
    )
  );
});

// GET /api/v1/grievances/:id/sla-status
export const getSlaStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Member 2 - Calculate days remaining, overdue status, next escalation level
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ticketNumber: "SAM-202609-0842",
        status: "IN_PROGRESS",
        isBreached: false,
        isHanged: false,
        daysRemaining: 8,
        currentLevel: 1,
      },
      "SLA status calculated"
    )
  );
});

// POST /api/v1/grievances/:id/escalate
export const escalateGrievance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { escalationReason, targetLevel = 2 } = req.body;
  // TODO: Member 2 - Manually escalate grievance to Level 2 (DM) or Level 3 (State)
  return res.status(200).json(
    new ApiResponse(
      200,
      { previousLevel: 1, newLevel: targetLevel, escalatedTo: "District Magistrate" },
      "Grievance escalated successfully"
    )
  );
});
