import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getCategories,
  getDepartments,
  getAuthorities,
} from "../controllers/masterData.controller.js";

const router = Router();

/**
 * =====================================================================
 * MEMBER 2: MASTER DATA & DIRECTORY ROUTES
 * Base URL: /api/v1
 * =====================================================================
 */

router.route("/categories").get(getCategories);
router.route("/departments").get(getDepartments);
router.route("/authorities").get(verifyJWT, getAuthorities);

export default router;
