import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getTemplateByCategory,
  previewLetter,
} from "../controllers/template.controller.js";

const router = Router();

/**
 * =====================================================================
 * MEMBER 2: GRIEVANCE TEMPLATES & LETTER PREVIEW ROUTES
 * Base URL: /api/v1/templates
 * =====================================================================
 */

router.route("/:categoryId").get(verifyJWT, getTemplateByCategory);
router.route("/category/:categoryId").get(verifyJWT, getTemplateByCategory);
router.route("/preview-letter").post(verifyJWT, previewLetter);

export default router;
