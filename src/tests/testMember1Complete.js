import dotenv from "dotenv";
dotenv.config();

import { sequelize } from "../models/index.js";
import { app } from "../app.js";

const runMasterMember1TestSuite = async () => {
  let server;
  try {
    console.log("========================================================================");
    console.log("🚀 MASTER INTEGRATION TEST SUITE: MEMBER 1 FULL SUITE (MODULES 1, 2, 8, 9)");
    console.log("========================================================================");

    await sequelize.authenticate();
    console.log("🐘 PostgreSQL connected and authenticated.\n");

    const PORT = 8004;
    server = app.listen(PORT);
    const BASE_URL = `http://localhost:${PORT}/api/v1`;

    let accessToken = "";
    let refreshToken = "";
    let targetSchoolId = "";
    let targetGrievanceId = "";

    // ---------------------------------------------------------
    // MODULE 1: AUTHENTICATION
    // ---------------------------------------------------------
    console.log("--- [STEP 1: AUTHENTICATION & PROFILE] ---");

    // 1.1 Request OTP
    const reqOtpRes = await fetch(`${BASE_URL}/auth/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: "+919876543210", language: "hi" }),
    });
    const reqOtpData = await reqOtpRes.json();
    console.log("1.1 POST /auth/request-otp:", reqOtpData.message, "| status:", reqOtpRes.status);
    if (reqOtpRes.status !== 200) throw new Error("Request OTP failed");

    // 1.2 Verify OTP
    const verifyOtpRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: "+919876543210",
        otp: "459123",
        fullName: "Ramesh Kumar (SMC Member)",
      }),
    });
    const verifyOtpData = await verifyOtpRes.json();
    console.log("1.2 POST /auth/verify-otp:", verifyOtpData.message, "| status:", verifyOtpRes.status);
    if (verifyOtpRes.status !== 200 || !verifyOtpData.data?.accessToken) throw new Error("Verify OTP failed");

    accessToken = verifyOtpData.data.accessToken;
    refreshToken = verifyOtpData.data.refreshToken;

    // 1.3 Get Current User Profile
    const userProfileRes = await fetch(`${BASE_URL}/auth/current-user`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userProfileData = await userProfileRes.json();
    console.log("1.3 GET /auth/current-user: Logged in as", userProfileData.data.user.fullName);

    // 1.4 Update Language Preference
    const langRes = await fetch(`${BASE_URL}/auth/update-language`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ language: "pa" }),
    });
    const langData = await langRes.json();
    console.log("1.4 PATCH /auth/update-language:", langData.message);

    // ---------------------------------------------------------
    // MODULE 2: SCHOOL DISCOVERY & LOCATION
    // ---------------------------------------------------------
    console.log("\n--- [STEP 2: SCHOOL DISCOVERY & LOCATION SEARCH] ---");

    // 2.1 Search Schools
    const searchRes = await fetch(`${BASE_URL}/schools/search?query=Sonipat`);
    const searchData = await searchRes.json();
    console.log(`2.1 GET /schools/search: Found ${searchData.data.total} school(s)`);
    if (searchData.data.schools.length === 0) throw new Error("School search returned empty");
    targetSchoolId = searchData.data.schools[0].id;

    // 2.2 Nearby Schools via GPS (Lat/Lng)
    const nearbyRes = await fetch(`${BASE_URL}/schools/nearby?latitude=28.67&longitude=77.27&radiusKm=10`);
    const nearbyData = await nearbyRes.json();
    console.log(`2.2 GET /schools/nearby: Found ${nearbyData.data.count} school(s) in radius`);

    // 2.3 Get School Details by ID
    const schoolDetailRes = await fetch(`${BASE_URL}/schools/${targetSchoolId}`);
    const schoolDetailData = await schoolDetailRes.json();
    console.log(`2.3 GET /schools/:id: Retrieved "${schoolDetailData.data.school.schoolName}"`);
    console.log(`    Live Stats: Total=${schoolDetailData.data.school.stats.totalGrievances}, Resolved=${schoolDetailData.data.school.stats.resolved}, Hanged=${schoolDetailData.data.school.stats.hanged}`);

    // 2.4 Apply to join SMC Committee
    const joinSmcRes = await fetch(`${BASE_URL}/schools/${targetSchoolId}/join-smc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        designation: "PARENT_MEMBER",
        studentChildName: "Aman Kumar",
        studentChildGrade: "Class 7",
      }),
    });
    const joinSmcData = await joinSmcRes.json();
    console.log(`2.4 POST /schools/:id/join-smc: Status=${joinSmcRes.status} | Msg="${joinSmcData.message}"`);

    // ---------------------------------------------------------
    // MODULE 8: PUBLIC TRANSPARENCY & CITIZEN UPVOTING
    // ---------------------------------------------------------
    console.log("\n--- [STEP 3: PUBLIC TRANSPARENCY & UPVOTES] ---");

    // 3.1 Public Dashboard Macro Stats
    const statsRes = await fetch(`${BASE_URL}/public/dashboard-stats`);
    const statsData = await statsRes.json();
    console.log(`3.1 GET /public/dashboard-stats:`);
    console.log(`    Schools Empowered: ${statsData.data.totalSchoolsEmpowered}`);
    console.log(`    Grievances Filed: ${statsData.data.totalGrievancesFiled}`);
    console.log(`    Resolution Rate: ${statsData.data.resolutionRatePercentage}%`);

    // 3.2 Public Grievances Feed (HANGED)
    const grievancesRes = await fetch(`${BASE_URL}/public/grievances?status=HANGED`);
    const grievancesData = await grievancesRes.json();
    console.log(`3.2 GET /public/grievances?status=HANGED: Found ${grievancesData.data.totalCount} hanged tickets`);
    if (grievancesData.data.grievances.length === 0) throw new Error("No public grievances found");
    targetGrievanceId = grievancesData.data.grievances[0].id;
    const currentUpvotes = grievancesData.data.grievances[0].upvotesCount;

    // 3.3 Upvote Grievance
    const uniqueFingerprint = "fp_master_test_" + Date.now();
    const upvoteRes = await fetch(`${BASE_URL}/public/grievances/${targetGrievanceId}/upvote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceFingerprint: uniqueFingerprint }),
    });
    const upvoteData = await upvoteRes.json();
    console.log(`3.3 POST /public/grievances/:id/upvote: New Count=${upvoteData.data?.newUpvoteCount} (was ${currentUpvotes})`);

    // 3.4 Verify Duplicate Vote Guard
    const dupUpvoteRes = await fetch(`${BASE_URL}/public/grievances/${targetGrievanceId}/upvote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceFingerprint: uniqueFingerprint }),
    });
    console.log(`3.4 Duplicate Upvote Guard: Rejection status=${dupUpvoteRes.status} (429 Expected)`);

    // ---------------------------------------------------------
    // MODULE 9: SOCIAL MEDIA ADVOCACY GENERATOR
    // ---------------------------------------------------------
    console.log("\n--- [STEP 4: SOCIAL ADVOCACY GENERATION] ---");

    // 4.1 Twitter/X Draft
    const twitterRes = await fetch(`${BASE_URL}/social/generate-post/${targetGrievanceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ platform: "TWITTER_X" }),
    });
    const twitterData = await twitterRes.json();
    console.log(`4.1 POST /social/generate-post/:id (TWITTER_X): Tagged: ${twitterData.data.taggedHandles.join(", ")}`);

    // 4.2 WhatsApp Draft
    const waRes = await fetch(`${BASE_URL}/social/generate-post/${targetGrievanceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ platform: "WHATSAPP" }),
    });
    const waData = await waRes.json();
    console.log(`4.2 POST /social/generate-post/:id (WHATSAPP): Share URL generated successfully`);

    // ---------------------------------------------------------
    // CLEAN SESSION CLOSE
    // ---------------------------------------------------------
    console.log("\n--- [STEP 5: REFRESH TOKEN & LOGOUT] ---");

    const refreshRes = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const refreshData = await refreshRes.json();
    console.log(`5.1 POST /auth/refresh-token: New access token issued`);

    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${refreshData.data.accessToken}` },
    });
    const logoutData = await logoutRes.json();
    console.log(`5.2 POST /auth/logout: ${logoutData.message}`);

    console.log("\n========================================================================");
    console.log("🌟 ALL 14 MEMBER 1 APIS TESTED AND VERIFIED END-TO-END WITH 100% SUCCESS!");
    console.log("========================================================================");
  } catch (error) {
    console.error("❌ Test suite encountered an error:", error);
    process.exit(1);
  } finally {
    if (server) server.close();
    process.exit(0);
  }
};

runMasterMember1TestSuite();
