import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  Grievance,
  School,
  GovernmentAuthority,
  GrievanceCategory,
  Department,
  SocialMediaCampaign,
} from "../models/index.js";

/**
 * Determine official social media handles based on department and state jurisdiction
 * @param {string} state
 * @param {string} deptCode
 * @returns {Array<string>}
 */
const getTargetSocialHandles = (state = "", deptCode = "") => {
  const normState = state.toLowerCase();
  const normDept = deptCode.toUpperCase();

  const handles = ["@EduMinOfIndia"];

  if (normState.includes("delhi")) {
    handles.push("@CMODelhi", "@DirEdu_Delhi");
    if (normDept.includes("PHED") || normDept.includes("WATER")) {
      handles.push("@DelhiJalBoard");
    } else if (normDept.includes("PWD")) {
      handles.push("@PWD_Delhi");
    }
  } else if (normState.includes("haryana")) {
    handles.push("@CMOHaryana", "@DchryGov");
    if (normDept.includes("PHED") || normDept.includes("WATER")) {
      handles.push("@PHED_Haryana");
    } else if (normDept.includes("PWD")) {
      handles.push("@HaryanaPWD");
    }
  } else if (normState.includes("punjab")) {
    handles.push("@CMOPb", "@PunjabSchoolEdu");
  } else {
    handles.push("@MinistryWCD", "@PIB_India");
  }

  // Deduplicate
  return [...new Set(handles)];
};

/**
 * =====================================================================
 * MEMBER 1: SOCIAL MEDIA ADVOCACY GENERATOR CONTROLLER
 * =====================================================================
 */

/**
 * @desc    Generate pre-formatted advocacy posts with official tags and tracking link
 * @route   POST /api/v1/social/generate-post/:grievanceId
 * @access  Authenticated
 */
export const generateSocialPost = asyncHandler(async (req, res) => {
  const { grievanceId } = req.params;
  const { platform = "TWITTER_X" } = req.body;

  // Normalize platform enum
  const validPlatforms = ["TWITTER_X", "WHATSAPP_SHARE", "WHATSAPP", "FACEBOOK"];
  if (!validPlatforms.includes(platform.toUpperCase())) {
    throw new ApiError(
      400,
      "Invalid platform. Must be 'TWITTER_X', 'WHATSAPP_SHARE' (or 'WHATSAPP'), or 'FACEBOOK'"
    );
  }

  const normalizedPlatform =
    platform.toUpperCase() === "WHATSAPP" ? "WHATSAPP_SHARE" : platform.toUpperCase();

  // Find grievance with school, category, and authority
  const isTicket = grievanceId.startsWith("SAM-");
  const grievance = await Grievance.findOne({
    where: isTicket ? { ticketNumber: grievanceId } : { id: grievanceId },
    include: [
      {
        model: School,
        as: "school",
      },
      {
        model: GrievanceCategory,
        as: "category",
        include: [{ model: Department, as: "department" }],
      },
      {
        model: GovernmentAuthority,
        as: "assignedAuthority",
      },
    ],
  });

  if (!grievance) {
    throw new ApiError(404, "Grievance not found");
  }

  const school = grievance.school;
  const schoolName = school?.schoolName || "Government School";
  const udise = school?.udiseCode || "N/A";
  const state = school?.state || "India";
  const district = school?.district || "";
  const studentsCount = school?.totalStudentsEnrolled || 350;
  const categoryName = grievance.category?.categoryName || "Essential Facilities";
  const deptCode = grievance.category?.department?.departmentCode || "";

  const daysPending = Math.max(
    1,
    Math.floor((Date.now() - new Date(grievance.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  );

  const trackingUrl = `https://samarthya.org/track/${grievance.ticketNumber}`;
  const taggedHandles = getTargetSocialHandles(state, deptCode);
  const tagsString = taggedHandles.join(" ");

  let postText = "";
  let directShareUrl = "";

  if (normalizedPlatform === "TWITTER_X") {
    postText = `🚨 Over ${daysPending} days and NO ACTION! ${schoolName} (UDISE: ${udise}) in ${district} has pending issues regarding ${categoryName} affecting ${studentsCount} students. Multiple requests have gone unheeded. Requesting urgent intervention by ${tagsString}. Track live status: ${trackingUrl} #Samarthya #RightToEducation #PublicSchools`;

    // Limit length if necessary for tweet
    directShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}`;
  } else if (normalizedPlatform === "WHATSAPP_SHARE") {
    postText = `📢 *Urgent Citizen Appeal for Government School!* \n\n🏫 *School:* ${schoolName} (UDISE: ${udise})\n📍 *Location:* ${district}, ${state}\n⚠️ *Issue:* ${categoryName} - ${grievance.subject}\n⏳ *Pending Duration:* ${daysPending} days\n⚡ *Status:* ${grievance.status}\n\nPlease support our community school by tracking and upvoting this grievance:\n👉 ${trackingUrl}\n\n#Samarthya #RightToEducation #EmpowerSMC`;

    directShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(postText)}`;
  } else if (normalizedPlatform === "FACEBOOK") {
    postText = `URGENT ACTION NEEDED: For over ${daysPending} days, students at ${schoolName} (District: ${district}) have faced issues regarding ${categoryName}. Despite formal submissions, the matter remains unresolved. Join the community in demanding accountable governance for our children. Track and support: ${trackingUrl} #Samarthya #RightToEducation`;

    directShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      trackingUrl
    )}&quote=${encodeURIComponent(postText)}`;
  }

  // Record social media campaign generation in database
  await SocialMediaCampaign.create({
    grievanceId: grievance.id,
    createdByUserId: req.user.id,
    platform: normalizedPlatform,
    postText,
    taggedHandles,
    shareUrl: directShareUrl,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        platform: normalizedPlatform,
        postText,
        taggedHandles,
        directShareUrl,
        previewCardImageUrl: `https://api.samarthya.org/cards/${grievance.ticketNumber}.png`,
      },
      "Social media advocacy draft generated"
    )
  );
});
