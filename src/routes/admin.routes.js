import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getBottleneckAnalytics,
  batchEscalateGrievances,
  exportReport,
} from "../controllers/admin.controller.js";

const router = Router();

/**
 * =====================================================================
 * MEMBER 2: SAMARTHYA ADMIN & MACRO DECISION-MAKING ROUTES
 * Base URL: /api/v1/admin
 * =====================================================================
 */

router.route("/analytics/bottlenecks").get(verifyJWT, getBottleneckAnalytics);
router.route("/escalate-batch").post(verifyJWT, batchEscalateGrievances);
router.route("/reports/export").get(verifyJWT, exportReport);

export default router;
