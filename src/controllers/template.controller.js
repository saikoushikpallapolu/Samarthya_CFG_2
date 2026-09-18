import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { GrievanceTemplate, GrievanceCategory } from "../models/index.js";

/**
 * =====================================================================
 * MEMBER 2: GRIEVANCE TEMPLATES & LETTER PREVIEW CONTROLLERS
 * =====================================================================
 */

// GET /api/v1/templates/:categoryId
export const getTemplateByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { language = "hi" } = req.query;

  // TODO: Member 2 - Find active template for category & language
  const template = await GrievanceTemplate.findOne({
    where: { categoryId, language, isActive: true },
  });

  return res.status(200).json(
    new ApiResponse(200, template || { categoryId, language }, "Template fetched successfully")
  );
});

// POST /api/v1/templates/preview-letter
export const previewLetter = asyncHandler(async (req, res) => {
  const { templateId, schoolId, dynamicFieldValues } = req.body;

  // TODO: Member 2 - Interpolate template variables with school details and dynamic values
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        renderedSubject: "विषय: विद्यालय में सुविधा मरम्मत हेतु प्रार्थना पत्र।",
        renderedMarkdown: "सेवा में, श्रीमान...\n\nविद्यालय प्रबंधन समिति (SMC)",
      },
      "Preview generated successfully"
    )
  );
});
