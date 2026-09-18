import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  submitGrievance,
  getGrievanceById,
  getGrievancesBySchool,
  uploadPhysicalAckReceipt,
  verifyResolution,
  reopenGrievance,
  getSlaStatus,
  escalateGrievance,
} from "../controllers/grievance.controller.js";

const router = Router();

/**
 * =====================================================================
 * MEMBER 2: GRIEVANCE LIFECYCLE & SLA ESCALATION ROUTES
 * Base URL: /api/v1/grievances
 * =====================================================================
 */

router.route("/").post(verifyJWT, submitGrievance);
router.route("/my-school/:schoolId").get(verifyJWT, getGrievancesBySchool);
router.route("/:id").get(getGrievanceById);
router
  .route("/:id/upload-physical-ack")
  .post(verifyJWT, upload.single("receiptPhoto"), uploadPhysicalAckReceipt);
router.route("/:id/verify-resolution").post(verifyJWT, verifyResolution);
router.route("/:id/reopen").post(verifyJWT, reopenGrievance);
router.route("/:id/sla-status").get(verifyJWT, getSlaStatus);
router.route("/:id/escalate").post(verifyJWT, escalateGrievance);

export default router;
