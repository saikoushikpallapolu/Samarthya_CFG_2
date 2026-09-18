import dotenv from "dotenv";
dotenv.config();

import { sequelize, User, Grievance } from "../models/index.js";
import { app } from "../app.js";

const runPublicAndSocialTests = async () => {
  let server;
  try {
    console.log("==================================================");
    console.log("🧪 RUNNING MODULE 8 & 9: PUBLIC & SOCIAL TESTS");
    console.log("==================================================");

    await sequelize.authenticate();
    console.log("✅ Database connected.");

    const PORT = 8003;
    server = app.listen(PORT);
    const BASE_PUBLIC_URL = `http://localhost:${PORT}/api/v1/public`;
    const BASE_SOCIAL_URL = `http://localhost:${PORT}/api/v1/social`;

    // 1. Test GET /public/dashboard-stats
    console.log("\n[Test 1] Testing GET /public/dashboard-stats...");
    const res1 = await fetch(`${BASE_PUBLIC_URL}/dashboard-stats`);
    const data1 = await res1.json();
    if (
      res1.status === 200 &&
      data1.data?.totalSchoolsEmpowered > 0 &&
      data1.data?.totalGrievancesFiled > 0 &&
      Array.isArray(data1.data?.categoryBreakdown)
    ) {
      console.log("✅ Passed: Macro stats retrieved successfully!");
      console.log(`   Schools Empowered: ${data1.data.totalSchoolsEmpowered}`);
      console.log(`   Grievances Filed: ${data1.data.totalGrievancesFiled}`);
      console.log(`   Resolved: ${data1.data.totalResolved} (${data1.data.resolutionRatePercentage}%)`);
      console.log(`   Hanged / Escalated: ${data1.data.totalHanged}`);
      console.log(`   Categories count: ${data1.data.categoryBreakdown.length}`);
    } else {
      throw new Error(`Failed Test 1: ${JSON.stringify(data1)}`);
    }

    // 2. Test GET /public/grievances (all feed)
    console.log("\n[Test 2] Testing GET /public/grievances (Public feed)...");
    const res2 = await fetch(`${BASE_PUBLIC_URL}/grievances`);
    const data2 = await res2.json();
    if (res2.status === 200 && data2.data?.grievances?.length > 0) {
      console.log(`✅ Passed: Found ${data2.data.totalCount} public grievances.`);
      console.log(`   First Ticket: ${data2.data.grievances[0].ticketNumber} | Status: ${data2.data.grievances[0].status} | Upvotes: ${data2.data.grievances[0].upvotesCount}`);
      console.log(`   Tracking URL: ${data2.data.grievances[0].publicTrackingUrl}`);
    } else {
      throw new Error(`Failed Test 2: ${JSON.stringify(data2)}`);
    }

    // 3. Test GET /public/grievances?status=HANGED
    console.log("\n[Test 3] Testing GET /public/grievances?status=HANGED...");
    const res3 = await fetch(`${BASE_PUBLIC_URL}/grievances?status=HANGED`);
    const data3 = await res3.json();
    if (res3.status === 200 && data3.data?.grievances?.length > 0) {
      const hangedGrievance = data3.data.grievances[0];
      console.log(`✅ Passed: Retrieved hanged grievance: ${hangedGrievance.ticketNumber} (${hangedGrievance.schoolName})`);
    } else {
      throw new Error(`Failed Test 3: ${JSON.stringify(data3)}`);
    }

    // 4. Test Upvote on a grievance
    const targetGrievance = data2.data.grievances[0];
    const initialUpvotes = targetGrievance.upvotesCount;
    const testFingerprint = "fp_test_dev_" + Date.now();

    console.log(`\n[Test 4] Testing citizen upvote on ticket ${targetGrievance.ticketNumber}...`);
    const res4 = await fetch(`${BASE_PUBLIC_URL}/grievances/${targetGrievance.id}/upvote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceFingerprint: testFingerprint }),
    });
    const data4 = await res4.json();
    if (res4.status === 200 && data4.data?.newUpvoteCount === initialUpvotes + 1) {
      console.log(`✅ Passed: Upvote recorded. New count: ${data4.data.newUpvoteCount}`);
    } else {
      throw new Error(`Failed Test 4: ${JSON.stringify(data4)}`);
    }

    // 5. Test duplicate vote protection
    console.log("\n[Test 5] Testing duplicate upvote rejection from same fingerprint...");
    const res5 = await fetch(`${BASE_PUBLIC_URL}/grievances/${targetGrievance.id}/upvote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceFingerprint: testFingerprint }),
    });
    const data5 = await res5.json();
    if (res5.status === 429 && data5.success === false) {
      console.log("✅ Passed: 429 Duplicate vote rejected properly:", data5.message);
    } else {
      throw new Error(`Failed Test 5: ${JSON.stringify(data5)}`);
    }

    // 6. Test Module 9: Social Media Advocacy Generator
    const [testUser] = await User.findOrCreate({
      where: { phoneNumber: "+919876543210" },
    });
    const userToken = testUser.generateAccessToken();

    console.log("\n[Test 6] Testing POST /social/generate-post/:grievanceId for Twitter/X...");
    const res6 = await fetch(`${BASE_SOCIAL_URL}/generate-post/${targetGrievance.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ platform: "TWITTER_X" }),
    });
    const data6 = await res6.json();
    if (
      res6.status === 200 &&
      data6.data?.platform === "TWITTER_X" &&
      data6.data?.directShareUrl?.startsWith("https://twitter.com/intent/tweet") &&
      data6.data?.taggedHandles?.length > 0
    ) {
      console.log("✅ Passed: Twitter/X advocacy post generated!");
      console.log(`   Tagged Handles: ${data6.data.taggedHandles.join(", ")}`);
      console.log(`   Sample Post Text:\n   "${data6.data.postText.slice(0, 120)}..."`);
    } else {
      throw new Error(`Failed Test 6: ${JSON.stringify(data6)}`);
    }

    // 7. Test Module 9: WhatsApp Share format
    console.log("\n[Test 7] Testing POST /social/generate-post/:grievanceId for WhatsApp...");
    const res7 = await fetch(`${BASE_SOCIAL_URL}/generate-post/${targetGrievance.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ platform: "WHATSAPP" }),
    });
    const data7 = await res7.json();
    if (
      res7.status === 200 &&
      data7.data?.platform === "WHATSAPP_SHARE" &&
      data7.data?.directShareUrl?.startsWith("https://api.whatsapp.com/send")
    ) {
      console.log("✅ Passed: WhatsApp advocacy draft generated!");
      console.log(`   Direct Share URL: ${data7.data.directShareUrl.slice(0, 80)}...`);
    } else {
      throw new Error(`Failed Test 7: ${JSON.stringify(data7)}`);
    }

    console.log("\n==================================================");
    console.log("🎉 ALL MODULE 8 & 9 TESTS PASSED SUCCESSFULLY!");
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Test error:", err);
    process.exit(1);
  } finally {
    if (server) server.close();
    process.exit(0);
  }
};

runPublicAndSocialTests();
