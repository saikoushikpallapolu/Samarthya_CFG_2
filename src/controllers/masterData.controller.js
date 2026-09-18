import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { GrievanceCategory, Department, GovernmentAuthority } from "../models/index.js";

/**
 * =====================================================================
 * MEMBER 2: MASTER DATA & DIRECTORY CONTROLLERS
 * =====================================================================
 */

/**
 * @desc    Get all active grievance categories with multilingual titles and parent departments
 * @route   GET /api/v1/categories
 * @access  Public
 */
export const getCategories = asyncHandler(async (req, res) => {
  const { language = "hi" } = req.query;

  const categories = await GrievanceCategory.findAll({
    where: { isActive: true },
    include: [
      {
        model: Department,
        as: "department",
        attributes: ["id", "departmentCode", "departmentName"],
      },
    ],
    order: [["categoryName", "ASC"]],
  });

  const formattedCategories = categories.map((cat) => {
    const plain = cat.get({ plain: true });
    let localizedName = plain.categoryName;

    if (plain.nameTranslations && plain.nameTranslations[language]) {
      localizedName = plain.nameTranslations[language];
    }

    return {
      id: plain.id,
      categoryCode: plain.categoryCode,
      categoryName: localizedName,
      defaultSlaDays: plain.defaultSlaDays,
      defaultPriority: plain.defaultPriority,
      iconUrl: plain.iconUrl,
      description: plain.description,
      department: plain.department,
    };
  });

  return res.status(200).json(
    new ApiResponse(200, formattedCategories, "Categories retrieved successfully")
  );
});

/**
 * @desc    Get all government departments handling public school services
 * @route   GET /api/v1/departments
 * @access  Public
 */
export const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.findAll({
    attributes: ["id", "departmentCode", "departmentName", "description"],
    order: [["departmentName", "ASC"]],
  });

  return res.status(200).json(
    new ApiResponse(200, departments, "Departments retrieved")
  );
});

/**
 * @desc    Search official government authorities directory by geography and department
 * @route   GET /api/v1/authorities
 * @access  Authenticated
 */
export const getAuthorities = asyncHandler(async (req, res) => {
  const { state, district, block, departmentId } = req.query;

  if (!state || !district) {
    throw new ApiError(400, "Both 'state' and 'district' query parameters are required");
  }

  const whereClause = {
    isActive: true,
    jurisdictionState: { [Op.iLike]: `%${state.trim()}%` },
    jurisdictionDistrict: { [Op.iLike]: `%${district.trim()}%` },
  };

  if (block && block.trim()) {
    whereClause[Op.or] = [
      { jurisdictionBlock: { [Op.iLike]: `%${block.trim()}%` } },
      { jurisdictionBlock: null },
      { jurisdictionLevel: { [Op.in]: ["DISTRICT", "STATE"] } },
    ];
  }

  if (departmentId && departmentId.trim()) {
    whereClause.departmentId = departmentId.trim();
  }

  const authorities = await GovernmentAuthority.findAll({
    where: whereClause,
    include: [
      {
        model: Department,
        as: "department",
        attributes: ["id", "departmentCode", "departmentName"],
      },
    ],
    order: [
      ["jurisdictionLevel", "ASC"],
      ["designation", "ASC"],
    ],
  });

  const formattedAuthorities = authorities.map((a) => {
    const plain = a.get({ plain: true });
    return {
      id: plain.id,
      designation: plain.designation,
      officeName: plain.officeName,
      officerName: plain.officerName,
      jurisdictionLevel: plain.jurisdictionLevel,
      jurisdictionState: plain.jurisdictionState,
      jurisdictionDistrict: plain.jurisdictionDistrict,
      jurisdictionBlock: plain.jurisdictionBlock,
      officialEmail: plain.officialEmail,
      officialPhone: plain.officialPhone,
      officeAddress: plain.officeAddress,
      pincode: plain.pincode,
      department: plain.department,
    };
  });

  return res.status(200).json(
    new ApiResponse(200, formattedAuthorities, "Authorities fetched")
  );
});
