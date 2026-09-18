import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Grievance, School, GovernmentAuthority, GrievanceTimelineEvent } from "../models/index.js";

/**
 * =====================================================================
 * MEMBER 2: GOVERNMENT AUTHORITY 1-CLICK ACTION CONTROLLERS (MAGIC LINK)
 * =====================================================================
 */

// GET /api/v1/authority/grievances/:actionToken
export const getAuthorityGrievanceByToken = asyncHandler(async (req, res) => {
  const { actionToken } = req.params;
  // TODO: Member 2 - Look up grievance by unique actionToken without login
  const grievance = await Grievance.findOne({
    where: { actionToken },
    include: [{ model: School, as: "school" }],
  });

  if (!grievance) {
    throw new ApiError(404, "Invalid or expired authority action token");
  }

  return res.status(200).json(
    new ApiResponse(200, grievance, "Grievance details loaded for authority action")
  );
});

// POST /api/v1/authority/grievances/:actionToken/acknowledge
export const acknowledgeGrievanceByToken = asyncHandler(async (req, res) => {
  const { actionToken } = req.params;
  const { officerRemarks, tentativeResolutionDate } = req.body;
  // TODO: Member 2 - Mark status as ACKNOWLEDGED, record timestamp, notify SMC
  return res.status(200).json(
    new ApiResponse(
      200,
      { status: "ACKNOWLEDGED", acknowledgedAt: new Date() },
      "Official acknowledgment logged and SMC notified"
    )
  );
});

// POST /api/v1/authority/grievances/:actionToken/update-status
export const updateStatusByToken = asyncHandler(async (req, res) => {
  const { actionToken } = req.params;
  const { newStatus = "UNDER_INSPECTION", completionSummary, workOrderNumber, completionPhotoUrls } = req.body;
  // TODO: Member 2 - Update status, attach completion photos, log timeline event
  return res.status(200).json(
    new ApiResponse(
      200,
      { status: newStatus },
      "Work status updated. Notification sent to SMC for verification."
    )
  );
});

// POST /api/v1/authority/grievances/:actionToken/forward
export const forwardGrievanceByToken = asyncHandler(async (req, res) => {
  const { actionToken } = req.params;
  const { targetDepartmentId, reason } = req.body;
  // TODO: Member 2 - Reassign grievance to target department, log forwarding event
  return res.status(200).json(
    new ApiResponse(200, { status: "SUBMITTED" }, "Grievance forwarded to new department successfully")
  );
});
