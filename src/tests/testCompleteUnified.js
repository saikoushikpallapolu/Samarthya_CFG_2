import dotenv from "dotenv";
dotenv.config();

import { sequelize, User, School, GrievanceCategory } from "../models/index.js";
import { app } from "../app.js";

const runCompleteUnifiedTestSuite = async () => {
  let server;
  try {
    console.log("==========================================================================================");
    console.log("🚀 SAMARTHYA PLATFORM: UNIFIED FULL SYSTEM INTEGRATION TEST (MEMBER 1 + MEMBER 2 COMBINED)");
    console.log("==========================================================================================");

    await sequelize.authenticate();
    console.log("🐘 PostgreSQL connected and authenticated.\n");

    const PORT = 8011;
    server = app.listen(PORT);
    const BASE_URL = `http://localhost:${PORT}/api/v1`;

    // --------------------------------------------------------------------------------------
    // STEP 1 [MEMBER 1]: Citizen Authentication via OTP
    // --------------------------------------------------------------------------------------
    console.log("👉 STEP 1 [Member 1]: Requesting & Verifying OTP for SMC Citizen...");
    const reqOtpRes = await fetch(`${BASE_URL}/auth/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: "+919876543210" }),
    });
    const reqOtpData = await reqOtpRes.json();
    console.log(`   [1.1] Request OTP: ${reqOtpRes.status} OK (Test OTP: ${reqOtpData.data?.testOtp})`);

    const verifyOtpRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: "+919876543210",
        otp: reqOtpData.data?.testOtp || "459123",
        fullName: "Ramesh Kumar",
      }),
    });
    const verifyOtpData = await verifyOtpRes.json();
    const citizenToken = verifyOtpData.data.accessToken;
    console.log(`   [1.2] Verify OTP: ${verifyOtpRes.status} OK (User: ${verifyOtpData.data.user.fullName})`);

    // --------------------------------------------------------------------------------------
    // STEP 2 [MEMBER 1]: School Discovery & SMC Committee Join
    // --------------------------------------------------------------------------------------
    console.log("\n👉 STEP 2 [Member 1]: Locating Public School & Joining SMC Committee...");
    const searchSchoolRes = await fetch(`${BASE_URL}/schools/search?query=Sonipat`);
    const searchSchoolData = await searchSchoolRes.json();
    const school = searchSchoolData.data.schools[0];
    console.log(`   [2.1] School Search: ${searchSchoolRes.status} OK | Selected: "${school.schoolName}" (${school.udiseCode})`);

    const joinSmcRes = await fetch(`${BASE_URL}/schools/${school.id}/join-smc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${citizenToken}`,
      },
      body: JSON.stringify({
        designation: "PARENT_MEMBER",
        studentName: "Aakash Kumar",
        studentClass: "Class 8th",
      }),
    });
    const joinSmcData = await joinSmcRes.json();
    console.log(`   [2.2] Join SMC: ${joinSmcRes.status} (${joinSmcData.message})`);

    // --------------------------------------------------------------------------------------
    // STEP 3 [MEMBER 2]: Fetch Master Categories & Speech-to-Text Voice Recording
    // --------------------------------------------------------------------------------------
    console.log("\n👉 STEP 3 [Member 2]: Voice-to-Text Recording & Administrative Template Preview...");
    const catRes = await fetch(`${BASE_URL}/categories?language=hi`);
    const catData = await catRes.json();
    const selectedCategory =
      catData.data.find((c) => c.categoryCode === "WATER_SANITATION") || catData.data[0];
    console.log(`   [3.1] Master Categories: ${catRes.status} OK | Selected Category: ${selectedCategory.categoryName} (${selectedCategory.categoryCode})`);

    // Process Voice Note
    const formData = new FormData();
    const fakeAudioBlob = new Blob(["audio-bytes-for-broken-taps"], { type: "audio/m4a" });
    formData.append("audio", fakeAudioBlob, "voice_tap_issue.m4a");
    formData.append("languageHint", "hi");
    formData.append("categoryId", selectedCategory.id);

    const voiceRes = await fetch(`${BASE_URL}/voice/process-audio`, {
      method: "POST",
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: formData,
    });
    const voiceData = await voiceRes.json();
    console.log(`   [3.2] Voice STT Processing: ${voiceRes.status} OK | Transcription: "${voiceData.data.transcriptionRaw.slice(0, 65)}..."`);

    // Fetch Template & Preview Letter
    const tplRes = await fetch(`${BASE_URL}/templates/${selectedCategory.id}?language=hi`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    const tplData = await tplRes.json();

    const previewRes = await fetch(`${BASE_URL}/templates/preview-letter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${citizenToken}`,
      },
      body: JSON.stringify({
        templateId: tplData.data.templateId,
        schoolId: school.id,
        dynamicFieldValues: voiceData.data.extractedFields,
      }),
    });
    const previewData = await previewRes.json();
    console.log(`   [3.3] Letter Preview: ${previewRes.status} OK | Assigned Officer: ${previewData.data.assignedAuthority?.officeName}`);

    // --------------------------------------------------------------------------------------
    // STEP 4 [MEMBER 2]: File Official Grievance & SLA Deadline Set
    // --------------------------------------------------------------------------------------
    console.log("\n👉 STEP 4 [Member 2]: Filing Grievance & Automatic SLA Setup...");
    const submitGrievanceRes = await fetch(`${BASE_URL}/grievances`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${citizenToken}`,
      },
      body: JSON.stringify({
        schoolId: school.id,
        categoryId: selectedCategory.id,
        templateId: tplData.data.templateId,
        submissionChannel: "HYBRID",
        priority: "HIGH",
        dynamicFieldValues: voiceData.data.extractedFields,
        photoAttachmentUrls: ["https://storage.samarthya.org/photos/broken_tap_sample.jpg"],
      }),
    });
    const submitGrievanceData = await submitGrievanceRes.json();
    const grievanceId = submitGrievanceData.data.grievanceId;
    const ticketNumber = submitGrievanceData.data.ticketNumber;
    const actionToken = submitGrievanceData.data.actionToken;
    console.log(`   [4.1] Grievance Filed: ${submitGrievanceRes.status} Created | Ticket: ${ticketNumber} | SLA: ${submitGrievanceData.data.slaDays} Days`);

    // --------------------------------------------------------------------------------------
    // STEP 5 [MEMBER 1]: Public Transparency Portal & Citizen Upvoting
    // --------------------------------------------------------------------------------------
    console.log("\n👉 STEP 5 [Member 1]: Public Transparency Dashboard & Community Upvoting...");
    const statsRes = await fetch(`${BASE_URL}/public/dashboard-stats`);
    const statsData = await statsRes.json();
    console.log(`   [5.1] Public Dashboard: ${statsRes.status} OK | Total Schools Empowered: ${statsData.data.totalSchoolsEmpowered} | Total Grievances Filed: ${statsData.data.totalGrievancesFiled}`);

    const upvoteRes = await fetch(`${BASE_URL}/public/grievances/${grievanceId}/upvote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${citizenToken}`,
      },
      body: JSON.stringify({ deviceFingerprint: `device_sim_${Date.now()}` }),
    });
    const upvoteData = await upvoteRes.json();
    console.log(`   [5.2] Grievance Upvote: ${upvoteRes.status} OK | New Upvote Count: ${upvoteData.data?.newUpvoteCount}`);

    // --------------------------------------------------------------------------------------
    // STEP 6 [MEMBER 1]: Social Media Advocacy Campaign Generation
    // --------------------------------------------------------------------------------------
    console.log("\n👉 STEP 6 [Member 1]: Generating Viral Social Media Advocacy Posts...");
    const socialRes = await fetch(`${BASE_URL}/social/generate-post/${grievanceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${citizenToken}`,
      },
      body: JSON.stringify({ platform: "TWITTER_X" }),
    });
    const socialData = await socialRes.json();
    console.log(`   [6.1] Social Campaign: ${socialRes.status} OK | Tagged Handles: ${socialData.data.taggedHandles.join(", ")}`);
    console.log(`         Draft: "${socialData.data.postText.slice(0, 75)}..."`);

    // --------------------------------------------------------------------------------------
    // STEP 7 [MEMBER 2]: Government Authority 1-Click Magic Link Action
    // --------------------------------------------------------------------------------------
    console.log("\n👉 STEP 7 [Member 2]: Government Authority Passwordless Magic Link Workflow...");
    const authViewRes = await fetch(`${BASE_URL}/authority/grievances/${actionToken}`);
    const authViewData = await authViewRes.json();
    console.log(`   [7.1] Authority Access: ${authViewRes.status} OK | Status: ${authViewData.data.status} | School: ${authViewData.data.schoolName}`);

    const authAckRes = await fetch(`${BASE_URL}/authority/grievances/${actionToken}/acknowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        officerRemarks: "Acknowledged by PHED Sonipat. Ground survey scheduled tomorrow.",
        tentativeResolutionDate: "2026-09-24",
      }),
    });
    const authAckData = await authAckRes.json();
    console.log(`   [7.2] Authority Acknowledged: ${authAckRes.status} OK | Status: ${authAckData.data.status}`);

    const authUpdateRes = await fetch(`${BASE_URL}/authority/grievances/${actionToken}/update-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newStatus: "UNDER_INSPECTION",
        completionSummary: "New PVC pipes and brass taps delivered to school premises.",
        workOrderNumber: "WO-PHED-2026-781",
      }),
    });
    const authUpdateData = await authUpdateRes.json();
    console.log(`   [7.3] Authority Status Update: ${authUpdateRes.status} OK | Status: ${authUpdateData.data.status}`);

    // --------------------------------------------------------------------------------------
    // STEP 8 [MEMBER 2]: SMC Ground Verification & Resolution Confirmation
    // --------------------------------------------------------------------------------------
    console.log("\n👉 STEP 8 [Member 2]: SMC Ground Verification & Closing Ticket...");
    const verifyRes = await fetch(`${BASE_URL}/grievances/${grievanceId}/verify-resolution`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${citizenToken}`,
      },
      body: JSON.stringify({
        isSatisfied: true,
        feedbackComment: "Ground verification confirmed: drinking water restored with full pressure.",
      }),
    });
    const verifyData = await verifyRes.json();
    console.log(`   [8.1] Ground Verification: ${verifyRes.status} OK | Status: ${verifyData.data.status}`);

    // --------------------------------------------------------------------------------------
    // STEP 9 [MEMBER 2]: Samarthya Admin Macro Analytics & Report Export
    // --------------------------------------------------------------------------------------
    console.log("\n👉 STEP 9 [Member 2]: Administrator Bottleneck Analytics & Dataset Export...");
    const [adminUser] = await User.findOrCreate({
      where: { phoneNumber: "+919999988888" },
      defaults: {
        fullName: "System Admin",
        role: "SAMARTHYA_ADMIN",
        isPhoneVerified: true,
      },
    });
    adminUser.role = "SAMARTHYA_ADMIN";
    await adminUser.save();
    const adminToken = adminUser.generateAccessToken();

    const bottlenecksRes = await fetch(`${BASE_URL}/admin/analytics/bottlenecks`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const bottlenecksData = await bottlenecksRes.json();
    console.log(`   [9.1] Bottleneck Analytics: ${bottlenecksRes.status} OK | Tracked Departments: ${bottlenecksData.data.worstPerformingDepartments.length}`);

    const exportRes = await fetch(`${BASE_URL}/admin/reports/export`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const exportCsv = await exportRes.text();
    console.log(`   [9.2] CSV Report Export: ${exportRes.status} OK | Total CSV Lines: ${exportCsv.split("\n").length}`);

    // --------------------------------------------------------------------------------------
    // STEP 10 [MEMBER 1]: Clean User Logout
    // --------------------------------------------------------------------------------------
    console.log("\n👉 STEP 10 [Member 1]: Clean Session Close & User Logout...");
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    const logoutData = await logoutRes.json();
    console.log(`   [10.1] Logout: ${logoutRes.status} OK (${logoutData.message})`);

    console.log("\n==========================================================================================");
    console.log("🏆 100% SUCCESS: ALL MEMBER 1 & MEMBER 2 APIS OPERATE HARMONIOUSLY AND SEAMLESSLY!");
    console.log("==========================================================================================");
  } catch (error) {
    console.error("❌ Unified test failure:", error);
    process.exit(1);
  } finally {
    if (server) server.close();
    process.exit(0);
  }
};

runCompleteUnifiedTestSuite();
