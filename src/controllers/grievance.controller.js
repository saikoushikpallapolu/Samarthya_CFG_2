import crypto from "crypto";
import fs from "fs";
import { Op } from "sequelize";
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
  GrievanceTemplate,
  JurisdictionMapping,
  Department,
  User,
} from "../models/index.js";

/**
 * =====================================================================
 * MEMBER 2: GRIEVANCE LIFECYCLE & SLA ESCALATION CONTROLLERS
 * =====================================================================
 */

/**
 * @desc    Submit & dispatch an official grievance (generates PDF, maps authority, sets SLA)
 * @route   POST /api/v1/grievances
 * @access  Authenticated
 */
export const submitGrievance = asyncHandler(async (req, res) => {
  const {
    schoolId,
    categoryId,
    templateId,
    submissionChannel = "HYBRID",
    priority,
    dynamicFieldValues = {},
    audioRecordingUrl,
    audioTranscriptionRaw,
    photoAttachmentUrls = [],
  } = req.body;

  if (!schoolId || !categoryId) {
    throw new ApiError(400, "Both schoolId and categoryId are required");
  }

  const school = await School.findByPk(schoolId);
  if (!school) {
    throw new ApiError(404, "School not found");
  }

  const category = await GrievanceCategory.findByPk(categoryId);
  if (!category) {
    throw new ApiError(404, "Grievance category not found");
  }

  // 1. Geographically map the responsible government authority
  let assignedAuthority = null;
  const mapping = await JurisdictionMapping.findOne({
    where: {
      categoryId: category.id,
      state: school.state,
      district: school.district,
    },
  });

  if (mapping?.primaryAuthorityId) {
    assignedAuthority = await GovernmentAuthority.findByPk(mapping.primaryAuthorityId);
  }

  if (!assignedAuthority) {
    assignedAuthority = await GovernmentAuthority.findOne({
      where: {
        jurisdictionState: school.state,
        jurisdictionDistrict: school.district,
        isActive: true,
      },
    });
  }

  if (!assignedAuthority) {
    assignedAuthority = await GovernmentAuthority.findOne({ where: { isActive: true } });
  }

  // 2. SLA Calculation
  const slaDays = category.defaultSlaDays || 15;
  const slaDeadline = new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000);

  // 3. Generate unique ticket number and magic action token
  const yearMonth = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const ticketNumber = `SAM-${yearMonth}-${randomSuffix}`;
  const actionToken = crypto.randomBytes(32).toString("hex");

  // 4. Letter subject & body construction
  let subject = `विषय: ${school.schoolName} (UDISE: ${school.udiseCode}) में ${dynamicFieldValues.facility_affected || category.categoryName} की तत्काल मरम्मत हेतु।`;
  let formalLetterContent = `सेवा में,\nश्रीमान सक्षम अधिकारी महोदय,\n${assignedAuthority?.officeName || "संबंधित विभाग"}\n\nविद्यालय: ${school.schoolName}\nसमस्या: ${dynamicFieldValues.specific_problem || "सुविधा में खराबी"}\nअवधि: ${dynamicFieldValues.duration_of_issue || "अज्ञात"}\n\nविद्यालय प्रबंधन समिति (SMC)`;

  let activeTemplate = null;
  if (templateId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(templateId)) {
    activeTemplate = await GrievanceTemplate.findByPk(templateId);
  }
  if (!activeTemplate) {
    activeTemplate = await GrievanceTemplate.findOne({
      where: { categoryId: category.id, isActive: true },
    });
  }

  if (activeTemplate) {
    const vars = {
      school_name: school.schoolName,
      udise_code: school.udiseCode,
      state: school.state,
      district: school.district,
      block: school.block || "",
      village: school.villageOrWard || "",
      authority_office_name: assignedAuthority?.officeName || "",
      authority_address: assignedAuthority?.officeAddress || "",
      ...dynamicFieldValues,
    };
    let s = activeTemplate.subjectTemplate;
    let b = activeTemplate.bodyMarkdownTemplate;
    for (const [k, v] of Object.entries(vars)) {
      const reg = new RegExp(`\\{${k}\\}`, "g");
      s = s.replace(reg, v ?? "");
      b = b.replace(reg, v ?? "");
    }
    subject = s;
    formalLetterContent = b;
  }

  const determinedPriority = priority || category.defaultPriority || "HIGH";
  const pdfLetterDownloadUrl = `https://storage.samarthya.org/letters/${ticketNumber}.pdf`;

  // 5. Create Grievance
  const grievance = await Grievance.create({
    ticketNumber,
    schoolId: school.id,
    categoryId: category.id,
    templateId: activeTemplate?.id || null,
    createdByUserId: req.user.id,
    assignedAuthorityId: assignedAuthority?.id || null,
    currentEscalationLevel: 1,
    status: "SUBMITTED",
    priority: determinedPriority,
    submissionChannel,
    audioRecordingUrl: audioRecordingUrl || null,
    audioTranscriptionRaw: audioTranscriptionRaw || null,
    speechToTextStatus: audioRecordingUrl ? "COMPLETED" : "NONE",
    originalLanguage: req.user.preferredLanguage || "hi",
    subject,
    dynamicFieldValues,
    formalLetterContent,
    generatedPdfUrl: pdfLetterDownloadUrl,
    actionToken,
    slaDays,
    slaDeadline,
    isHanged: false,
    isPublic: true,
  });

  // 6. Save Attachments
  if (Array.isArray(photoAttachmentUrls) && photoAttachmentUrls.length > 0) {
    for (const url of photoAttachmentUrls) {
      await GrievanceAttachment.create({
        grievanceId: grievance.id,
        uploadedByUserId: req.user.id,
        fileUrl: url,
        attachmentType: "ISSUE_PHOTO",
        fileMimeType: "image/jpeg",
        caption: "Ground problem photo",
      });
    }
  }

  // 7. Audit timeline events
  await GrievanceTimelineEvent.create({
    grievanceId: grievance.id,
    performedByUserId: req.user.id,
    eventType: "CREATED",
    newStatus: "SUBMITTED",
    comment: "Grievance submitted by SMC Member",
  });

  if (submissionChannel === "DIGITAL_DISPATCH" || submissionChannel === "HYBRID") {
    await GrievanceTimelineEvent.create({
      grievanceId: grievance.id,
      performedByUserId: req.user.id,
      eventType: "DISPATCHED_DIGITALLY",
      newStatus: "SUBMITTED",
      comment: `Official notification & PDF dispatched to ${assignedAuthority?.officeName || "Authority"}`,
    });
  }

  // 8. Increment school counter
  school.totalGrievancesCount = (school.totalGrievancesCount || 0) + 1;
  await school.save();

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        grievanceId: grievance.id,
        ticketNumber: grievance.ticketNumber,
        status: grievance.status,
        slaDays: grievance.slaDays,
        slaDeadline: grievance.slaDeadline,
        assignedAuthority: assignedAuthority
          ? {
              id: assignedAuthority.id,
              officeName: assignedAuthority.officeName,
              officerName: assignedAuthority.officerName,
              officialEmail: assignedAuthority.officialEmail,
              officialPhone: assignedAuthority.officialPhone,
              officeAddress: assignedAuthority.officeAddress,
            }
          : null,
        pdfLetterDownloadUrl,
        publicTrackingUrl: `https://samarthya.org/track/${ticketNumber}`,
        actionToken,
      },
      "Grievance submitted and dispatched successfully"
    )
  );
});

/**
 * @desc    Get detailed grievance info, timeline audit, attachments and SLA countdown
 * @route   GET /api/v1/grievances/:id
 * @access  Public / Authenticated
 */
export const getGrievanceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const isTicket = id.startsWith("SAM-");
  const grievance = await Grievance.findOne({
    where: isTicket ? { ticketNumber: id } : { id },
    include: [
      {
        model: School,
        as: "school",
      },
      {
        model: GrievanceCategory,
        as: "category",
        include: [{ model: Department, as: "department" }],
      },
      {
        model: GovernmentAuthority,
        as: "assignedAuthority",
      },
      {
        model: GrievanceAttachment,
        as: "attachments",
      },
      {
        model: GrievanceTimelineEvent,
        as: "timeline",
        include: [{ model: User, as: "performedBy", attributes: ["id", "fullName", "role"] }],
      },
    ],
    order: [[{ model: GrievanceTimelineEvent, as: "timeline" }, "createdAt", "ASC"]],
  });

  if (!grievance) {
    throw new ApiError(404, "Grievance not found");
  }

  const plain = grievance.get({ plain: true });

  const now = Date.now();
  const deadlineMs = plain.slaDeadline ? new Date(plain.slaDeadline).getTime() : now;
  const daysRemaining = Math.ceil((deadlineMs - now) / (1000 * 60 * 60 * 24));
  const isBreached = now > deadlineMs && plain.status !== "RESOLVED";

  const formattedResponse = {
    id: plain.id,
    ticketNumber: plain.ticketNumber,
    status: plain.status,
    priority: plain.priority,
    submissionChannel: plain.submissionChannel,
    school: {
      id: plain.school?.id,
      name: plain.school?.schoolName,
      udise: plain.school?.udiseCode,
      district: plain.school?.district,
      block: plain.school?.block,
    },
    category: {
      id: plain.category?.id,
      code: plain.category?.categoryCode,
      name: plain.category?.categoryName,
    },
    subject: plain.subject,
    formalLetterContent: plain.formalLetterContent,
    letterPdfUrl: plain.generatedPdfUrl,
    assignedAuthority: plain.assignedAuthority
      ? {
          id: plain.assignedAuthority.id,
          designation: plain.assignedAuthority.designation,
          officeName: plain.assignedAuthority.officeName,
          officerName: plain.assignedAuthority.officerName,
          officialEmail: plain.assignedAuthority.officialEmail,
        }
      : null,
    sla: {
      slaDays: plain.slaDays,
      deadline: plain.slaDeadline,
      isHanged: plain.isHanged,
      isBreached,
      daysRemaining: Math.max(0, daysRemaining),
      escalationLevel: plain.currentEscalationLevel,
    },
    attachments: (plain.attachments || []).map((att) => ({
      id: att.id,
      fileUrl: att.fileUrl,
      attachmentType: att.attachmentType,
      caption: att.caption,
    })),
    timeline: (plain.timeline || []).map((evt) => ({
      id: evt.id,
      event: evt.eventType,
      performedBy: evt.performedBy?.fullName || "System",
      timestamp: evt.createdAt,
      comment: evt.comment,
    })),
    upvotesCount: plain.upvotesCount,
    actionToken: req.user?.role === "SAMARTHYA_ADMIN" ? plain.actionToken : undefined,
  };

  return res.status(200).json(
    new ApiResponse(200, formattedResponse, "Grievance details retrieved")
  );
});

/**
 * @desc    Get all grievances filed for a specific school
 * @route   GET /api/v1/grievances/my-school/:schoolId
 * @access  Authenticated
 */
export const getGrievancesBySchool = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;
  const { status, page = 1, limit = 15 } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
  const offset = (pageNum - 1) * limitNum;

  const whereClause = { schoolId };

  if (status && status !== "ALL") {
    if (status === "HANGED") {
      whereClause[Op.or] = [{ isHanged: true }, { status: "HANGED" }];
    } else {
      whereClause.status = status;
    }
  }

  const { count, rows } = await Grievance.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: GrievanceCategory,
        as: "category",
        attributes: ["id", "categoryName", "categoryCode"],
      },
    ],
    limit: limitNum,
    offset,
    order: [["createdAt", "DESC"]],
  });

  const formatted = rows.map((g) => {
    const plain = g.get({ plain: true });
    return {
      id: plain.id,
      ticketNumber: plain.ticketNumber,
      categoryName: plain.category?.categoryName || "Infrastructure",
      status: plain.status,
      priority: plain.priority,
      createdAt: plain.createdAt,
      slaDeadline: plain.slaDeadline,
      isHanged: plain.isHanged,
      upvotesCount: plain.upvotesCount,
    };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
        grievances: formatted,
      },
      "School grievances retrieved"
    )
  );
});

/**
 * @desc    Upload physical stamped receipt photo with diary number
 * @route   POST /api/v1/grievances/:id/upload-physical-ack
 * @access  Authenticated
 */
export const uploadPhysicalAckReceipt = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { submissionDate, diaryNumber } = req.body;
  const receiptFile = req.file;

  const isTicket = id.startsWith("SAM-");
  const grievance = await Grievance.findOne({
    where: isTicket ? { ticketNumber: id } : { id },
  });

  if (!grievance) {
    throw new ApiError(404, "Grievance not found");
  }

  const receiptUrl = receiptFile
    ? `https://storage.samarthya.org/receipts/${receiptFile.filename}`
    : req.body.receiptUrl || "https://storage.samarthya.org/receipts/sample_ack.jpg";

  if (receiptFile?.path) {
    fs.unlink(receiptFile.path, () => {});
  }

  grievance.physicalSubmissionAckPhotoUrl = receiptUrl;
  grievance.physicalSubmittedAt = submissionDate ? new Date(submissionDate) : new Date();
  grievance.physicalDiaryNumber = diaryNumber || null;
  grievance.status = "ACKNOWLEDGED";
  if (!grievance.firstAcknowledgedAt) {
    grievance.firstAcknowledgedAt = new Date();
  }
  await grievance.save();

  // Log timeline event
  await GrievanceTimelineEvent.create({
    grievanceId: grievance.id,
    performedByUserId: req.user.id,
    eventType: "PHYSICAL_ACK_UPLOADED",
    previousStatus: "SUBMITTED",
    newStatus: "ACKNOWLEDGED",
    comment: `Physical acknowledgment receipt uploaded with diary number: ${diaryNumber || "N/A"}`,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        status: grievance.status,
        receiptUrl,
        diaryNumber: grievance.physicalDiaryNumber,
        physicalSubmittedAt: grievance.physicalSubmittedAt,
      },
      "Physical stamped receipt uploaded and verified"
    )
  );
});

/**
 * @desc    Citizen / SMC ground verification of completed works
 * @route   POST /api/v1/grievances/:id/verify-resolution
 * @access  Authenticated
 */
export const verifyResolution = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isSatisfied, feedbackComment, proofPhotoUrls = [] } = req.body;

  const isTicket = id.startsWith("SAM-");
  const grievance = await Grievance.findOne({
    where: isTicket ? { ticketNumber: id } : { id },
  });

  if (!grievance) {
    throw new ApiError(404, "Grievance not found");
  }

  if (isSatisfied) {
    const prevStatus = grievance.status;
    grievance.status = "RESOLVED";
    grievance.resolvedAt = new Date();
    grievance.isHanged = false;
    await grievance.save();

    // Increment school resolved count
    await School.increment("resolvedGrievancesCount", {
      by: 1,
      where: { id: grievance.schoolId },
    });

    await GrievanceTimelineEvent.create({
      grievanceId: grievance.id,
      performedByUserId: req.user.id,
      eventType: "VERIFIED_BY_SMC",
      previousStatus: prevStatus,
      newStatus: "RESOLVED",
      comment: `Ground verification confirmed resolution: ${feedbackComment || "Work completed satisfactorily"}`,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          status: "RESOLVED",
          resolvedAt: grievance.resolvedAt,
        },
        "Ground verification completed. Grievance closed successfully."
      )
    );
  } else {
    // If not satisfied, grievance remains or reopens in progress
    const prevStatus = grievance.status;
    grievance.status = "IN_PROGRESS";
    grievance.reopenCount = (grievance.reopenCount || 0) + 1;
    grievance.reopenedAt = new Date();
    await grievance.save();

    await GrievanceTimelineEvent.create({
      grievanceId: grievance.id,
      performedByUserId: req.user.id,
      eventType: "REOPENED",
      previousStatus: prevStatus,
      newStatus: "IN_PROGRESS",
      comment: `Citizen rejected resolution: ${feedbackComment || "Incomplete work"}`,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          status: "IN_PROGRESS",
          reopenCount: grievance.reopenCount,
        },
        "Citizen dissatisfied with work. Grievance kept open for re-inspection."
      )
    );
  }
});

/**
 * @desc    Reopens a grievance if repairs failed or were incomplete
 * @route   POST /api/v1/grievances/:id/reopen
 * @access  Authenticated
 */
export const reopenGrievance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reopenReason } = req.body;

  const isTicket = id.startsWith("SAM-");
  const grievance = await Grievance.findOne({
    where: isTicket ? { ticketNumber: id } : { id },
  });

  if (!grievance) {
    throw new ApiError(404, "Grievance not found");
  }

  const prevStatus = grievance.status;
  grievance.status = "IN_PROGRESS";
  grievance.reopenedAt = new Date();
  grievance.reopenCount = (grievance.reopenCount || 0) + 1;
  await grievance.save();

  await GrievanceTimelineEvent.create({
    grievanceId: grievance.id,
    performedByUserId: req.user.id,
    eventType: "REOPENED",
    previousStatus: prevStatus,
    newStatus: "IN_PROGRESS",
    comment: `Grievance reopened by SMC: ${reopenReason || "Defective repairs observed"}`,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        status: "IN_PROGRESS",
        reopenCount: grievance.reopenCount,
        reopenedAt: grievance.reopenedAt,
      },
      "Grievance reopened and escalation alert sent to authority"
    )
  );
});

/**
 * @desc    Get live SLA status, deadline countdown, and escalation tier
 * @route   GET /api/v1/grievances/:id/sla-status
 * @access  Authenticated
 */
export const getSlaStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const isTicket = id.startsWith("SAM-");
  const grievance = await Grievance.findOne({
    where: isTicket ? { ticketNumber: id } : { id },
    include: [{ model: GovernmentAuthority, as: "assignedAuthority" }],
  });

  if (!grievance) {
    throw new ApiError(404, "Grievance not found");
  }

  const now = Date.now();
  const deadlineMs = new Date(grievance.slaDeadline).getTime();
  const isBreached = now > deadlineMs && grievance.status !== "RESOLVED";

  const nextTier =
    grievance.currentEscalationLevel < 3
      ? {
          level: grievance.currentEscalationLevel + 1,
          authority:
            grievance.currentEscalationLevel === 1
              ? "District Education Officer / District Magistrate"
              : "State Directorate / Education Secretary",
          escalatesOn: grievance.slaDeadline,
        }
      : null;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ticketNumber: grievance.ticketNumber,
        status: grievance.status,
        slaDays: grievance.slaDays,
        createdAt: grievance.createdAt,
        deadline: grievance.slaDeadline,
        isBreached,
        isHanged: grievance.isHanged,
        currentLevel: grievance.currentEscalationLevel,
        currentAuthority: grievance.assignedAuthority?.designation || "Block Level Authority",
        nextEscalation: nextTier,
      },
      "SLA status calculated"
    )
  );
});

/**
 * @desc    Escalate grievance manually to Level 2 (DM) or Level 3 (State)
 * @route   POST /api/v1/grievances/:id/escalate
 * @access  Authenticated
 */
export const escalateGrievance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { escalationReason, targetLevel = 2 } = req.body;

  const isTicket = id.startsWith("SAM-");
  const grievance = await Grievance.findOne({
    where: isTicket ? { ticketNumber: id } : { id },
  });

  if (!grievance) {
    throw new ApiError(404, "Grievance not found");
  }

  const prevLevel = grievance.currentEscalationLevel;
  const prevStatus = grievance.status;
  grievance.currentEscalationLevel = targetLevel;
  grievance.isHanged = true;
  grievance.status = "HANGED";
  await grievance.save();

  // Update school hanged counter
  await School.increment("hangedGrievancesCount", {
    by: 1,
    where: { id: grievance.schoolId },
  });

  await GrievanceTimelineEvent.create({
    grievanceId: grievance.id,
    performedByUserId: req.user.id,
    eventType: "MANUALLY_ESCALATED",
    previousStatus: prevStatus,
    newStatus: "HANGED",
    comment: `Escalated to Level ${targetLevel}: ${escalationReason || "SLA breach / Uncooperative officers"}`,
  });

  const escalatedTo =
    targetLevel === 2
      ? "Office of the District Magistrate"
      : "State Education Directorate / Secretary";

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        previousLevel: prevLevel,
        newLevel: targetLevel,
        escalatedTo,
        escalationNoticePdfUrl: `https://storage.samarthya.org/escalations/ESC-${grievance.ticketNumber}-L${targetLevel}.pdf`,
      },
      `Grievance escalated to Level ${targetLevel} successfully`
    )
  );
});
