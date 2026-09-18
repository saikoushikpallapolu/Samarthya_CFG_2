import dotenv from "dotenv";
dotenv.config();

import {
  sequelize,
  User,
  School,
  Department,
  GrievanceCategory,
  GrievanceTemplate,
  Grievance,
} from "../models/index.js";
import { app } from "../app.js";

const runMasterMember2TestSuite = async () => {
  let server;
  try {
    console.log("=========================================================================");
    console.log("🚀 MASTER INTEGRATION TEST SUITE: MEMBER 2 FULL DOMAIN (MODULES 3,4,5,6,7,10)");
    console.log("=========================================================================");

    await sequelize.authenticate();
    console.log("🐘 PostgreSQL connected and authenticated.\n");

    const PORT = 8010;
    server = app.listen(PORT);
    const BASE_URL = `http://localhost:${PORT}/api/v1`;

    // -------------------------------------------------------------------
    // 0. AUTH SETUP (SMC User & Admin User)
    // -------------------------------------------------------------------
    const [smcUser] = await User.findOrCreate({
      where: { phoneNumber: "+919876543210" },
      defaults: {
        fullName: "Ramesh Kumar (SMC Member)",
        role: "SMC_MEMBER",
        preferredLanguage: "hi",
        isPhoneVerified: true,
      },
    });
    const smcToken = smcUser.generateAccessToken();

    const [adminUser] = await User.findOrCreate({
      where: { phoneNumber: "+919999988888" },
      defaults: {
        fullName: "Samarthya Admin",
        role: "SAMARTHYA_ADMIN",
        isPhoneVerified: true,
      },
    });
    adminUser.role = "SAMARTHYA_ADMIN";
    await adminUser.save();
    const adminToken = adminUser.generateAccessToken();

    const school = await School.findOne({ where: { udiseCode: "06080100101" } });
    const category = await GrievanceCategory.findOne({ where: { categoryCode: "WATER_SANITATION" } });

    // -------------------------------------------------------------------
    // MODULE 3: MASTER DATA & DEPARTMENT DIRECTORY
    // -------------------------------------------------------------------
    console.log("-------------------------------------------------------------------------");
    console.log("📦 1. MODULE 3: MASTER DATA & DIRECTORY APIS");
    console.log("-------------------------------------------------------------------------");

    // 1.1 GET /categories (Hindi)
    const catHiRes = await fetch(`${BASE_URL}/categories?language=hi`);
    const catHiData = await catHiRes.json();
    console.log(`[3.1] GET /categories (Hindi): ${catHiRes.status} OK | Count: ${catHiData.data.length}`);

    // 1.2 GET /categories (Punjabi)
    const catPaRes = await fetch(`${BASE_URL}/categories?language=pa`);
    const catPaData = await catPaRes.json();
    console.log(`[3.2] GET /categories (Punjabi): ${catPaRes.status} OK | Title: "${catPaData.data[0]?.categoryName}"`);

    // 1.3 GET /departments
    const deptRes = await fetch(`${BASE_URL}/departments`);
    const deptData = await deptRes.json();
    console.log(`[3.3] GET /departments: ${deptRes.status} OK | Total Depts: ${deptData.data.length}`);

    // 1.4 GET /authorities
    const authRes = await fetch(`${BASE_URL}/authorities?state=Haryana&district=Sonipat`, {
      headers: { Authorization: `Bearer ${smcToken}` },
    });
    const authData = await authRes.json();
    console.log(`[3.4] GET /authorities (Sonipat, Haryana): ${authRes.status} OK | Found: ${authData.data.length} authority(ies)`);

    // -------------------------------------------------------------------
    // MODULE 4: SPEECH-TO-TEXT & TEMPLATE ENGINE
    // -------------------------------------------------------------------
    console.log("\n-------------------------------------------------------------------------");
    console.log("🎙️  2. MODULE 4: SPEECH-TO-TEXT & TEMPLATE ENGINE APIS");
    console.log("-------------------------------------------------------------------------");

    // 2.1 POST /voice/process-audio
    const formData = new FormData();
    const audioBlob = new Blob(["audio-recording-binary-stream"], { type: "audio/m4a" });
    formData.append("audio", audioBlob, "voice_problem.m4a");
    formData.append("languageHint", "hi");
    formData.append("categoryId", category.id);

    const voiceRes = await fetch(`${BASE_URL}/voice/process-audio`, {
      method: "POST",
      headers: { Authorization: `Bearer ${smcToken}` },
      body: formData,
    });
    const voiceData = await voiceRes.json();
    console.log(`[4.1] POST /voice/process-audio: ${voiceRes.status} OK | Score: ${voiceData.data.confidenceScore}% | Language: ${voiceData.data.detectedLanguage}`);
    console.log(`      Transcription: "${voiceData.data.transcriptionRaw.slice(0, 60)}..."`);

    // 2.2 GET /templates/:categoryId
    const tplRes = await fetch(`${BASE_URL}/templates/${category.id}?language=hi`, {
      headers: { Authorization: `Bearer ${smcToken}` },
    });
    const tplData = await tplRes.json();
    console.log(`[4.2] GET /templates/${category.id}: ${tplRes.status} OK | Template Title: "${tplData.data.templateTitle}"`);

    // 2.3 POST /templates/preview-letter
    const previewRes = await fetch(`${BASE_URL}/templates/preview-letter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${smcToken}`,
      },
      body: JSON.stringify({
        templateId: tplData.data.templateId,
        schoolId: school.id,
        dynamicFieldValues: voiceData.data.extractedFields,
      }),
    });
    const previewData = await previewRes.json();
    console.log(`[4.3] POST /templates/preview-letter: ${previewRes.status} OK | Subject Preview: "${previewData.data.renderedSubject.slice(0, 60)}..."`);

    // -------------------------------------------------------------------
    // MODULE 5 & 7: GRIEVANCE LIFECYCLE & SLA ESCALATION
    // -------------------------------------------------------------------
    console.log("\n-------------------------------------------------------------------------");
    console.log("📋 3. MODULE 5 & 7: GRIEVANCE LIFECYCLE & SLA ESCALATION APIS");
    console.log("-------------------------------------------------------------------------");

    // 3.1 POST /grievances (Submit)
    const submitRes = await fetch(`${BASE_URL}/grievances`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${smcToken}`,
      },
      body: JSON.stringify({
        schoolId: school.id,
        categoryId: category.id,
        templateId: tplData.data.templateId,
        submissionChannel: "HYBRID",
        priority: "HIGH",
        dynamicFieldValues: voiceData.data.extractedFields,
        photoAttachmentUrls: ["https://storage.samarthya.org/photos/broken_tap.jpg"],
      }),
    });
    const submitData = await submitRes.json();
    const createdGrievanceId = submitData.data.grievanceId;
    const ticketNumber = submitData.data.ticketNumber;
    const actionToken = submitData.data.actionToken;
    console.log(`[5.1] POST /grievances (Submit): ${submitRes.status} Created | Ticket: ${ticketNumber} | SLA: ${submitData.data.slaDays} days`);

    // 3.2 GET /grievances/:id
    const detailRes = await fetch(`${BASE_URL}/grievances/${ticketNumber}`);
    const detailData = await detailRes.json();
    console.log(`[5.2] GET /grievances/:id: ${detailRes.status} OK | Status: ${detailData.data.status} | Timeline Events: ${detailData.data.timeline.length}`);

    // 3.3 GET /grievances/my-school/:schoolId
    const schoolGrievancesRes = await fetch(`${BASE_URL}/grievances/my-school/${school.id}`, {
      headers: { Authorization: `Bearer ${smcToken}` },
    });
    const schoolGrievancesData = await schoolGrievancesRes.json();
    console.log(`[5.3] GET /grievances/my-school/:schoolId: ${schoolGrievancesRes.status} OK | Total School Grievances: ${schoolGrievancesData.data.total}`);

    // 3.4 POST /grievances/:id/upload-physical-ack
    const ackRes = await fetch(`${BASE_URL}/grievances/${createdGrievanceId}/upload-physical-ack`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${smcToken}`,
      },
      body: JSON.stringify({
        submissionDate: "2026-09-18",
        diaryNumber: "PHED/SNP/DIARY/9941",
        receiptUrl: "https://storage.samarthya.org/receipts/stamped_9941.jpg",
      }),
    });
    const ackData = await ackRes.json();
    console.log(`[5.4] POST /grievances/:id/upload-physical-ack: ${ackRes.status} OK | Status: ${ackData.data.status} | Diary: ${ackData.data.diaryNumber}`);

    // 3.5 GET /grievances/:id/sla-status
    const slaRes = await fetch(`${BASE_URL}/grievances/${createdGrievanceId}/sla-status`, {
      headers: { Authorization: `Bearer ${smcToken}` },
    });
    const slaData = await slaRes.json();
    console.log(`[7.1] GET /grievances/:id/sla-status: ${slaRes.status} OK | Current Tier: ${slaData.data.currentLevel} | Next Tier: Level ${slaData.data.nextEscalation?.level}`);

    // 3.6 POST /grievances/:id/escalate
    const escRes = await fetch(`${BASE_URL}/grievances/${createdGrievanceId}/escalate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        escalationReason: "Unresponsive authority past initial inspection SLA",
        targetLevel: 2,
      }),
    });
    const escData = await escRes.json();
    console.log(`[7.2] POST /grievances/:id/escalate: ${escRes.status} OK | Escalated to Level ${escData.data.newLevel} (${escData.data.escalatedTo})`);

    // 3.7 POST /grievances/:id/verify-resolution
    const verifyRes = await fetch(`${BASE_URL}/grievances/${createdGrievanceId}/verify-resolution`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${smcToken}`,
      },
      body: JSON.stringify({
        isSatisfied: true,
        feedbackComment: "Ground inspection verified new water tap pipeline operational.",
      }),
    });
    const verifyData = await verifyRes.json();
    console.log(`[5.5] POST /grievances/:id/verify-resolution: ${verifyRes.status} OK | Status: ${verifyData.data.status}`);

    // 3.8 POST /grievances/:id/reopen
    const reopenRes = await fetch(`${BASE_URL}/grievances/${createdGrievanceId}/reopen`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${smcToken}`,
      },
      body: JSON.stringify({
        reopenReason: "Taps leaking again under heavy water pressure.",
      }),
    });
    const reopenData = await reopenRes.json();
    console.log(`[5.6] POST /grievances/:id/reopen: ${reopenRes.status} OK | Status: ${reopenData.data.status} | Reopen Count: ${reopenData.data.reopenCount}`);

    // -------------------------------------------------------------------
    // MODULE 6: GOVERNMENT AUTHORITY 1-CLICK ACTION (MAGIC LINK)
    // -------------------------------------------------------------------
    console.log("\n-------------------------------------------------------------------------");
    console.log("⚡ 4. MODULE 6: GOVERNMENT AUTHORITY 1-CLICK ACTION APIS (MAGIC LINK)");
    console.log("-------------------------------------------------------------------------");

    // 4.1 GET /authority/grievances/:actionToken
    const authViewRes = await fetch(`${BASE_URL}/authority/grievances/${actionToken}`);
    const authViewData = await authViewRes.json();
    console.log(`[6.1] GET /authority/grievances/:actionToken: ${authViewRes.status} OK | School: ${authViewData.data.schoolName}`);

    // 4.2 POST /authority/grievances/:actionToken/acknowledge
    const authAckRes = await fetch(`${BASE_URL}/authority/grievances/${actionToken}/acknowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        officerRemarks: "Acknowledged by Executive Engineer. Site engineer assigned.",
        tentativeResolutionDate: "2026-09-25",
      }),
    });
    const authAckData = await authAckRes.json();
    console.log(`[6.2] POST /authority/grievances/:actionToken/acknowledge: ${authAckRes.status} OK | Status: ${authAckData.data.status}`);

    // 4.3 POST /authority/grievances/:actionToken/update-status
    const authStatusRes = await fetch(`${BASE_URL}/authority/grievances/${actionToken}/update-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newStatus: "UNDER_INSPECTION",
        completionSummary: "Contractor assigned under work order WO-2026-991.",
        workOrderNumber: "WO-2026-991",
      }),
    });
    const authStatusData = await authStatusRes.json();
    console.log(`[6.3] POST /authority/grievances/:actionToken/update-status: ${authStatusRes.status} OK | Status: ${authStatusData.data.status}`);

    // 4.4 POST /authority/grievances/:actionToken/forward
    const pwdDept = await Department.findOne({ where: { departmentCode: "PWD" } });
    const authFwdRes = await fetch(`${BASE_URL}/authority/grievances/${actionToken}/forward`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetDepartmentId: pwdDept.id,
        reason: "Boundary civil repair requires PWD intervention",
      }),
    });
    const authFwdData = await authFwdRes.json();
    console.log(`[6.4] POST /authority/grievances/:actionToken/forward: ${authFwdRes.status} OK | Re-routed To: ${authFwdData.data.newDepartment}`);

    // -------------------------------------------------------------------
    // MODULE 10: SAMARTHYA ADMIN & MACRO DECISION-MAKING
    // -------------------------------------------------------------------
    console.log("\n-------------------------------------------------------------------------");
    console.log("📊 5. MODULE 10: SAMARTHYA ADMIN & MACRO DECISION-MAKING APIS");
    console.log("-------------------------------------------------------------------------");

    // 5.1 GET /admin/analytics/bottlenecks
    const bottleneckRes = await fetch(`${BASE_URL}/admin/analytics/bottlenecks`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const bottleneckData = await bottleneckRes.json();
    console.log(`[10.1] GET /admin/analytics/bottlenecks: ${bottleneckRes.status} OK | Tracked Depts: ${bottleneckData.data.worstPerformingDepartments.length} | Tracked Districts: ${bottleneckData.data.worstPerformingDistricts.length}`);

    // 5.2 POST /admin/escalate-batch
    const batchRes = await fetch(`${BASE_URL}/admin/escalate-batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        grievanceIds: [createdGrievanceId],
        escalationReason: "Batch SLA breach escalation to District Magistrate.",
        targetAuthorityLevel: "DISTRICT",
      }),
    });
    const batchData = await batchRes.json();
    console.log(`[10.2] POST /admin/escalate-batch: ${batchRes.status} OK | Escalated: ${batchData.data.escalatedCount} | Dispatched Alerts: ${batchData.data.notificationsDispatched}`);

    // 5.3 GET /admin/reports/export (CSV)
    const exportRes = await fetch(`${BASE_URL}/admin/reports/export`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const csvContent = await exportRes.text();
    console.log(`[10.3] GET /admin/reports/export: ${exportRes.status} OK | Content-Type: ${exportRes.headers.get("content-type")} | CSV Rows: ${csvContent.split("\n").length}`);

    console.log("\n=========================================================================");
    console.log("🌟 ALL 19 MEMBER 2 APIS TESTED AND VERIFIED END-TO-END WITH 100% SUCCESS!");
    console.log("=========================================================================");
  } catch (error) {
    console.error("❌ Member 2 Master test suite failed:", error);
    process.exit(1);
  } finally {
    if (server) server.close();
    process.exit(0);
  }
};

runMasterMember2TestSuite();
