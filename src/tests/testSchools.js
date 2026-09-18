import dotenv from "dotenv";
dotenv.config();

import { sequelize, User, School } from "../models/index.js";
import { app } from "../app.js";

const runSchoolTests = async () => {
  let server;
  try {
    console.log("==================================================");
    console.log("🧪 RUNNING MODULE 2: SCHOOL CONTROLLER TESTS");
    console.log("==================================================");

    await sequelize.authenticate();
    console.log("✅ Database connected.");

    const PORT = 8002;
    server = app.listen(PORT);
    const BASE_URL = `http://localhost:${PORT}/api/v1/schools`;

    // 1. Test search by name/query
    console.log("\n[Test 1] Searching schools by query 'Sonipat'...");
    const res1 = await fetch(`${BASE_URL}/search?query=Sonipat`);
    const data1 = await res1.json();
    if (res1.status === 200 && data1.data.schools.length > 0) {
      console.log(`✅ Passed: Found ${data1.data.total} schools. First: ${data1.data.schools[0].schoolName}`);
    } else {
      throw new Error(`Failed Test 1: ${JSON.stringify(data1)}`);
    }

    // 2. Test search by pincode
    console.log("\n[Test 2] Searching schools by pincode '110053' (Delhi)...");
    const res2 = await fetch(`${BASE_URL}/search?pincode=110053`);
    const data2 = await res2.json();
    if (res2.status === 200 && data2.data.schools.length > 0) {
      console.log(`✅ Passed: Found ${data2.data.schools[0].schoolName} in District: ${data2.data.schools[0].district}`);
    } else {
      throw new Error(`Failed Test 2: ${JSON.stringify(data2)}`);
    }

    // 3. Test nearby GPS search using coordinates near Seelampur, Delhi (28.67, 77.27)
    console.log("\n[Test 3] Finding nearby schools with GPS coordinates (lat: 28.67, lng: 77.27, radius: 5km)...");
    const res3 = await fetch(`${BASE_URL}/nearby?latitude=28.67&longitude=77.27&radiusKm=5`);
    const data3 = await res3.json();
    if (res3.status === 200 && data3.data.count > 0 && data3.data.schools[0].distanceKm !== undefined) {
      console.log(`✅ Passed: Found ${data3.data.count} nearby school(s).`);
      console.log(`   Closest: ${data3.data.schools[0].schoolName} (~${data3.data.schools[0].distanceKm} km away)`);
    } else {
      throw new Error(`Failed Test 3: ${JSON.stringify(data3)}`);
    }

    // 4. Test get school by UDISE code
    console.log("\n[Test 4] Fetching school by UDISE code '06080100101'...");
    const res4 = await fetch(`${BASE_URL}/06080100101`);
    const data4 = await res4.json();
    if (res4.status === 200 && data4.data.school.udiseCode === "06080100101") {
      console.log(`✅ Passed: Retrieved ${data4.data.school.schoolName}`);
      console.log(`   Live Grievances Stats: Total=${data4.data.school.stats.totalGrievances}, Resolved=${data4.data.school.stats.resolved}, Hanged=${data4.data.school.stats.hanged}`);
    } else {
      throw new Error(`Failed Test 4: ${JSON.stringify(data4)}`);
    }

    const schoolId = data4.data.school.id;

    // 5. Create a test user & token to test joining SMC
    const [testUser] = await User.findOrCreate({
      where: { phoneNumber: "+919811002200" },
      defaults: {
        phoneNumber: "+919811002200",
        fullName: "Pooja Sharma (Mother)",
        role: "SMC_MEMBER",
        preferredLanguage: "hi",
        isPhoneVerified: true,
      },
    });
    const testToken = testUser.generateAccessToken();

    // 6. Test join SMC
    console.log("\n[Test 5] Applying to join SMC committee for school...");
    const res5 = await fetch(`${BASE_URL}/${schoolId}/join-smc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        designation: "PARENT_MEMBER",
        studentChildName: "Rohan Sharma",
        studentChildGrade: "Class 8",
      }),
    });
    const data5 = await res5.json();
    if (res5.status === 201 && data5.data.membershipId) {
      console.log(`✅ Passed: Membership application submitted (ID: ${data5.data.membershipId})`);
    } else if (res5.status === 400 && data5.message?.includes("already registered")) {
      console.log(`✅ Passed: Duplicate registration guard active`);
    } else {
      throw new Error(`Failed Test 5: ${JSON.stringify(data5)}`);
    }

    console.log("\n==================================================");
    console.log("🎉 ALL MODULE 2 (SCHOOLS) TESTS PASSED SUCCESSFULLY!");
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Test error:", err);
    process.exit(1);
  } finally {
    if (server) server.close();
    process.exit(0);
  }
};

runSchoolTests();
