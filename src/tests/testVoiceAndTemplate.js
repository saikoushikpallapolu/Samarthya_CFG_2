import dotenv from "dotenv";
dotenv.config();

import { sequelize, User, School, GrievanceCategory, GrievanceTemplate } from "../models/index.js";
import { app } from "../app.js";

const runVoiceAndTemplateTests = async () => {
  let server;
  try {
    console.log("==================================================");
    console.log("🧪 RUNNING MODULE 4: VOICE & TEMPLATE TESTS");
    console.log("==================================================");

    await sequelize.authenticate();
    console.log("✅ Database connected.");

    const PORT = 8006;
    server = app.listen(PORT);
    const BASE_URL = `http://localhost:${PORT}/api/v1`;

    // 1. Authenticate user
    const [testUser] = await User.findOrCreate({
      where: { phoneNumber: "+919876543210" },
    });
    const token = testUser.generateAccessToken();

    // 2. Fetch Category and School for tests
    const category = await GrievanceCategory.findOne({
      where: { categoryCode: "WATER_SANITATION" },
    });
    if (!category) throw new Error("Category WATER_SANITATION not found");

    const school = await School.findOne({
      where: { udiseCode: "06080100101" },
    });
    if (!school) throw new Error("School Sonipat not found");

    // 3. Test POST /voice/process-audio
    console.log("\n[Test 1] Testing POST /voice/process-audio (multipart simulated with FormData)...");
    const formData = new FormData();
    const fakeAudioBlob = new Blob(["fake-audio-bytes-sample"], { type: "audio/m4a" });
    formData.append("audio", fakeAudioBlob, "sample_voice.m4a");
    formData.append("languageHint", "hi");
    formData.append("categoryId", category.id);

    const voiceRes = await fetch(`${BASE_URL}/voice/process-audio`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const voiceData = await voiceRes.json();
    if (
      voiceRes.status === 200 &&
      voiceData.data?.transcriptionRaw &&
      voiceData.data?.extractedFields?.facility_affected
    ) {
      console.log("✅ Passed: Audio processed and transcribed!");
      console.log(`   Detected Language: ${voiceData.data.detectedLanguage}`);
      console.log(`   Confidence Score: ${voiceData.data.confidenceScore}%`);
      console.log(`   Transcription: "${voiceData.data.transcriptionRaw.slice(0, 80)}..."`);
      console.log(`   Extracted Facility: ${voiceData.data.extractedFields.facility_affected}`);
    } else {
      throw new Error(`Failed Test 1: ${JSON.stringify(voiceData)}`);
    }

    // 4. Test GET /templates/:categoryId
    console.log(`\n[Test 2] Testing GET /templates/${category.id} (language=hi)...`);
    const tplRes = await fetch(`${BASE_URL}/templates/${category.id}?language=hi`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const tplData = await tplRes.json();
    if (
      tplRes.status === 200 &&
      tplData.data?.templateId &&
      tplData.data?.subjectTemplate &&
      Array.isArray(tplData.data?.requiredVariables)
    ) {
      console.log("✅ Passed: Template retrieved successfully!");
      console.log(`   Template Title: ${tplData.data.templateTitle}`);
      console.log(`   Required Variables Count: ${tplData.data.requiredVariables.length}`);
      console.log(`   Legal References: ${tplData.data.legalReferences}`);
    } else {
      throw new Error(`Failed Test 2: ${JSON.stringify(tplData)}`);
    }

    const templateId = tplData.data.templateId;

    // 5. Test POST /templates/preview-letter
    console.log("\n[Test 3] Testing POST /templates/preview-letter...");
    const previewRes = await fetch(`${BASE_URL}/templates/preview-letter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        templateId,
        schoolId: school.id,
        dynamicFieldValues: {
          facility_affected: "लड़कियों का शौचालय",
          specific_problem: "पानी की टंकी टूटी है और नल में पानी नहीं आ रहा",
          duration_of_issue: "2 महीने",
        },
      }),
    });
    const previewData = await previewRes.json();
    if (
      previewRes.status === 200 &&
      previewData.data?.renderedSubject?.includes(school.schoolName) &&
      previewData.data?.assignedAuthority?.officeName
    ) {
      console.log("✅ Passed: Letter preview rendered successfully!");
      console.log(`   Rendered Subject: ${previewData.data.renderedSubject}`);
      console.log(`   Assigned Authority: ${previewData.data.assignedAuthority.officeName} (${previewData.data.assignedAuthority.officialEmail})`);
    } else {
      throw new Error(`Failed Test 3: ${JSON.stringify(previewData)}`);
    }

    console.log("\n==================================================");
    console.log("🎉 ALL MODULE 4 (VOICE & TEMPLATE) TESTS PASSED!");
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Test error:", err);
    process.exit(1);
  } finally {
    if (server) server.close();
    process.exit(0);
  }
};

runVoiceAndTemplateTests();
