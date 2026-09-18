import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User, School, SmcMember } from "../models/index.js";

/**
 * =====================================================================
 * MEMBER 1: AUTHENTICATION & USER PROFILE CONTROLLERS
 * =====================================================================
 */

// POST /api/v1/auth/request-otp
export const requestOtp = asyncHandler(async (req, res) => {
  const { phoneNumber, language } = req.body;
  // TODO: Member 1 - Implement phone validation and SMS OTP dispatch
  return res.status(200).json(
    new ApiResponse(
      200,
      { phoneNumber, expiresInSeconds: 300, resendCooldownSeconds: 60 },
      "OTP sent successfully via SMS"
    )
  );
});

// POST /api/v1/auth/verify-otp
export const verifyOtp = asyncHandler(async (req, res) => {
  const { phoneNumber, otp, fullName } = req.body;
  // TODO: Member 1 - Validate OTP, create or fetch User, sign JWT access & refresh tokens
  return res.status(200).json(
    new ApiResponse(
      200,
      { accessToken: "STUB_TOKEN", user: { phoneNumber, fullName } },
      "Login successful"
    )
  );
});

// POST /api/v1/auth/refresh-token
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  // TODO: Member 1 - Verify refresh token and issue new access token
  return res.status(200).json(
    new ApiResponse(200, { accessToken: "NEW_STUB_TOKEN" }, "Access token refreshed")
  );
});

// GET /api/v1/auth/current-user
export const getCurrentUser = asyncHandler(async (req, res) => {
  // TODO: Member 1 - Return req.user with associatedSchools
  return res.status(200).json(
    new ApiResponse(200, { user: req.user }, "Current user fetched")
  );
});

// PATCH /api/v1/auth/update-language
export const updateLanguage = asyncHandler(async (req, res) => {
  const { language } = req.body;
  // TODO: Member 1 - Update req.user.preferredLanguage ('hi' | 'pa' | 'en')
  return res.status(200).json(
    new ApiResponse(200, { preferredLanguage: language }, "Language preference updated")
  );
});

// POST /api/v1/auth/logout
export const logoutUser = asyncHandler(async (req, res) => {
  // TODO: Member 1 - Clear refreshToken in database and clear cookies
  return res.status(200).json(new ApiResponse(200, {}, "Logged out successfully"));
});
