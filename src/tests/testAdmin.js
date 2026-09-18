import dotenv from "dotenv";
dotenv.config();

import { sequelize, User, Grievance } from "../models/index.js";
import { app } from "../app.js";

const runAdminTests = async () => {
  let server;
  try {
    console.log("==================================================");
    console.log("🧪 RUNNING MODULE 10: ADMIN CONTROLLER TESTS");
    console.log("==================================================");

    await sequelize.authenticate();
    console.log("✅ Database connected.");

    const PORT = 8009;
    server = app.listen(PORT);
    const BASE_URL = `http://localhost:${PORT}/api/v1/admin`;

    // 1. Create/find an admin user and regular user
    const [adminUser] = await User.findOrCreate({
      where: { phoneNumber: "+919999988888" },
      defaults: {
        fullName: "Samarthya Senior Administrator",
        email: "admin@samarthya.org",
        role: "SAMARTHYA_ADMIN",
        isPhoneVerified: true,
      },
    });
    // Ensure role is SAMARTHYA_ADMIN
    adminUser.role = "SAMARTHYA_ADMIN";
    await adminUser.save();
    const adminToken = adminUser.generateAccessToken();

    const [regularUser] = await User.findOrCreate({
      where: { phoneNumber: "+919876543210" },
    });
    const regularToken = regularUser.generateAccessToken();

    // 2. Test GET /admin/analytics/bottlenecks with regular user (Expect 403 Forbidden)
    console.log("\n[Test 1] Testing GET /admin/analytics/bottlenecks with non-admin (expecting 403)...");
    const forbiddenRes = await fetch(`${BASE_URL}/analytics/bottlenecks`, {
      headers: { Authorization: `Bearer ${regularToken}` },
    });
    if (forbiddenRes.status === 403) {
      console.log("✅ Passed: 403 Forbidden properly returned for non-admin");
    } else {
      throw new Error(`Failed Test 1: Expected 403, got ${forbiddenRes.status}`);
    }

    // 3. Test GET /admin/analytics/bottlenecks with Admin Token
    console.log("\n[Test 2] Testing GET /admin/analytics/bottlenecks with Admin Token...");
    const bottleneckRes = await fetch(`${BASE_URL}/analytics/bottlenecks`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const bottleneckData = await bottleneckRes.json();
    if (
      bottleneckRes.status === 200 &&
      Array.isArray(bottleneckData.data?.worstPerformingDepartments) &&
      Array.isArray(bottleneckData.data?.worstPerformingDistricts)
    ) {
      console.log(`✅ Passed: Bottleneck analytics retrieved!`);
      console.log(`   Departments tracked: ${bottleneckData.data.worstPerformingDepartments.length}`);
      console.log(`   Districts tracked: ${bottleneckData.data.worstPerformingDistricts.length}`);
    } else {
      throw new Error(`Failed Test 2: ${JSON.stringify(bottleneckData)}`);
    }

    // 4. Test POST /admin/escalate-batch
    const sampleGrievances = await Grievance.findAll({ limit: 2 });
    const grievanceIds = sampleGrievances.map((g) => g.id);

    console.log(`\n[Test 3] Testing POST /admin/escalate-batch with ${grievanceIds.length} grievances...`);
    const batchRes = await fetch(`${BASE_URL}/escalate-batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        grievanceIds,
        escalationReason: "Batch SLA breach escalation to District Magistrate.",
        targetAuthorityLevel: "DISTRICT",
      }),
    });
    const batchData = await batchRes.json();
    if (batchRes.status === 200 && batchData.data?.escalatedCount === grievanceIds.length) {
      console.log(`✅ Passed: Batch escalated ${batchData.data.escalatedCount} grievance(s)!`);
      console.log(`   Notifications dispatched: ${batchData.data.notificationsDispatched}`);
    } else {
      throw new Error(`Failed Test 3: ${JSON.stringify(batchData)}`);
    }

    // 5. Test GET /admin/reports/export (CSV dataset)
    console.log("\n[Test 4] Testing GET /admin/reports/export (CSV export)...");
    const exportRes = await fetch(`${BASE_URL}/reports/export`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const csvText = await exportRes.text();
    const contentType = exportRes.headers.get("content-type");

    if (
      exportRes.status === 200 &&
      contentType?.includes("text/csv") &&
      csvText.includes("Ticket Number") &&
      csvText.includes("School Name")
    ) {
      console.log(`✅ Passed: CSV report generated with headers and data!`);
      console.log(`   CSV preview:\n${csvText.split("\n").slice(0, 3).join("\n")}`);
    } else {
      throw new Error(`Failed Test 4: Status ${exportRes.status}, ContentType: ${contentType}`);
    }

    console.log("\n==================================================");
    console.log("🎉 ALL MODULE 10 (ADMIN) TESTS PASSED!");
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Test error:", err);
    process.exit(1);
  } finally {
    if (server) server.close();
    process.exit(0);
  }
};

runAdminTests();
