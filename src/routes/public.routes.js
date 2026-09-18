import { Router } from "express";
import {
  getPublicDashboardStats,
  getPublicGrievances,
  upvoteGrievance,
} from "../controllers/public.controller.js";

const router = Router();

/**
 * =====================================================================
 * MEMBER 1: PUBLIC CITIZEN TRANSPARENCY & UPVOTING ROUTES
 * Base URL: /api/v1/public
 * =====================================================================
 */

router.route("/dashboard-stats").get(getPublicDashboardStats);
router.route("/grievances").get(getPublicGrievances);
router.route("/grievances/:id/upvote").post(upvoteGrievance);

export default router;
