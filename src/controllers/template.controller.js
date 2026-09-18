import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  GrievanceTemplate,
  GrievanceCategory,
  School,
  GovernmentAuthority,
  JurisdictionMapping,
} from "../models/index.js";

/**
 * Helper to interpolate template string with variables
 * @param {string} templateStr
 * @param {Record<string, string>} vars
 * @returns {string}
 */
const interpolate = (templateStr, vars) => {
  if (!templateStr) return "";
  let result = templateStr;
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`\\{${key}\\}`, "g");
    result = result.replace(regex, value ?? "");
  }
  return result;
};

/**
 * =====================================================================
 * MEMBER 2: GRIEVANCE TEMPLATES & LETTER PREVIEW CONTROLLERS
 * =====================================================================
 */

/**
 * @desc    Get official administrative template & required field schema by category and language
 * @route   GET /api/v1/templates/:categoryId
 * @access  Authenticated
 */
export const getTemplateByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { language = "hi" } = req.query;

  let template = await GrievanceTemplate.findOne({
    where: { categoryId, language, isActive: true },
  });

  // Fallback to Hindi or first available template if requested language template is missing
  if (!template) {
    template = await GrievanceTemplate.findOne({
      where: { categoryId, isActive: true },
    });
  }

  // General fallback to any active administrative template
  if (!template) {
    template = await GrievanceTemplate.findOne({
      where: { isActive: true },
    });
  }

  if (!template) {
    throw new ApiError(404, "Grievance template not found");
  }

  const responseData = {
    templateId: template.id,
    categoryId: template.categoryId,
    language: template.language,
    templateTitle: template.templateTitle,
    subjectTemplate: template.subjectTemplate,
    bodyMarkdownTemplate: template.bodyMarkdownTemplate,
    requiredVariables: template.requiredVariables,
    legalReferences: template.legalReferences,
  };

  return res.status(200).json(
    new ApiResponse(200, responseData, "Template fetched successfully")
  );
});

/**
 * @desc    Previews the rendered markdown and letterhead text before formal submission
 * @route   POST /api/v1/templates/preview-letter
 * @access  Authenticated
 */
export const previewLetter = asyncHandler(async (req, res) => {
  const { templateId, schoolId, dynamicFieldValues = {} } = req.body;

  if (!templateId || !schoolId) {
    throw new ApiError(400, "Both 'templateId' and 'schoolId' are required in request body");
  }

  let template = null;
  // If valid UUID format, lookup by primary key
  if (templateId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(templateId)) {
    template = await GrievanceTemplate.findByPk(templateId);
  }
  if (!template) {
    template = await GrievanceTemplate.findOne({ where: { isActive: true } });
  }
  if (!template) {
    throw new ApiError(404, "Template not found");
  }

  const school = await School.findByPk(schoolId);
  if (!school) {
    throw new ApiError(404, "School not found");
  }

  // Look up mapped authority for school's district and category
  let assignedAuthority = null;
  const mapping = await JurisdictionMapping.findOne({
    where: {
      categoryId: template.categoryId,
      state: school.state,
      district: school.district,
    },
  });

  if (mapping?.primaryAuthorityId) {
    assignedAuthority = await GovernmentAuthority.findByPk(mapping.primaryAuthorityId);
  }

  if (!assignedAuthority) {
    // Fallback: district-level authority in same state & district
    assignedAuthority = await GovernmentAuthority.findOne({
      where: {
        jurisdictionState: school.state,
        jurisdictionDistrict: school.district,
        isActive: true,
      },
    });
  }

  if (!assignedAuthority) {
    // General fallback
    assignedAuthority = await GovernmentAuthority.findOne({ where: { isActive: true } });
  }

  // Build dictionary of variables
  const variables = {
    school_name: school.schoolName,
    udise_code: school.udiseCode,
    state: school.state,
    district: school.district,
    block: school.block || "",
    village: school.villageOrWard || "",
    pincode: school.pincode || "",
    authority_office_name: assignedAuthority?.officeName || "संबंधित कार्यालय",
    authority_address: assignedAuthority?.officeAddress || "जिला मुख्यालय",
    authority_designation: assignedAuthority?.designation || "सक्षम अधिकारी",
    authority_officer_name: assignedAuthority?.officerName || "महोदय",
    ...dynamicFieldValues,
  };

  const renderedSubject = interpolate(template.subjectTemplate, variables);
  const renderedMarkdown = interpolate(template.bodyMarkdownTemplate, variables);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        renderedSubject,
        renderedMarkdown,
        assignedAuthority: assignedAuthority
          ? {
              id: assignedAuthority.id,
              designation: assignedAuthority.designation,
              officeName: assignedAuthority.officeName,
              officialEmail: assignedAuthority.officialEmail,
            }
          : null,
      },
      "Preview generated successfully"
    )
  );
});
