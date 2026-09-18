import dotenv from "dotenv";
dotenv.config();

import {
  sequelize,
  School,
  Department,
  GovernmentAuthority,
  GrievanceCategory,
  JurisdictionMapping,
  GrievanceTemplate,
  Grievance,
  User,
} from "../models/index.js";

export const seedDatabase = async () => {
  try {
    console.log("🌱 Seeding realistic test data into PostgreSQL...");

    // 1. Seed Departments
    const [doe] = await Department.findOrCreate({
      where: { departmentCode: "DOE" },
      defaults: {
        departmentName: "Directorate of Education",
        departmentCode: "DOE",
        description: "School staff, academics, mid-day meals and pedagogical supplies",
      },
    });

    const [pwd] = await Department.findOrCreate({
      where: { departmentCode: "PWD" },
      defaults: {
        departmentName: "Public Works Department",
        departmentCode: "PWD",
        description: "Civil infrastructure, boundary walls, classroom construction",
      },
    });

    const [phed] = await Department.findOrCreate({
      where: { departmentCode: "PHED" },
      defaults: {
        departmentName: "Public Health Engineering Department / Jal Board",
        departmentCode: "PHED",
        description: "Drinking water supply, pipelines, sanitation, sewage",
      },
    });

    console.log("✅ Departments seeded.");

    // 2. Seed Grievance Categories
    const [catWater] = await GrievanceCategory.findOrCreate({
      where: { categoryCode: "WATER_SANITATION" },
      defaults: {
        categoryName: "Drinking Water & Sanitation",
        categoryCode: "WATER_SANITATION",
        departmentId: phed.id,
        defaultSlaDays: 10,
        defaultPriority: "HIGH",
        iconUrl: "https://assets.samarthya.org/icons/water.svg",
        nameTranslations: {
          en: "Drinking Water & Sanitation",
          hi: "पेयजल एवं स्वच्छता",
          pa: "ਪੀਣ ਵਾਲਾ ਪਾਣੀ ਅਤੇ ਸਵੱਛਤਾ",
        },
      },
    });

    const [catToilet] = await GrievanceCategory.findOrCreate({
      where: { categoryCode: "TOILET_REPAIR" },
      defaults: {
        categoryName: "Girls & Boys Toilet Repair",
        categoryCode: "TOILET_REPAIR",
        departmentId: pwd.id,
        defaultSlaDays: 7,
        defaultPriority: "CRITICAL",
        iconUrl: "https://assets.samarthya.org/icons/toilet.svg",
        nameTranslations: {
          en: "Girls & Boys Toilet Repair",
          hi: "बालिका एवं बालक शौचालय मरम्मत",
          pa: "ਲੜਕੀਆਂ ਅਤੇ ਲੜਕਿਆਂ ਦੇ ਪਖਾਨੇ ਦੀ ਮੁਰੰਮਤ",
        },
      },
    });

    const [catBuilding] = await GrievanceCategory.findOrCreate({
      where: { categoryCode: "BUILDING_INFRA" },
      defaults: {
        categoryName: "Building & Boundary Wall Collapse",
        categoryCode: "BUILDING_INFRA",
        departmentId: pwd.id,
        defaultSlaDays: 20,
        defaultPriority: "HIGH",
        iconUrl: "https://assets.samarthya.org/icons/building.svg",
        nameTranslations: {
          en: "Building & Boundary Wall Repair",
          hi: "भवन एवं चारदीवारी निर्माण",
          pa: "ਇਮਾਰਤ ਅਤੇ ਚਾਰਦੀਵਾਰੀ ਦੀ ਮੁਰੰਮਤ",
        },
      },
    });

    console.log("✅ Categories seeded.");

    // 3. Seed Authorities
    const [authSonipat] = await GovernmentAuthority.findOrCreate({
      where: { officialEmail: "ee.phed.sonipat@haryana.gov.in" },
      defaults: {
        departmentId: phed.id,
        designation: "Executive Engineer (PHED)",
        officeName: "Office of Executive Engineer, PHED Sonipat",
        jurisdictionLevel: "DISTRICT",
        jurisdictionState: "Haryana",
        jurisdictionDistrict: "Sonipat",
        jurisdictionBlock: "Sonipat Rural",
        officerName: "Er. Anil Verma",
        officialEmail: "ee.phed.sonipat@haryana.gov.in",
        officialPhone: "+911302223344",
        officeAddress: "Civil Lines, Near Mini Secretariat, Sonipat, Haryana 131001",
        pincode: "131001",
      },
    });

    const [authDelhi] = await GovernmentAuthority.findOrCreate({
      where: { officialEmail: "dde.northeast@delhi.gov.in" },
      defaults: {
        departmentId: doe.id,
        designation: "Deputy Director of Education",
        officeName: "Office of DDE North East Delhi",
        jurisdictionLevel: "DISTRICT",
        jurisdictionState: "Delhi",
        jurisdictionDistrict: "North East Delhi",
        jurisdictionBlock: "Yamuna Vihar",
        officerName: "Dr. Sunita Grover",
        officialEmail: "dde.northeast@delhi.gov.in",
        officialPhone: "+911122812345",
        officeAddress: "Directorate of Education, Zone 4, Yamuna Vihar, Delhi 110053",
        pincode: "110053",
      },
    });

    console.log("✅ Authorities seeded.");

    // 4. Seed Schools with realistic coordinates
    const [school1] = await School.findOrCreate({
      where: { udiseCode: "06080100101" },
      defaults: {
        udiseCode: "06080100101",
        schoolName: "Govt Boys Senior Secondary School, Sonipat",
        state: "Haryana",
        district: "Sonipat",
        block: "Sonipat Rural",
        villageOrWard: "Murthal",
        pincode: "131027",
        latitude: 29.023841,
        longitude: 77.071239,
        category: "Senior Secondary",
        totalStudentsEnrolled: 420,
        headmasterName: "Rajesh Sharma",
        headmasterPhone: "+919812345678",
        totalGrievancesCount: 3,
        resolvedGrievancesCount: 1,
        hangedGrievancesCount: 1,
      },
    });

    const [school2] = await School.findOrCreate({
      where: { udiseCode: "07010100202" },
      defaults: {
        udiseCode: "07010100202",
        schoolName: "Govt Sarvodaya Kanya Vidyalaya, Seelampur",
        state: "Delhi",
        district: "North East Delhi",
        block: "Seelampur",
        villageOrWard: "Seelampur Block A",
        pincode: "110053",
        latitude: 28.669812,
        longitude: 77.268914,
        category: "Secondary",
        totalStudentsEnrolled: 680,
        headmasterName: "Sunita Rani",
        headmasterPhone: "+919811223344",
        totalGrievancesCount: 2,
        resolvedGrievancesCount: 1,
        hangedGrievancesCount: 0,
      },
    });

    const [school3] = await School.findOrCreate({
      where: { udiseCode: "03020100303" },
      defaults: {
        udiseCode: "03020100303",
        schoolName: "Govt High School, Nabha",
        state: "Punjab",
        district: "Patiala",
        block: "Nabha",
        villageOrWard: "Bhadson Road",
        pincode: "147201",
        latitude: 30.37521,
        longitude: 76.15289,
        category: "High School",
        totalStudentsEnrolled: 310,
        headmasterName: "Gurpreet Singh",
        headmasterPhone: "+919877665544",
        totalGrievancesCount: 1,
        resolvedGrievancesCount: 0,
        hangedGrievancesCount: 1,
      },
    });

    console.log("✅ Schools seeded.");

    // 5. Seed Test User (Parent Member)
    const [testUser] = await User.findOrCreate({
      where: { phoneNumber: "+919876543210" },
      defaults: {
        phoneNumber: "+919876543210",
        fullName: "Ramesh Kumar (SMC Member)",
        role: "SMC_MEMBER",
        preferredLanguage: "hi",
        isPhoneVerified: true,
      },
    });

    // 6. Seed Sample Grievances (Hanged & In Progress)
    const [grievanceHanged] = await Grievance.findOrCreate({
      where: { ticketNumber: "SAM-202608-0101" },
      defaults: {
        ticketNumber: "SAM-202608-0101",
        schoolId: school1.id,
        categoryId: catWater.id,
        createdByUserId: testUser.id,
        assignedAuthorityId: authSonipat.id,
        currentEscalationLevel: 2,
        status: "HANGED",
        priority: "HIGH",
        submissionChannel: "HYBRID",
        subject: "Govt Boys Senior Secondary School, Sonipat में पेयजल टंकी व नलों की तत्काल मरम्मत हेतु।",
        formalLetterContent: "सेवा में, अधिशासी अभियंता महोदय...\n\nविद्यालय में पेयजल टंकी 45 दिनों से टूटी हुई है।",
        dynamicFieldValues: {
          facility_affected: "पेयजल टंकी",
          specific_problem: "टंकी टूटी है व पानी नहीं आ रहा",
          duration_of_issue: "45 दिन",
        },
        slaDays: 10,
        slaDeadline: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago (Overdue / Hanged)
        isHanged: true,
        isPublic: true,
        upvotesCount: 42,
      },
    });

    const [grievanceOpen] = await Grievance.findOrCreate({
      where: { ticketNumber: "SAM-202609-0202" },
      defaults: {
        ticketNumber: "SAM-202609-0202",
        schoolId: school2.id,
        categoryId: catToilet.id,
        createdByUserId: testUser.id,
        assignedAuthorityId: authDelhi.id,
        currentEscalationLevel: 1,
        status: "IN_PROGRESS",
        priority: "CRITICAL",
        submissionChannel: "DIGITAL_DISPATCH",
        subject: "Govt Sarvodaya Kanya Vidyalaya, Seelampur में बालिकाओं के शौचालय की मरम्मत हेतु।",
        formalLetterContent: "सेवा में, उप शिक्षा निदेशक महोदय...\n\nबालिका शौचालय में पानी व फ्लश खराब है।",
        dynamicFieldValues: {
          facility_affected: "बालिका शौचालय",
          specific_problem: "फ्लश पाइप व दरवाजे टूटे हैं",
          duration_of_issue: "10 दिन",
        },
        slaDays: 7,
        slaDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // In progress
        isHanged: false,
        isPublic: true,
        upvotesCount: 19,
      },
    });

    const [grievanceResolved] = await Grievance.findOrCreate({
      where: { ticketNumber: "SAM-202607-0050" },
      defaults: {
        ticketNumber: "SAM-202607-0050",
        schoolId: school1.id,
        categoryId: catBuilding.id,
        createdByUserId: testUser.id,
        assignedAuthorityId: authSonipat.id,
        currentEscalationLevel: 1,
        status: "RESOLVED",
        priority: "HIGH",
        submissionChannel: "HYBRID",
        subject: "राजकीय विद्यालय में चारदीवारी निर्माण कार्य।",
        formalLetterContent: "चारदीवारी निर्माण कार्य संपन्न हुआ।",
        dynamicFieldValues: {},
        slaDays: 20,
        slaDeadline: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        resolvedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        isHanged: false,
        isPublic: true,
        upvotesCount: 8,
      },
    });

    console.log("✅ Sample Grievances seeded.");
    console.log("🎉 Seeding complete successfully!");
    return true;
  } catch (error) {
    console.error("❌ Seeding error:", error);
    throw error;
  }
};

// Run directly if invoked from CLI
if (process.argv[1]?.includes("seed.js")) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
