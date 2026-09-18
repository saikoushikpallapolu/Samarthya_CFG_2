import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  requestOtp,
  verifyOtp,
  refreshAccessToken,
  getCurrentUser,
  updateLanguage,
  logoutUser,
} from "../controllers/auth.controller.js";

const router = Router();

/**
 * =====================================================================
 * MEMBER 1: AUTHENTICATION & USER PROFILE ROUTES
 * Base URL: /api/v1/auth
 * =====================================================================
 */

router.route("/request-otp").post(requestOtp);
router.route("/verify-otp").post(verifyOtp);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-language").patch(verifyJWT, updateLanguage);
router.route("/logout").post(verifyJWT, logoutUser);

export default router;
