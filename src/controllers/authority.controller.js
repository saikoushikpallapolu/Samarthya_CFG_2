import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  Grievance,
  School,
  GovernmentAuthority,
  Department,
  GrievanceAttachment,
  GrievanceTimelineEvent,
  GrievanceCategory,
} from "../models/index.js";

/**
 * =====================================================================
 * MEMBER 2: GOVERNMENT AUTHORITY 1-CLICK ACTION CONTROLLERS (MAGIC LINK)
 * =====================================================================
 */

/**
 * @desc    Direct access view for government officers via signed magic link token (no login required)
 * @route   GET /api/v1/authority/grievances/:actionToken
 * @access  Public (Secured by 64-char action token)
 */
export const getAuthorityGrievanceByToken = asyncHandler(async (req, res) => {
  const { actionToken } = req.params;

  if (!actionToken || actionToken.length < 16) {
    throw new ApiError(400, "Invalid action token format");
  }

  const grievance = await Grievance.findOne({
    where: { actionToken },
    include: [
      {
        model: School,
        as: "school",
      },
      {
        model: GrievanceCategory,
        as: "category",
      },
      {
        model: GovernmentAuthority,
        as: "assignedAuthority",
      },
      {
        model: GrievanceAttachment,
        as: "attachments",
      },
    ],
  });

  if (!grievance) {
    throw new ApiError(404, "Invalid or expired authority action token");
  }

  const plain = grievance.get({ plain: true });

  const now = Date.now();
  const createdMs = new Date(plain.createdAt).getTime();
  const deadlineMs = plain.slaDeadline ? new Date(plain.slaDeadline).getTime() : now;

  const daysPending = Math.max(0, Math.floor((now - createdMs) / (1000 * 60 * 60 * 24)));
  const slaRemainingDays = Math.max(0, Math.ceil((deadlineMs - now) / (1000 * 60 * 60 * 24)));

  const responseData = {
    ticketNumber: plain.ticketNumber,
    status: plain.status,
    schoolName: plain.school?.schoolName || "Government School",
    udiseCode: plain.school?.udiseCode || "N/A",
    district: plain.school?.district || "N/A",
    block: plain.school?.block || "N/A",
    facilityAffected:
      plain.dynamicFieldValues?.facility_affected ||
      plain.category?.categoryName ||
      "Essential Facility",
    problemDescription:
      plain.dynamicFieldValues?.specific_problem ||
      plain.subject ||
      "Problem reported by SMC",
    daysPending,
    slaRemainingDays,
    attachments: (plain.attachments || []).map((att) => att.fileUrl),
    pdfLetterUrl: plain.generatedPdfUrl,
  };

  return res.status(200).json(
    new ApiResponse(200, responseData, "Grievance details loaded for authority action")
  );
});

/**
 * @desc    1-Click official acknowledgment by the designated department officer
 * @route   POST /api/v1/authority/grievances/:actionToken/acknowledge
 * @access  Public (Secured by action token)
 */
export const acknowledgeGrievanceByToken = asyncHandler(async (req, res) => {
  const { actionToken } = req.params;
  const { officerRemarks, tentativeResolutionDate } = req.body;

  const grievance = await Grievance.findOne({ where: { actionToken } });
  if (!grievance) {
    throw new ApiError(404, "Invalid or expired authority action token");
  }

  const prevStatus = grievance.status;
  grievance.status = "ACKNOWLEDGED";
  if (!grievance.firstAcknowledgedAt) {
    grievance.firstAcknowledgedAt = new Date();
  }
  await grievance.save();

  await GrievanceTimelineEvent.create({
    grievanceId: grievance.id,
    eventType: "ACKNOWLEDGED_BY_OFFICER",
    previousStatus: prevStatus,
    newStatus: "ACKNOWLEDGED",
    comment:
      officerRemarks ||
      "Grievance officially acknowledged by government department officer",
    eventMetadata: {
      tentativeResolutionDate: tentativeResolutionDate || null,
    },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ticketNumber: grievance.ticketNumber,
        status: grievance.status,
        acknowledgedAt: grievance.firstAcknowledgedAt,
      },
      "Official acknowledgment logged and SMC notified"
    )
  );
});

/**
 * @desc    Government official marks progress, attaches work order, or marks work completed
 * @route   POST /api/v1/authority/grievances/:actionToken/update-status
 * @access  Public (Secured by action token)
 */
export const updateStatusByToken = asyncHandler(async (req, res) => {
  const { actionToken } = req.params;
  const {
    newStatus = "UNDER_INSPECTION",
    completionSummary,
    workOrderNumber,
    completionPhotoUrls = [],
  } = req.body;

  const allowedStatuses = [
    "UNDER_INSPECTION",
    "IN_PROGRESS",
    "RESOLVED",
    "REJECTED",
  ];
  if (!allowedStatuses.includes(newStatus)) {
    throw new ApiError(
      400,
      `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`
    );
  }

  const grievance = await Grievance.findOne({ where: { actionToken } });
  if (!grievance) {
    throw new ApiError(404, "Invalid or expired authority action token");
  }

  const prevStatus = grievance.status;
  grievance.status = newStatus;

  if (newStatus === "RESOLVED") {
    grievance.resolvedAt = new Date();
    grievance.isHanged = false;
  }
  await grievance.save();

  // Attach completion proof photos if supplied
  if (Array.isArray(completionPhotoUrls) && completionPhotoUrls.length > 0) {
    for (const url of completionPhotoUrls) {
      await GrievanceAttachment.create({
        grievanceId: grievance.id,
        fileUrl: url,
        attachmentType: "RESOLUTION_PROOF",
        fileMimeType: "image/jpeg",
        caption: `Official completion proof (${workOrderNumber || "WO"})`,
      });
    }
  }

  const eventType =
    newStatus === "RESOLVED" ? "RESOLVED_BY_OFFICER" : "STATUS_UPDATED";

  const timelineEvent = await GrievanceTimelineEvent.create({
    grievanceId: grievance.id,
    eventType,
    previousStatus: prevStatus,
    newStatus,
    comment:
      completionSummary ||
      `Work status updated to ${newStatus} by responsible official`,
    eventMetadata: {
      workOrderNumber: workOrderNumber || null,
      completionPhotoUrls,
    },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        status: newStatus,
        timelineEventId: timelineEvent.id,
      },
      "Work status updated. Notification sent to SMC for verification."
    )
  );
});

/**
 * @desc    Forward grievance to another department if misrouted
 * @route   POST /api/v1/authority/grievances/:actionToken/forward
 * @access  Public (Secured by action token)
 */
export const forwardGrievanceByToken = asyncHandler(async (req, res) => {
  const { actionToken } = req.params;
  const { targetDepartmentId, reason } = req.body;

  if (!targetDepartmentId) {
    throw new ApiError(400, "targetDepartmentId is required to forward grievance");
  }

  const targetDept = await Department.findByPk(targetDepartmentId);
  if (!targetDept) {
    throw new ApiError(404, "Target department not found");
  }

  const grievance = await Grievance.findOne({
    where: { actionToken },
    include: [{ model: School, as: "school" }],
  });

  if (!grievance) {
    throw new ApiError(404, "Invalid or expired authority action token");
  }

  // Look for authority under target department in the same district
  const newAuthority = await GovernmentAuthority.findOne({
    where: {
      departmentId: targetDept.id,
      jurisdictionState: grievance.school?.state,
      jurisdictionDistrict: grievance.school?.district,
      isActive: true,
    },
  });

  if (newAuthority) {
    grievance.assignedAuthorityId = newAuthority.id;
  }

  const prevStatus = grievance.status;
  grievance.status = "SUBMITTED"; // reset to submitted under new authority
  await grievance.save();

  await GrievanceTimelineEvent.create({
    grievanceId: grievance.id,
    eventType: "STATUS_UPDATED",
    previousStatus: prevStatus,
    newStatus: "SUBMITTED",
    comment: `Forwarded to ${targetDept.departmentName}. Reason: ${reason || "Misrouted department"}`,
    eventMetadata: {
      forwardedToDepartment: targetDept.departmentName,
      reason: reason || "Misrouted",
    },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        newDepartment: targetDept.departmentName,
        status: grievance.status,
      },
      "Grievance forwarded to new department successfully"
    )
  );
});
