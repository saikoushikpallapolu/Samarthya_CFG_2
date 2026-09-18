import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { generateSocialPost } from "../controllers/social.controller.js";

const router = Router();

/**
 * =====================================================================
 * MEMBER 1: SOCIAL MEDIA ADVOCACY GENERATOR ROUTES
 * Base URL: /api/v1/social
 * =====================================================================
 */

router.route("/generate-post/:grievanceId").post(verifyJWT, generateSocialPost);

export default router;
