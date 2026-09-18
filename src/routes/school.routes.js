import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  searchSchools,
  getNearbySchools,
  getSchoolById,
  joinSmcCommittee,
} from "../controllers/school.controller.js";

const router = Router();

/**
 * =====================================================================
 * MEMBER 1: SCHOOL DISCOVERY & CITIZEN LOCATION SEARCH ROUTES
 * Base URL: /api/v1/schools
 * =====================================================================
 */

router.route("/search").get(searchSchools);
router.route("/nearby").get(getNearbySchools);
router.route("/:id").get(getSchoolById);
router.route("/:id/join-smc").post(verifyJWT, joinSmcCommittee);

export default router;
