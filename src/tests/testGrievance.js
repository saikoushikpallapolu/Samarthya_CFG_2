import dotenv from "dotenv";
dotenv.config();

import { sequelize, User, School, GrievanceCategory } from "../models/index.js";
import { app } from "../app.js";

const runGrievanceTests = async () => {
  let server;
  try {
    console.log("==================================================");
    console.log("🧪 RUNNING MODULE 5 & 7: GRIEVANCE CONTROLLER TESTS");
    console.log("==================================================");

    await sequelize.authenticate();
    console.log("✅ Database connected.");

    const PORT = 8007;
    server = app.listen(PORT);
    const BASE_URL = `http://localhost:${PORT}/api/v1`;

    // 1. Authenticate user
    const [testUser] = await User.findOrCreate({
      where: { phoneNumber: "+919876543210" },
    });
    const token = testUser.generateAccessToken();

    // 2. Fetch category and school
    const category = await GrievanceCategory.findOne({
      where: { categoryCode: "WATER_SANITATION" },
    });
    const school = await School.findOne({
      where: { udiseCode: "06080100101" },
    });

    // 3. Test POST /grievances (Submit grievance)
    console.log("\n[Test 1] Testing POST /grievances (Submit formal grievance)...");
    const submitRes = await fetch(`${BASE_URL}/grievances`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        schoolId: school.id,
        categoryId: category.id,
        submissionChannel: "HYBRID",
        priority: "HIGH",
        dynamicFieldValues: {
          facility_affected: "पेयजल टंकी",
          specific_problem: "टंकी टूटी है और पानी नहीं आ रहा",
          duration_of_issue: "15 दिन",
        },
        photoAttachmentUrls: ["https://storage.samarthya.org/photos/water_leak_1.jpg"],
      }),
    });
    const submitData = await submitRes.json();
    if (submitRes.status === 201 && submitData.data?.ticketNumber && submitData.data?.actionToken) {
      console.log(`✅ Passed: Grievance created! Ticket: ${submitData.data.ticketNumber}`);
      console.log(`   Assigned Authority: ${submitData.data.assignedAuthority?.officeName}`);
      console.log(`   Action Token (Magic Link): ${submitData.data.actionToken.slice(0, 16)}...`);
    } else {
      throw new Error(`Failed Test 1: ${JSON.stringify(submitData)}`);
    }

    const createdGrievanceId = submitData.data.grievanceId;
    const ticketNumber = submitData.data.ticketNumber;

    // 4. Test GET /grievances/:id (by ticket number)
    console.log(`\n[Test 2] Testing GET /grievances/${ticketNumber}...`);
    const detailRes = await fetch(`${BASE_URL}/grievances/${ticketNumber}`);
    const detailData = await detailRes.json();
    if (detailRes.status === 200 && detailData.data?.school?.udise === "06080100101") {
      console.log(`✅ Passed: Retrieved grievance details for ${detailData.data.school.name}`);
      console.log(`   SLA Days: ${detailData.data.sla?.slaDays} | Timeline events: ${detailData.data.timeline?.length}`);
    } else {
      throw new Error(`Failed Test 2: ${JSON.stringify(detailData)}`);
    }

    // 5. Test GET /grievances/my-school/:schoolId
    console.log(`\n[Test 3] Testing GET /grievances/my-school/${school.id}...`);
    const schoolGrievancesRes = await fetch(`${BASE_URL}/grievances/my-school/${school.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const schoolGrievancesData = await schoolGrievancesRes.json();
    if (schoolGrievancesRes.status === 200 && schoolGrievancesData.data?.grievances?.length > 0) {
      console.log(`✅ Passed: Found ${schoolGrievancesData.data.total} grievance(s) for school.`);
    } else {
      throw new Error(`Failed Test 3: ${JSON.stringify(schoolGrievancesData)}`);
    }

    // 6. Test POST /grievances/:id/upload-physical-ack
    console.log(`\n[Test 4] Testing POST /grievances/${createdGrievanceId}/upload-physical-ack...`);
    const ackRes = await fetch(`${BASE_URL}/grievances/${createdGrievanceId}/upload-physical-ack`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        submissionDate: "2026-09-18",
        diaryNumber: "PHED/SNP/2026/894",
        receiptUrl: "https://storage.samarthya.org/receipts/ack_receipt_894.jpg",
      }),
    });
    const ackData = await ackRes.json();
    if (ackRes.status === 200 && ackData.data?.status === "ACKNOWLEDGED") {
      console.log(`✅ Passed: Stamped physical receipt uploaded! Status=${ackData.data.status}`);
    } else {
      throw new Error(`Failed Test 4: ${JSON.stringify(ackData)}`);
    }

    // 7. Test GET /grievances/:id/sla-status
    console.log(`\n[Test 5] Testing GET /grievances/${createdGrievanceId}/sla-status...`);
    const slaRes = await fetch(`${BASE_URL}/grievances/${createdGrievanceId}/sla-status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const slaData = await slaRes.json();
    if (slaRes.status === 200 && slaData.data?.currentLevel === 1) {
      console.log(`✅ Passed: SLA status calculated. Next Escalation Level: ${slaData.data.nextEscalation?.level}`);
    } else {
      throw new Error(`Failed Test 5: ${JSON.stringify(slaData)}`);
    }

    // 8. Test POST /grievances/:id/escalate
    console.log(`\n[Test 6] Testing POST /grievances/${createdGrievanceId}/escalate (Escalate to Level 2 DM)...`);
    const escRes = await fetch(`${BASE_URL}/grievances/${createdGrievanceId}/escalate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        escalationReason: "Local officers uncooperative after repeated visits.",
        targetLevel: 2,
      }),
    });
    const escData = await escRes.json();
    if (escRes.status === 200 && escData.data?.newLevel === 2) {
      console.log(`✅ Passed: Escalated to ${escData.data.escalatedTo}`);
    } else {
      throw new Error(`Failed Test 6: ${JSON.stringify(escData)}`);
    }

    // 9. Test POST /grievances/:id/verify-resolution
    console.log(`\n[Test 7] Testing POST /grievances/${createdGrievanceId}/verify-resolution...`);
    const verifyRes = await fetch(`${BASE_URL}/grievances/${createdGrievanceId}/verify-resolution`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        isSatisfied: true,
        feedbackComment: "पानी की नई टंकी स्थापित कर दी गई है। सब ठीक है।",
      }),
    });
    const verifyData = await verifyRes.json();
    if (verifyRes.status === 200 && verifyData.data?.status === "RESOLVED") {
      console.log(`✅ Passed: Ground verification confirmed! Status=${verifyData.data.status}`);
    } else {
      throw new Error(`Failed Test 7: ${JSON.stringify(verifyData)}`);
    }

    // 10. Test POST /grievances/:id/reopen
    console.log(`\n[Test 8] Testing POST /grievances/${createdGrievanceId}/reopen...`);
    const reopenRes = await fetch(`${BASE_URL}/grievances/${createdGrievanceId}/reopen`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        reopenReason: "नल में से पानी टपक रहा है। मरम्मत अधूरी है।",
      }),
    });
    const reopenData = await reopenRes.json();
    if (reopenRes.status === 200 && reopenData.data?.status === "IN_PROGRESS" && reopenData.data?.reopenCount > 0) {
      console.log(`✅ Passed: Grievance reopened properly. Reopen count=${reopenData.data.reopenCount}`);
    } else {
      throw new Error(`Failed Test 8: ${JSON.stringify(reopenData)}`);
    }

    console.log("\n==================================================");
    console.log("🎉 ALL MODULE 5 & 7 (GRIEVANCE) TESTS PASSED!");
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Test error:", err);
    process.exit(1);
  } finally {
    if (server) server.close();
    process.exit(0);
  }
};

runGrievanceTests();
