import dotenv from "dotenv";
dotenv.config();

import { sequelize } from "../models/index.js";
import { app } from "../app.js";

const runAuthTests = async () => {
  let server;
  try {
    console.log("==================================================");
    console.log("🧪 RUNNING MODULE 1: AUTH CONTROLLER TESTS");
    console.log("==================================================");

    await sequelize.authenticate();
    console.log("✅ Database connected.");

    const PORT = 8001;
    server = app.listen(PORT);
    const BASE_URL = `http://localhost:${PORT}/api/v1/auth`;

    // 1. Test request-otp with invalid phone
    console.log("\n[Test 1] Testing request-otp with invalid phone...");
    const res1 = await fetch(`${BASE_URL}/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: "12345" }),
    });
    const data1 = await res1.json();
    if (res1.status === 400 && data1.success === false) {
      console.log("✅ Passed (400 Bad Request returned as expected)");
    } else {
      throw new Error(`Failed Test 1: ${JSON.stringify(data1)}`);
    }

    // 2. Test request-otp with valid phone
    console.log("\n[Test 2] Testing request-otp with valid phone (+919876543210)...");
    const res2 = await fetch(`${BASE_URL}/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: "+919876543210", language: "hi" }),
    });
    const data2 = await res2.json();
    if (res2.status === 200 && data2.success === true && data2.data.phoneNumber === "+919876543210") {
      console.log("✅ Passed:", data2.message, "| expiresInSeconds:", data2.data.expiresInSeconds);
    } else {
      throw new Error(`Failed Test 2: ${JSON.stringify(data2)}`);
    }

    // 3. Test verify-otp with invalid OTP
    console.log("\n[Test 3] Testing verify-otp with incorrect OTP...");
    const res3 = await fetch(`${BASE_URL}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: "+919876543210", otp: "000000" }),
    });
    const data3 = await res3.json();
    if (res3.status === 401 && data3.success === false) {
      console.log("✅ Passed (401 Unauthorized returned as expected)");
    } else {
      throw new Error(`Failed Test 3: ${JSON.stringify(data3)}`);
    }

    // 4. Test verify-otp with valid test OTP
    console.log("\n[Test 4] Testing verify-otp with valid OTP (459123)...");
    const res4 = await fetch(`${BASE_URL}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: "+919876543210",
        otp: "459123",
        fullName: "Ramesh Kumar (SMC Member)",
      }),
    });
    const data4 = await res4.json();
    if (res4.status === 200 && data4.data?.accessToken && data4.data?.user?.phoneNumber === "+919876543210") {
      console.log("✅ Passed: Login successful!");
      console.log("   User ID:", data4.data.user.id);
      console.log("   User Name:", data4.data.user.fullName);
      console.log("   Role:", data4.data.user.role);
    } else {
      throw new Error(`Failed Test 4: ${JSON.stringify(data4)}`);
    }

    let accessToken = data4.data.accessToken;
    let refreshToken = data4.data.refreshToken;

    // 5. Test current-user with accessToken
    console.log("\n[Test 5] Testing current-user with Bearer Token...");
    const res5 = await fetch(`${BASE_URL}/current-user`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data5 = await res5.json();
    if (res5.status === 200 && data5.data?.user?.fullName === "Ramesh Kumar (SMC Member)") {
      console.log("✅ Passed: Current user retrieved:", data5.data.user.fullName);
    } else {
      throw new Error(`Failed Test 5: ${JSON.stringify(data5)}`);
    }

    // 6. Test update-language
    console.log("\n[Test 6] Testing update-language to Punjabi ('pa')...");
    const res6 = await fetch(`${BASE_URL}/update-language`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ language: "pa" }),
    });
    const data6 = await res6.json();
    if (res6.status === 200 && data6.data?.preferredLanguage === "pa") {
      console.log("✅ Passed:", data6.message);
    } else {
      throw new Error(`Failed Test 6: ${JSON.stringify(data6)}`);
    }

    // 7. Test refresh-token
    console.log("\n[Test 7] Testing refresh-token...");
    const res7 = await fetch(`${BASE_URL}/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const data7 = await res7.json();
    if (res7.status === 200 && data7.data?.accessToken) {
      console.log("✅ Passed: New access token issued successfully");
      accessToken = data7.data.accessToken;
    } else {
      throw new Error(`Failed Test 7: ${JSON.stringify(data7)}`);
    }

    // 8. Test logout
    console.log("\n[Test 8] Testing logout...");
    const res8 = await fetch(`${BASE_URL}/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data8 = await res8.json();
    if (res8.status === 200 && data8.success === true) {
      console.log("✅ Passed: Logged out successfully");
    } else {
      throw new Error(`Failed Test 8: ${JSON.stringify(data8)}`);
    }

    console.log("\n==================================================");
    console.log("🎉 ALL MODULE 1 (AUTH) TESTS PASSED SUCCESSFULLY!");
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Test error:", err);
    process.exit(1);
  } finally {
    if (server) server.close();
    process.exit(0);
  }
};

runAuthTests();
