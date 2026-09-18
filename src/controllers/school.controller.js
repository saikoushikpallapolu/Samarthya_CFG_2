import { Op, Sequelize } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { School, SmcMember, Grievance } from "../models/index.js";

/**
 * =====================================================================
 * MEMBER 1: SCHOOL DISCOVERY & CITIZEN LOCATION SEARCH CONTROLLERS
 * =====================================================================
 */

/**
 * @desc    Search schools by UDISE code, school name, district, or block
 * @route   GET /api/v1/schools/search
 * @access  Public
 */
export const searchSchools = asyncHandler(async (req, res) => {
  const {
    query,
    state,
    district,
    block,
    pincode,
    page = 1,
    limit = 20,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const whereClause = {};

  if (query && query.trim()) {
    const q = `%${query.trim()}%`;
    whereClause[Op.or] = [
      { udiseCode: { [Op.iLike]: q } },
      { schoolName: { [Op.iLike]: q } },
      { villageOrWard: { [Op.iLike]: q } },
      { district: { [Op.iLike]: q } },
    ];
  }

  if (state && state.trim()) {
    whereClause.state = { [Op.iLike]: `%${state.trim()}%` };
  }
  if (district && district.trim()) {
    whereClause.district = { [Op.iLike]: `%${district.trim()}%` };
  }
  if (block && block.trim()) {
    whereClause.block = { [Op.iLike]: `%${block.trim()}%` };
  }
  if (pincode && pincode.trim()) {
    whereClause.pincode = pincode.trim();
  }

  const { count, rows } = await School.findAndCountAll({
    where: whereClause,
    limit: limitNum,
    offset,
    order: [["schoolName", "ASC"]],
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
        schools: rows,
      },
      "Schools fetched successfully"
    )
  );
});

/**
 * @desc    Find government schools within a specified GPS radius using Haversine formula
 * @route   GET /api/v1/schools/nearby
 * @access  Public
 */
export const getNearbySchools = asyncHandler(async (req, res) => {
  const { latitude, longitude, radiusKm = 10 } = req.query;

  if (latitude === undefined || longitude === undefined) {
    throw new ApiError(400, "Both latitude and longitude query parameters are required");
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const radius = Math.min(50, Math.max(1, parseFloat(radiusKm) || 10));

  if (isNaN(lat) || lat < -90 || lat > 90) {
    throw new ApiError(400, "Invalid latitude. Must be between -90 and 90");
  }
  if (isNaN(lng) || lng < -180 || lng > 180) {
    throw new ApiError(400, "Invalid longitude. Must be between -180 and 180");
  }

  // Haversine formula calculation in PostgreSQL
  const haversineSql = `
    (6371 * acos(
      LEAST(1.0, GREATEST(-1.0,
        cos(radians(${lat})) * cos(radians("latitude")) *
        cos(radians("longitude") - radians(${lng})) +
        sin(radians(${lat})) * sin(radians("latitude"))
      ))
    ))
  `;

  const schools = await School.findAll({
    attributes: {
      include: [[Sequelize.literal(haversineSql), "distanceKm"]],
    },
    where: {
      latitude: { [Op.ne]: null },
      longitude: { [Op.ne]: null },
      [Op.and]: [Sequelize.literal(`${haversineSql} <= ${radius}`)],
    },
    order: [[Sequelize.literal(haversineSql), "ASC"]],
    limit: 50,
  });

  const formattedSchools = schools.map((s) => {
    const plain = s.get({ plain: true });
    return {
      ...plain,
      distanceKm: plain.distanceKm ? Number(Number(plain.distanceKm).toFixed(2)) : null,
    };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        userCoordinates: { latitude: lat, longitude: lng },
        radiusKm: radius,
        count: formattedSchools.length,
        schools: formattedSchools,
      },
      "Nearby schools retrieved"
    )
  );
});

/**
 * @desc    Get detailed school information, live grievance stats & SMC committee count
 * @route   GET /api/v1/schools/:id
 * @access  Public
 */
export const getSchoolById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Support both UUID and UDISE code lookup
  const isUdise = /^\d{11}$/.test(id.trim());
  const whereClause = isUdise ? { udiseCode: id.trim() } : { id: id.trim() };

  const school = await School.findOne({ where: whereClause });

  if (!school) {
    throw new ApiError(404, "School not found with given identifier");
  }

  // Compute live grievance counts from the database
  const totalGrievances = await Grievance.count({ where: { schoolId: school.id } });
  const resolved = await Grievance.count({
    where: { schoolId: school.id, status: "RESOLVED" },
  });
  const inProgress = await Grievance.count({
    where: { schoolId: school.id, status: ["SUBMITTED", "ACKNOWLEDGED", "UNDER_INSPECTION", "IN_PROGRESS"] },
  });
  const hanged = await Grievance.count({
    where: { schoolId: school.id, isHanged: true },
  });

  const activeSmcMembersCount = await SmcMember.count({
    where: { schoolId: school.id },
  });

  const resolutionRatePercentage =
    totalGrievances > 0 ? Number(((resolved / totalGrievances) * 100).toFixed(2)) : 0;

  const schoolData = {
    ...school.get({ plain: true }),
    stats: {
      totalGrievances,
      resolved,
      inProgress,
      hanged,
      resolutionRatePercentage,
    },
    activeSmcMembersCount,
  };

  return res.status(200).json(
    new ApiResponse(200, { school: schoolData }, "School details retrieved")
  );
});

/**
 * @desc    Apply to join a school's School Management Committee (SMC)
 * @route   POST /api/v1/schools/:id/join-smc
 * @access  Authenticated
 */
export const joinSmcCommittee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { designation = "PARENT_MEMBER", studentChildName, studentChildGrade } = req.body;

  const school = await School.findByPk(id);
  if (!school) {
    throw new ApiError(404, "School not found");
  }

  const validDesignations = [
    "PRESIDENT",
    "SECRETARY",
    "PARENT_MEMBER",
    "TEACHER_MEMBER",
    "HEADMASTER",
    "COMMUNITY_REPRESENTATIVE",
  ];

  if (!validDesignations.includes(designation)) {
    throw new ApiError(400, `Invalid designation. Must be one of: ${validDesignations.join(", ")}`);
  }

  // Check for existing membership
  const existingMembership = await SmcMember.findOne({
    where: {
      userId: req.user.id,
      schoolId: school.id,
    },
  });

  if (existingMembership) {
    throw new ApiError(400, "You are already registered as an SMC member for this school");
  }

  const membership = await SmcMember.create({
    userId: req.user.id,
    schoolId: school.id,
    designation,
    studentChildName: studentChildName?.trim() || null,
    studentChildGrade: studentChildGrade?.trim() || null,
    isVerified: req.user.role === "SAMARTHYA_ADMIN", // Auto-verify if admin, else pending
    verifiedAt: req.user.role === "SAMARTHYA_ADMIN" ? new Date() : null,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        membershipId: membership.id,
        schoolId: school.id,
        schoolName: school.schoolName,
        designation: membership.designation,
        isVerified: membership.isVerified,
        status: membership.isVerified ? "ACTIVE" : "PENDING_VERIFICATION",
      },
      "SMC membership application submitted for verification"
    )
  );
});
