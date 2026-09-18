import dotenv from "dotenv";
dotenv.config();

import { sequelize, User } from "../models/index.js";
import { app } from "../app.js";

const runMasterDataTests = async () => {
  let server;
  try {
    console.log("==================================================");
    console.log("🧪 RUNNING MODULE 3: MASTER DATA CONTROLLER TESTS");
    console.log("==================================================");

    await sequelize.authenticate();
    console.log("✅ Database connected.");

    const PORT = 8005;
    server = app.listen(PORT);
    const BASE_URL = `http://localhost:${PORT}/api/v1`;

    // 1. Test GET /categories in Hindi (default)
    console.log("\n[Test 1] Testing GET /categories (Hindi default)...");
    const res1 = await fetch(`${BASE_URL}/categories?language=hi`);
    const data1 = await res1.json();
    if (res1.status === 200 && Array.isArray(data1.data) && data1.data.length > 0) {
      console.log(`✅ Passed: Fetched ${data1.data.length} categories.`);
      console.log(`   Sample Category: ${data1.data[0].categoryName} (${data1.data[0].categoryCode}) | SLA: ${data1.data[0].defaultSlaDays} days`);
      console.log(`   Department: ${data1.data[0].department?.departmentName}`);
    } else {
      throw new Error(`Failed Test 1: ${JSON.stringify(data1)}`);
    }

    // 2. Test GET /categories in Punjabi ('pa')
    console.log("\n[Test 2] Testing GET /categories (Punjabi 'pa')...");
    const res2 = await fetch(`${BASE_URL}/categories?language=pa`);
    const data2 = await res2.json();
    if (res2.status === 200 && Array.isArray(data2.data) && data2.data.length > 0) {
      console.log(`✅ Passed: Punjabi title for category 1: "${data2.data[0].categoryName}"`);
    } else {
      throw new Error(`Failed Test 2: ${JSON.stringify(data2)}`);
    }

    // 3. Test GET /departments
    console.log("\n[Test 3] Testing GET /departments...");
    const res3 = await fetch(`${BASE_URL}/departments`);
    const data3 = await res3.json();
    if (res3.status === 200 && Array.isArray(data3.data) && data3.data.length > 0) {
      console.log(`✅ Passed: Fetched ${data3.data.length} departments.`);
      console.log(`   Departments: ${data3.data.map((d) => d.departmentCode).join(", ")}`);
    } else {
      throw new Error(`Failed Test 3: ${JSON.stringify(data3)}`);
    }

    // 4. Test GET /authorities without token (should fail 401)
    console.log("\n[Test 4] Testing GET /authorities without Auth token (expecting 401)...");
    const res4 = await fetch(`${BASE_URL}/authorities?state=Haryana&district=Sonipat`);
    const data4 = await res4.json();
    if (res4.status === 401) {
      console.log("✅ Passed: 401 Unauthorized properly enforced on authorities directory");
    } else {
      throw new Error(`Failed Test 4: ${JSON.stringify(data4)}`);
    }

    // 5. Create token and test GET /authorities with state & district
    const [testUser] = await User.findOrCreate({
      where: { phoneNumber: "+919876543210" },
    });
    const token = testUser.generateAccessToken();

    console.log("\n[Test 5] Testing GET /authorities with Bearer Token (State=Haryana, District=Sonipat)...");
    const res5 = await fetch(`${BASE_URL}/authorities?state=Haryana&district=Sonipat`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data5 = await res5.json();
    if (res5.status === 200 && Array.isArray(data5.data) && data5.data.length > 0) {
      console.log(`✅ Passed: Found ${data5.data.length} authority(ies) for Sonipat, Haryana`);
      console.log(`   Officer: ${data5.data[0].officerName} (${data5.data[0].designation})`);
      console.log(`   Email: ${data5.data[0].officialEmail}`);
    } else {
      throw new Error(`Failed Test 5: ${JSON.stringify(data5)}`);
    }

    console.log("\n==================================================");
    console.log("🎉 ALL MODULE 3 (MASTER DATA) TESTS PASSED!");
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Test error:", err);
    process.exit(1);
  } finally {
    if (server) server.close();
    process.exit(0);
  }
};

runMasterDataTests();
