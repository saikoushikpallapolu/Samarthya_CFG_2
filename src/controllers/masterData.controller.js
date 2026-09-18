import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { GrievanceCategory, Department, GovernmentAuthority } from "../models/index.js";

/**
 * =====================================================================
 * MEMBER 2: MASTER DATA & DIRECTORY CONTROLLERS
 * =====================================================================
 */

// GET /api/v1/categories
export const getCategories = asyncHandler(async (req, res) => {
  const { language = "hi" } = req.query;
  // TODO: Member 2 - Fetch all active grievance categories with translated names
  const categories = await GrievanceCategory.findAll({ where: { isActive: true } });
  return res.status(200).json(
    new ApiResponse(200, categories, "Categories retrieved successfully")
  );
});

// GET /api/v1/departments
export const getDepartments = asyncHandler(async (req, res) => {
  // TODO: Member 2 - Fetch all departments (DOE, PWD, DJB, etc.)
  const departments = await Department.findAll();
  return res.status(200).json(
    new ApiResponse(200, departments, "Departments retrieved successfully")
  );
});

// GET /api/v1/authorities
export const getAuthorities = asyncHandler(async (req, res) => {
  const { state, district, block, departmentId } = req.query;
  // TODO: Member 2 - Search official government authorities directory by geography
  return res.status(200).json(
    new ApiResponse(200, [], "Authorities fetched successfully")
  );
});
