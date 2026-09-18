import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Grievance, School, GovernmentAuthority, SocialMediaCampaign } from "../models/index.js";

/**
 * =====================================================================
 * MEMBER 1: SOCIAL MEDIA ADVOCACY GENERATOR CONTROLLERS
 * =====================================================================
 */

// POST /api/v1/social/generate-post/:grievanceId
export const generateSocialPost = asyncHandler(async (req, res) => {
  const { grievanceId } = req.params;
  const { platform = "TWITTER_X" } = req.body;
  // TODO: Member 1 - Format urgent tweet/post tagging responsible department handles & MLAs
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        platform,
        postText: "🚨 Overdue grievance alert for government school! Track live: https://samarthya.org",
        taggedHandles: ["@EduMinOfIndia"],
        directShareUrl: "https://twitter.com/intent/tweet?text=...",
      },
      "Social media advocacy draft generated"
    )
  );
});
