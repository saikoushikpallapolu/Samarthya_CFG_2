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

    // 3.1 Seed Jurisdiction Mappings
    const [jurisdictionSonipat] = await JurisdictionMapping.findOrCreate({
      where: {
        categoryId: catWater.id,
        state: "Haryana",
        district: "Sonipat",
      },
      defaults: {
        categoryId: catWater.id,
        state: "Haryana",
        district: "Sonipat",
        block: null, // applies to entire district
        primaryAuthorityId: authSonipat.id,
      },
    });

    const [jurisdictionDelhi] = await JurisdictionMapping.findOrCreate({
      where: {
        categoryId: catToilet.id,
        state: "Delhi",
        district: "North East Delhi",
      },
      defaults: {
        categoryId: catToilet.id,
        state: "Delhi",
        district: "North East Delhi",
        block: null,
        primaryAuthorityId: authDelhi.id,
      },
    });

    console.log("✅ Jurisdiction Mappings seeded.");

    // 3.2 Seed Grievance Templates
    const [templateWaterHi] = await GrievanceTemplate.findOrCreate({
      where: {
        categoryId: catWater.id,
        language: "hi",
      },
      defaults: {
        categoryId: catWater.id,
        language: "hi",
        templateTitle: "पेयजल एवं स्वच्छता सुविधा मरम्मत प्रार्थना पत्र",
        subjectTemplate:
          "विषय: {school_name} (UDISE: {udise_code}) में {facility_affected} की तत्काल मरम्मत एवं कार्यशीलता सुनिश्चित करने हेतु।",
        bodyMarkdownTemplate:
          "सेवा में,\nश्रीमान अधिशासी अभियंता महोदय,\n{authority_office_name},\n{authority_address}\n\nमहोदय,\n\nसविनय निवेदन है कि हम विद्यालय प्रबंधन समिति (SMC) के सदस्य आपका ध्यान विद्यालय की एक गंभीर समस्या की ओर आकर्षित करना चाहते हैं।\n\nविद्यालय विवरण:\n- विद्यालय: **{school_name}**\n- UDISE कोड: **{udise_code}**\n- ग्राम/वार्ड: **{village}**, ब्लॉक: **{block}**, जिला: **{district}**\n\nसमस्या का विवरण:\n- प्रभावित सुविधा: **{facility_affected}**\n- समस्या की प्रकृति: **{specific_problem}**\n- समस्या की अवधि: **{duration_of_issue}**\n\nउल्लेखनीय है कि निःशुल्क और अनिवार्य बाल शिक्षा का अधिकार अधिनियम (RTE Act, 2009) की अनुसूची के अनुसार प्रत्येक विद्यालय में स्वच्छ पेयजल एवं क्रियाशील प्रसाधन सुविधा प्रदान करना राज्य का संवैधानिक उत्तरदायित्व है।\n\nअतः आपसे करबद्ध निवेदन है कि जनहित एवं बालिकाओं के स्वास्थ्य को ध्यान में रखते हुए इस प्रार्थना पत्र पर त्वरित संज्ञान लेते हुए संबंधित तकनीकी शाखा को निरीक्षण एवं मरम्मत का आदेश जारी करने की कृपा करें।\n\nभवदीय / भवदीया,\nविद्यालय प्रबंधन समिति (SMC)\n{school_name}",
        requiredVariables: [
          {
            key: "facility_affected",
            label: "प्रभावित सुविधा (जैसे: पीने के पानी की टंकी / नल)",
            type: "string",
            required: true,
          },
          {
            key: "specific_problem",
            label: "समस्या की प्रकृति (जैसे: टंकी टूटी है और पानी नहीं आ रहा)",
            type: "string",
            required: true,
          },
          {
            key: "duration_of_issue",
            label: "समस्या की अवधि (जैसे: 2 महीने)",
            type: "string",
            required: true,
          },
        ],
        legalReferences: "Section 19 & Schedule of RTE Act 2009",
        isActive: true,
      },
    });

    const [templateToiletHi] = await GrievanceTemplate.findOrCreate({
      where: {
        categoryId: catToilet.id,
        language: "hi",
      },
      defaults: {
        categoryId: catToilet.id,
        language: "hi",
        templateTitle: "बालिका एवं बालक शौचालय मरम्मत प्रार्थना पत्र",
        subjectTemplate:
          "विषय: {school_name} (UDISE: {udise_code}) में {facility_affected} की मरम्मत एवं स्वच्छता व्यवस्था हेतु।",
        bodyMarkdownTemplate:
          "सेवा में,\nउप शिक्षा निदेशक महोदय,\n{authority_office_name},\n{authority_address}\n\nमहोदय,\n\nविद्यालय **{school_name}** (UDISE: **{udise_code}**) में {facility_affected} की हालत अत्यंत जर्जर है।\n\nसमस्या विवरण:\n- समस्या: **{specific_problem}**\n- अवधि: **{duration_of_issue}**\n\nRTE Act 2009 के मानदण्डों के तहत तुरंत कार्रवाई की जाए।\n\nभवदीय,\nSMC समिति\n{school_name}",
        requiredVariables: [
          {
            key: "facility_affected",
            label: "प्रभावित सुविधा (जैसे: शौचालय फ्लश)",
            type: "string",
            required: true,
          },
          {
            key: "specific_problem",
            label: "समस्या क्या है",
            type: "string",
            required: true,
          },
          {
            key: "duration_of_issue",
            label: "समस्या कितने समय से है",
            type: "string",
            required: true,
          },
        ],
        legalReferences: "RTE Act 2009 Norms for Separate Sanitation",
        isActive: true,
      },
    });

    const [templateBuildingHi] = await GrievanceTemplate.findOrCreate({
      where: {
        categoryId: catBuilding.id,
        language: "hi",
      },
      defaults: {
        categoryId: catBuilding.id,
        language: "hi",
        templateTitle: "भवन एवं चारदीवारी निर्माण प्रार्थना पत्र",
        subjectTemplate:
          "विषय: {school_name} (UDISE: {udise_code}) में {facility_affected} के तत्काल पुनर्निर्माण एवं सुरक्षा हेतु।",
        bodyMarkdownTemplate:
          "सेवा में,\nकार्यपालक अभियंता महोदय (PWD),\n{authority_office_name},\n{authority_address}\n\nमहोदय,\n\nविद्यालय **{school_name}** में {facility_affected} क्षतिग्रस्त होने से बच्चों की सुरक्षा को खतरा उत्पन्न हो गया है।\n\nसमस्या विवरण:\n- समस्या: **{specific_problem}**\n- अवधि: **{duration_of_issue}**\n\nकृपया शीघ्र मरम्मत कार्य प्रारंभ करवाएं।\n\nभवदीय,\nSMC समिति\n{school_name}",
        requiredVariables: [
          {
            key: "facility_affected",
            label: "प्रभावित ढांचा (जैसे: चारदीवारी)",
            type: "string",
            required: true,
          },
          {
            key: "specific_problem",
            label: "समस्या का विवरण",
            type: "string",
            required: true,
          },
          {
            key: "duration_of_issue",
            label: "अवधि",
            type: "string",
            required: true,
          },
        ],
        legalReferences: "RTE Act 2009 Safety Norms",
        isActive: true,
      },
    });

    console.log("✅ Templates seeded.");

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
