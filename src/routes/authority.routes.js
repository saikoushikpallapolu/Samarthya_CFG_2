import { Router } from "express";
import {
  getAuthorityGrievanceByToken,
  acknowledgeGrievanceByToken,
  updateStatusByToken,
  forwardGrievanceByToken,
} from "../controllers/authority.controller.js";

const router = Router();

/**
 * =====================================================================
 * MEMBER 2: GOVERNMENT AUTHORITY 1-CLICK ACTION ROUTES (MAGIC LINK)
 * Base URL: /api/v1/authority
 * =====================================================================
 */

router.route("/grievances/:actionToken").get(getAuthorityGrievanceByToken);
router
  .route("/grievances/:actionToken/acknowledge")
  .post(acknowledgeGrievanceByToken);
router
  .route("/grievances/:actionToken/update-status")
  .post(updateStatusByToken);
router
  .route("/grievances/:actionToken/forward")
  .post(forwardGrievanceByToken);

export default router;
