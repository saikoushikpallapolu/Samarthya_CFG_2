import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { School, SmcMember } from "../models/index.js";

/**
 * =====================================================================
 * MEMBER 1: SCHOOL DISCOVERY & CITIZEN LOCATION SEARCH CONTROLLERS
 * =====================================================================
 */

// GET /api/v1/schools/search
export const searchSchools = asyncHandler(async (req, res) => {
  const { query, state, district, block, pincode, page = 1, limit = 20 } = req.query;
  // TODO: Member 1 - Query School model by UDISE, name, district, or block
  return res.status(200).json(
    new ApiResponse(
      200,
      { total: 0, page: Number(page), limit: Number(limit), schools: [] },
      "Schools fetched successfully"
    )
  );
});

// GET /api/v1/schools/nearby
export const getNearbySchools = asyncHandler(async (req, res) => {
  const { latitude, longitude, radiusKm = 5 } = req.query;
  // TODO: Member 1 - Calculate distance using Haversine formula on latitude/longitude
  return res.status(200).json(
    new ApiResponse(
      200,
      { userCoordinates: { latitude, longitude }, radiusKm, count: 0, schools: [] },
      "Nearby schools retrieved"
    )
  );
});

// GET /api/v1/schools/:id
export const getSchoolById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // TODO: Member 1 - Find school by UUID with SMC stats
  return res.status(200).json(
    new ApiResponse(200, { school: { id } }, "School details retrieved")
  );
});

// POST /api/v1/schools/:id/join-smc
export const joinSmcCommittee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { designation, studentChildName, studentChildGrade } = req.body;
  // TODO: Member 1 - Create SmcMember record linking req.user.id and schoolId
  return res.status(201).json(
    new ApiResponse(
      201,
      { schoolId: id, designation, isVerified: false },
      "SMC membership application submitted"
    )
  );
});
