import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { processAudioVoiceNote } from "../controllers/voice.controller.js";

const router = Router();

/**
 * =====================================================================
 * MEMBER 2: SPEECH-TO-TEXT (STT) AUDIO PROCESSING ROUTES
 * Base URL: /api/v1/voice
 * =====================================================================
 */

router.route("/process-audio").post(verifyJWT, upload.single("audio"), processAudioVoiceNote);

export default router;
