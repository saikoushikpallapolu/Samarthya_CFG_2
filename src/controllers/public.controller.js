import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Grievance, School, GrievanceUpvote, GrievanceCategory } from "../models/index.js";

/**
 * =====================================================================
 * MEMBER 1: PUBLIC CITIZEN TRANSPARENCY & UPVOTING CONTROLLERS
 * =====================================================================
 */

// GET /api/v1/public/dashboard-stats
export const getPublicDashboardStats = asyncHandler(async (req, res) => {
  // TODO: Member 1 - Aggregate totalSchools, grievances count, resolved, hanged
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalSchoolsEmpowered: 19240,
        totalGrievancesFiled: 0,
        totalResolved: 0,
        totalHanged: 0,
        resolutionRatePercentage: 0,
        categoryBreakdown: [],
      },
      "Public stats retrieved"
    )
  );
});

// GET /api/v1/public/grievances
export const getPublicGrievances = asyncHandler(async (req, res) => {
  const { state, district, status, category, page = 1, limit = 20 } = req.query;
  // TODO: Member 1 - Public search, filter by hanged/open status with pagination
  return res.status(200).json(
    new ApiResponse(
      200,
      { totalCount: 0, page: Number(page), limit: Number(limit), grievances: [] },
      "Public grievances feed fetched"
    )
  );
});

// POST /api/v1/public/grievances/:id/upvote
export const upvoteGrievance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { deviceFingerprint } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  // TODO: Member 1 - Prevent duplicate votes by IP/fingerprint, increment grievance.upvotesCount
  return res.status(200).json(
    new ApiResponse(200, { grievanceId: id, newUpvoteCount: 1 }, "Upvote recorded successfully")
  );
});
