import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User, School, SmcMember } from "../models/index.js";
import { otpStore } from "../utils/otpStore.js";

/**
 * Standard HTTP cookie options for secure session management
 */
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

/**
 * Helper to normalize Indian phone numbers to +91XXXXXXXXXX format.
 * @param {string} phone
 * @returns {string}
 */
const normalizePhoneNumber = (phone) => {
  if (!phone) return "";
  let cleaned = String(phone).trim().replace(/[\s-]/g, "");
  if (!cleaned.startsWith("+91")) {
    if (cleaned.startsWith("91") && cleaned.length === 12) {
      cleaned = "+" + cleaned;
    } else if (cleaned.length === 10) {
      cleaned = "+91" + cleaned;
    }
  }
  return cleaned;
};

/**
 * Validates normalized Indian phone number format (+91 followed by 10 digits starting 6-9)
 * @param {string} phone
 * @returns {boolean}
 */
const isValidIndianPhone = (phone) => {
  return /^\+91[6-9]\d{9}$/.test(phone);
};

/**
 * Helper to fetch a user's associated schools with SMC memberships.
 * @param {string} userId
 * @returns {Promise<Array>}
 */
const getAssociatedSchoolsForUser = async (userId) => {
  const memberships = await SmcMember.findAll({
    where: { userId },
    include: [
      {
        model: School,
        as: "school",
        attributes: ["id", "schoolName", "udiseCode", "district", "block"],
      },
    ],
  });

  return memberships.map((m) => ({
    membershipId: m.id,
    schoolId: m.schoolId,
    schoolName: m.school?.schoolName || "",
    udiseCode: m.school?.udiseCode || "",
    district: m.school?.district || "",
    block: m.school?.block || "",
    designation: m.designation,
    studentChildName: m.studentChildName,
    studentChildGrade: m.studentChildGrade,
    isVerified: m.isVerified,
  }));
};

/**
 * =====================================================================
 * MEMBER 1: AUTHENTICATION & USER PROFILE CONTROLLERS
 * =====================================================================
 */

/**
 * @desc    Request 6-digit SMS OTP for passwordless login
 * @route   POST /api/v1/auth/request-otp
 * @access  Public
 */
export const requestOtp = asyncHandler(async (req, res) => {
  const { phoneNumber, language = "hi" } = req.body;

  if (!phoneNumber) {
    throw new ApiError(400, "Phone number is required", ["phoneNumber field is missing"]);
  }

  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  if (!isValidIndianPhone(normalizedPhone)) {
    throw new ApiError(400, "Invalid Indian mobile number format", [
      "Phone number must start with +91 followed by 10 digits (e.g. +919876543210)",
    ]);
  }

  const otpData = otpStore.generateOtp(normalizedPhone);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        phoneNumber: normalizedPhone,
        expiresInSeconds: otpData.expiresInSeconds,
        resendCooldownSeconds: otpData.resendCooldownSeconds,
      },
      "OTP sent successfully via SMS"
    )
  );
});

/**
 * @desc    Verify SMS OTP & Issue JWT Access and Refresh Tokens
 * @route   POST /api/v1/auth/verify-otp
 * @access  Public
 */
export const verifyOtp = asyncHandler(async (req, res) => {
  const { phoneNumber, otp, fullName } = req.body;

  if (!phoneNumber || !otp) {
    throw new ApiError(400, "Both phone number and OTP are required");
  }

  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  if (!isValidIndianPhone(normalizedPhone)) {
    throw new ApiError(400, "Invalid Indian mobile number format");
  }

  const isOtpValid = otpStore.verifyOtp(normalizedPhone, String(otp));

  if (!isOtpValid) {
    throw new ApiError(401, "Invalid or expired OTP. Please request a new one.", [
      "OTP mismatch or expired",
    ]);
  }

  // Find or create user profile
  let [user, created] = await User.findOrCreate({
    where: { phoneNumber: normalizedPhone },
    defaults: {
      phoneNumber: normalizedPhone,
      fullName: fullName?.trim() || "SMC Member",
      role: "SMC_MEMBER",
      preferredLanguage: "hi",
      isPhoneVerified: true,
      isActive: true,
      lastLoginAt: new Date(),
    },
  });

  if (!created) {
    user.isPhoneVerified = true;
    user.lastLoginAt = new Date();
    if (fullName && fullName.trim() && user.fullName === "SMC Member") {
      user.fullName = fullName.trim();
    }
  }

  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save();

  // Fetch associated schools
  const associatedSchools = await getAssociatedSchoolsForUser(user.id);

  const responseUserData = {
    id: user.id,
    phoneNumber: user.phoneNumber,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    preferredLanguage: user.preferredLanguage,
    isPhoneVerified: user.isPhoneVerified,
    associatedSchools,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          accessToken,
          refreshToken,
          user: responseUserData,
        },
        "Login successful"
      )
    );
});

/**
 * @desc    Refresh expired Access Token using Refresh Token
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request: Refresh token is required");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET || "samarthya-refresh-token-secret-key-2026-cfg"
    );

    const userId = decodedToken.id || decodedToken._id;
    const user = await User.findByPk(userId);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token: User not found");
    }

    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or has been revoked");
    }

    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    user.refreshToken = newRefreshToken;
    await user.save();

    return res
      .status(200)
      .cookie("accessToken", newAccessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid or expired refresh token");
  }
});

/**
 * @desc    Get profile and associated schools of currently logged in user
 * @route   GET /api/v1/auth/current-user
 * @access  Authenticated
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  const associatedSchools = await getAssociatedSchoolsForUser(user.id);

  const userData = {
    id: user.id,
    phoneNumber: user.phoneNumber,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    preferredLanguage: user.preferredLanguage,
    isPhoneVerified: user.isPhoneVerified,
    associatedSchools,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, { user: userData }, "Current user fetched successfully"));
});

/**
 * @desc    Update user interface and notification language preference
 * @route   PATCH /api/v1/auth/update-language
 * @access  Authenticated
 */
export const updateLanguage = asyncHandler(async (req, res) => {
  const { language } = req.body;

  const validLanguages = ["hi", "pa", "en"];
  if (!language || !validLanguages.includes(language)) {
    throw new ApiError(400, "Invalid language. Allowed values are 'hi', 'pa', or 'en'");
  }

  req.user.preferredLanguage = language;
  await req.user.save();

  const languageLabels = {
    hi: "Hindi",
    pa: "Punjabi",
    en: "English",
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { preferredLanguage: req.user.preferredLanguage },
        `Language preference updated to ${languageLabels[language]}`
      )
    );
});

/**
 * @desc    Log out user and invalidate refresh token
 * @route   POST /api/v1/auth/logout
 * @access  Authenticated
 */
export const logoutUser = asyncHandler(async (req, res) => {
  req.user.refreshToken = null;
  await req.user.save();

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});
