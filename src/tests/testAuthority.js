import dotenv from "dotenv";
dotenv.config();

import { sequelize, Grievance, Department } from "../models/index.js";
import { app } from "../app.js";

const runAuthorityTests = async () => {
  let server;
  try {
    console.log("==================================================");
    console.log("🧪 RUNNING MODULE 6: AUTHORITY MAGIC LINK TESTS");
    console.log("==================================================");

    await sequelize.authenticate();
    console.log("✅ Database connected.");

    const PORT = 8008;
    server = app.listen(PORT);
    const BASE_URL = `http://localhost:${PORT}/api/v1/authority`;

    // 1. Find a test grievance with an actionToken
    const grievance = await Grievance.findOne({
      where: {
        actionToken: { [sequelize.Sequelize.Op.ne]: null },
      },
    });

    if (!grievance) {
      throw new Error("No grievance found with actionToken to test authority magic link");
    }

    const actionToken = grievance.actionToken;

    // 2. Test GET /authority/grievances/:actionToken (Passwordless view)
    console.log(`\n[Test 1] Testing GET /authority/grievances/:actionToken...`);
    const viewRes = await fetch(`${BASE_URL}/grievances/${actionToken}`);
    const viewData = await viewRes.json();
    if (viewRes.status === 200 && viewData.data?.ticketNumber === grievance.ticketNumber) {
      console.log(`✅ Passed: Officer magic link view loaded!`);
      console.log(`   Ticket: ${viewData.data.ticketNumber} | School: ${viewData.data.schoolName}`);
      console.log(`   Facility: ${viewData.data.facilityAffected} | Days Pending: ${viewData.data.daysPending}`);
    } else {
      throw new Error(`Failed Test 1: ${JSON.stringify(viewData)}`);
    }

    // 3. Test POST /authority/grievances/:actionToken/acknowledge
    console.log(`\n[Test 2] Testing POST /authority/grievances/:actionToken/acknowledge...`);
    const ackRes = await fetch(`${BASE_URL}/grievances/${actionToken}/acknowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        officerRemarks: "Received at Executive Engineer office. JE Er. Vikas deputed for ground inspection.",
        tentativeResolutionDate: "2026-09-28",
      }),
    });
    const ackData = await ackRes.json();
    if (ackRes.status === 200 && ackData.data?.status === "ACKNOWLEDGED") {
      console.log(`✅ Passed: Officer acknowledgment registered! Status=${ackData.data.status}`);
    } else {
      throw new Error(`Failed Test 2: ${JSON.stringify(ackData)}`);
    }

    // 4. Test POST /authority/grievances/:actionToken/update-status (to UNDER_INSPECTION)
    console.log(`\n[Test 3] Testing POST /authority/grievances/:actionToken/update-status (UNDER_INSPECTION)...`);
    const statusRes = await fetch(`${BASE_URL}/grievances/${actionToken}/update-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newStatus: "UNDER_INSPECTION",
        completionSummary: "Site inspection underway by JE Er. Vikas. Measuring required pipeline length.",
        workOrderNumber: "WO-2026-PHED-702",
      }),
    });
    const statusData = await statusRes.json();
    if (statusRes.status === 200 && statusData.data?.status === "UNDER_INSPECTION") {
      console.log(`✅ Passed: Progress updated to ${statusData.data.status} (Event ID: ${statusData.data.timelineEventId})`);
    } else {
      throw new Error(`Failed Test 3: ${JSON.stringify(statusData)}`);
    }

    // 5. Test POST /authority/grievances/:actionToken/forward (Forward to another department e.g. PWD)
    const pwdDept = await Department.findOne({ where: { departmentCode: "PWD" } });
    if (pwdDept) {
      console.log(`\n[Test 4] Testing POST /authority/grievances/:actionToken/forward (Forward to PWD)...`);
      const fwdRes = await fetch(`${BASE_URL}/grievances/${actionToken}/forward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDepartmentId: pwdDept.id,
          reason: "Civil boundary wall reconstruction falls under PWD scope.",
        }),
      });
      const fwdData = await fwdRes.json();
      if (fwdRes.status === 200 && fwdData.data?.newDepartment === pwdDept.departmentName) {
        console.log(`✅ Passed: Successfully forwarded to ${fwdData.data.newDepartment}`);
      } else {
        throw new Error(`Failed Test 4: ${JSON.stringify(fwdData)}`);
      }
    }

    console.log("\n==================================================");
    console.log("🎉 ALL MODULE 6 (AUTHORITY MAGIC LINK) TESTS PASSED!");
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Test error:", err);
    process.exit(1);
  } finally {
    if (server) server.close();
    process.exit(0);
  }
};

runAuthorityTests();
