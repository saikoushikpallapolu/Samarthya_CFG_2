# Samarthya — Complete REST API Documentation
## Digital Grievance Redressal & Public School Empowerment Platform

> **Target Audience**: Backend Engineers & Frontend Engineers (Web, PWA & Mobile App).  
> **Version**: `v1.0.0`  
> **Protocol**: HTTPS / RESTful  
> **Data Format**: `application/json` (UTF-8) & `multipart/form-data` (File/Audio uploads)  
> **Date**: September 2026

---

## Table of Contents
1. [Architecture & Design Principles](#1-architecture--design-principles)
2. [Authentication, Authorization & Headers](#2-authentication-authorization--headers)
3. [Global Response & Error Envelope Specification](#3-global-response--error-envelope-specification)
4. [TypeScript Interfaces for Frontend Integration](#4-typescript-interfaces-for-frontend-integration)
5. [Module 1: Authentication & User Profile APIs](#5-module-1-authentication--user-profile-apis)
6. [Module 2: School Discovery & Citizen Location Search APIs](#6-module-2-school-discovery--citizen-location-search-apis)
7. [Module 3: Master Data & Department Directory APIs](#7-module-3-master-data--department-directory-apis)
8. [Module 4: Speech-to-Text & Template Engine APIs](#8-module-4-speech-to-text--template-engine-apis)
9. [Module 5: Grievance Lifecycle (Filing, Tracking & Ground Verification)](#9-module-5-grievance-lifecycle-filing-tracking--ground-verification)
10. [Module 6: Government Authority 1-Click Action APIs (Magic Link)](#10-module-6-government-authority-1-click-action-apis-magic-link)
11. [Module 7: Automated SLA Tracking & Escalation APIs](#11-module-7-automated-sla-tracking--escalation-apis)
12. [Module 8: Public Transparency Portal & Citizen Upvoting APIs](#12-module-8-public-transparency-portal--citizen-upvoting-apis)
13. [Module 9: Social Media Advocacy Generator APIs](#13-module-9-social-media-advocacy-generator-apis)
14. [Module 10: Samarthya Admin & Macro Decision-Making APIs](#14-module-10-samarthya-admin--macro-decision-making-apis)
15. [Error Code Reference Directory](#15-error-code-reference-directory)

---

## 1. Architecture & Design Principles

### 1.1 Base URLs
* **Local Development**: `http://localhost:8000/api/v1`
* **Staging Server**: `https://staging-api.samarthya.org/api/v1`
* **Production**: `https://api.samarthya.org/api/v1`

### 1.2 Multi-Platform Support
* **SMC Members Mobile Web / PWA**: Audio recording, high-contrast UI, offline queue, touch-friendly, multilingual (Hindi, Punjabi, English).
* **Public Citizen Dashboard**: Searchable by PIN code / UDISE, geolocation proximity, shareable social cards.
* **Government Authority Magic Link View**: Lightweight web page accessible via signed 64-char token without requiring app installation or credentials.
* **Samarthya Admin Portal**: Desktop analytics, heatmap visualizations, bulk escalation, CSV export.

---

## 2. Authentication, Authorization & Headers

### 2.1 Authentication Types
1. **Bearer JWT Token**:
   * Header: `Authorization: Bearer <accessToken>`
   * Cookie Alternative: `accessToken` (HTTP-Only, Secure, SameSite=Strict).
2. **One-Click Magic Action Token (Government Officials)**:
   * Passed as path parameter `:actionToken` (64-character cryptographically secure hex).
   * Valid for 30 days from dispatch. Allows instant acknowledgment without password.
3. **Public Access**:
   * Endpoints under `/public/*` require no authentication headers.
   * Rate limited by client IP address and device fingerprint.

### 2.2 Standard Request Headers
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn...
Accept-Language: hi
```
*(Note: For endpoints accepting audio recordings or photo attachments, do **NOT** set `Content-Type: application/json`; use `multipart/form-data` without manual boundary headers).*

---

## 3. Global Response & Error Envelope Specification

Every API response adheres strictly to the backend `ApiResponse` and `ApiError` class contracts.

### 3.1 Standard Success Envelope
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Operation completed successfully",
  "success": true
}
```

### 3.2 Standard Error Envelope
```json
{
  "statusCode": 400,
  "data": null,
  "message": "Validation failed: Phone number is invalid",
  "success": false,
  "errors": [
    {
      "field": "phoneNumber",
      "message": "Phone number must be a valid 10-digit Indian mobile number (+91...)"
    }
  ]
}
```

---

## 4. TypeScript Interfaces for Frontend Integration

Frontend teams can copy these types directly into their codebase (`src/types/api.ts`):

```typescript
export type UserRole = 
  | 'SMC_MEMBER' 
  | 'SAMARTHYA_ADMIN' 
  | 'SAMARTHYA_COORDINATOR' 
  | 'GOVERNMENT_OFFICER' 
  | 'CITIZEN';

export type SupportedLanguage = 'hi' | 'pa' | 'en';

export type GrievanceStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'ACKNOWLEDGED' 
  | 'UNDER_INSPECTION' 
  | 'IN_PROGRESS' 
  | 'RESOLVED' 
  | 'REJECTED' 
  | 'HANGED';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SubmissionChannel = 'DIGITAL_DISPATCH' | 'PHYSICAL_MANUAL' | 'HYBRID';

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface ApiError {
  statusCode: number;
  data: null;
  message: string;
  success: false;
  errors: Array<{ field?: string; message: string }>;
}

export interface UserProfile {
  id: string;
  phoneNumber: string;
  fullName: string;
  email: string | null;
  role: UserRole;
  preferredLanguage: SupportedLanguage;
  isPhoneVerified: boolean;
  associatedSchools?: Array<{
    schoolId: string;
    schoolName: string;
    udiseCode: string;
    designation: string;
  }>;
}

export interface SchoolItem {
  id: string;
  udiseCode: string;
  schoolName: string;
  state: string;
  district: string;
  block: string;
  villageOrWard: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  totalStudentsEnrolled: number;
  headmasterName: string | null;
  headmasterPhone: string | null;
  totalGrievancesCount: number;
  resolvedGrievancesCount: number;
  hangedGrievancesCount: number;
  distanceKm?: number;
}
```

---

## 5. Module 1: Authentication & User Profile APIs

### 5.1 `POST /auth/request-otp`
Sends a 6-digit OTP via SMS to the user's mobile number for passwordless authentication.

* **Auth**: Public
* **Request Body**:
```json
{
  "phoneNumber": "+919876543210",
  "language": "hi"
}
```
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "phoneNumber": "+919876543210",
    "expiresInSeconds": 300,
    "resendCooldownSeconds": 60
  },
  "message": "OTP sent successfully via SMS",
  "success": true
}
```
* **Error Response (400 Bad Request)**:
```json
{
  "statusCode": 400,
  "data": null,
  "message": "Invalid Indian mobile number format",
  "success": false,
  "errors": ["Phone number must start with +91 followed by 10 digits"]
}
```

---

### 5.2 `POST /auth/verify-otp`
Verifies the SMS OTP, creates user profile if new, and returns JWT tokens along with associated schools.

* **Auth**: Public
* **Request Body**:
```json
{
  "phoneNumber": "+919876543210",
  "otp": "459123",
  "fullName": "Ramesh Kumar" 
}
```
*(Note: `fullName` is optional for existing users, recommended for first-time login).*

* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "d82f716a4c219803b9b4f738914...",
    "user": {
      "id": "e6a2b8e0-1748-4c31-9cb6-90e663a8a301",
      "phoneNumber": "+919876543210",
      "fullName": "Ramesh Kumar",
      "role": "SMC_MEMBER",
      "preferredLanguage": "hi",
      "isPhoneVerified": true,
      "associatedSchools": [
        {
          "schoolId": "a1b2c3d4-0000-0000-0000-000000000001",
          "schoolName": "Govt Boys Senior Secondary School, Sonipat",
          "udiseCode": "06080100101",
          "designation": "PARENT_MEMBER"
        }
      ]
    }
  },
  "message": "Login successful",
  "success": true
}
```
* **Error Response (401 Unauthorized)**:
```json
{
  "statusCode": 401,
  "data": null,
  "message": "Invalid or expired OTP. Please request a new one.",
  "success": false,
  "errors": ["OTP mismatch"]
}
```

---

### 5.3 `POST /auth/refresh-token`
Refreshes an expired access token using the stored refresh token.

* **Auth**: Public (Accepts refresh token in body or HTTP-Only cookie)
* **Request Body**:
```json
{
  "refreshToken": "d82f716a4c219803b9b4f738914..."
}
```
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "refreshToken": "c91e605a3b108702a8a3e627803..."
  },
  "message": "Access token refreshed successfully",
  "success": true
}
```

---

### 5.4 `GET /auth/current-user`
Fetches the currently authenticated user's profile, permissions, and SMC memberships.

* **Auth**: Required (`Bearer <accessToken>`)
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "id": "e6a2b8e0-1748-4c31-9cb6-90e663a8a301",
      "phoneNumber": "+919876543210",
      "fullName": "Ramesh Kumar",
      "email": null,
      "role": "SMC_MEMBER",
      "preferredLanguage": "hi",
      "associatedSchools": [
        {
          "schoolId": "a1b2c3d4-0000-0000-0000-000000000001",
          "schoolName": "Govt Boys Senior Secondary School, Sonipat",
          "udiseCode": "06080100101",
          "designation": "PARENT_MEMBER",
          "studentChildName": "Aman Kumar",
          "studentChildGrade": "Class 7"
        }
      ]
    }
  },
  "message": "Current user fetched successfully",
  "success": true
}
```

---

### 5.5 `PATCH /auth/update-language`
Updates the user's preferred interface and notification language.

* **Auth**: Required (`Bearer <accessToken>`)
* **Request Body**:
```json
{
  "language": "pa"
}
```
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "preferredLanguage": "pa"
  },
  "message": "Language preference updated to Punjabi",
  "success": true
}
```

---

### 5.6 `POST /auth/logout`
Logs out user and invalidates refresh token.

* **Auth**: Required (`Bearer <accessToken>`)
* **Request Body**: `{}`
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Logged out successfully",
  "success": true
}
```

---

## 6. Module 2: School Discovery & Citizen Location Search APIs

### 6.1 `GET /schools/search`
Search schools across India by UDISE code, school name, district, or PIN code.

* **Auth**: Public or Authenticated
* **Query Parameters**:
  * `query`: (string, required if state/district omitted) e.g., `06080100101` or `Sonipat`
  * `state`: (string, optional) e.g., `Haryana`
  * `district`: (string, optional) e.g., `Sonipat`
  * `block`: (string, optional) e.g., `Sonipat Rural`
  * `pincode`: (string, optional) e.g., `131001`
  * `page`: (number, optional, default: 1)
  * `limit`: (number, optional, default: 20)
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "schools": [
      {
        "id": "a1b2c3d4-0000-0000-0000-000000000001",
        "udiseCode": "06080100101",
        "schoolName": "Govt Boys Senior Secondary School, Sonipat",
        "state": "Haryana",
        "district": "Sonipat",
        "block": "Sonipat Rural",
        "villageOrWard": "Murthal",
        "pincode": "131027",
        "latitude": 29.0238410,
        "longitude": 77.0712390,
        "totalStudentsEnrolled": 420,
        "headmasterName": "Rajesh Sharma",
        "headmasterPhone": "+919812345678",
        "totalGrievancesCount": 14,
        "resolvedGrievancesCount": 11,
        "hangedGrievancesCount": 1
      }
    ]
  },
  "message": "Schools fetched successfully",
  "success": true
}
```

---

### 6.2 `GET /schools/nearby`
Find government schools within a specified GPS radius using the user's current device location.

* **Auth**: Public
* **Query Parameters**:
  * `latitude`: (number, required) e.g., `28.6942`
  * `longitude`: (number, required) e.g., `77.2815`
  * `radiusKm`: (number, optional, default: 5, max: 25)
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "userCoordinates": { "latitude": 28.6942, "longitude": 77.2815 },
    "radiusKm": 5,
    "count": 3,
    "schools": [
      {
        "id": "b2c3d4e5-1111-2222-3333-444455556666",
        "udiseCode": "07010100202",
        "schoolName": "Govt Sarvodaya Kanya Vidyalaya, Seelampur",
        "district": "North East Delhi",
        "block": "Seelampur",
        "latitude": 28.669812,
        "longitude": 77.268914,
        "distanceKm": 1.84,
        "totalGrievancesCount": 8,
        "hangedGrievancesCount": 0
      }
    ]
  },
  "message": "Nearby schools retrieved",
  "success": true
}
```

---

### 6.3 `GET /schools/:id`
Retrieves detailed information, active grievances count, and SMC committee composition for a specific school.

* **Auth**: Public
* **Path Parameters**:
  * `id`: UUID of the school
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "school": {
      "id": "a1b2c3d4-0000-0000-0000-000000000001",
      "udiseCode": "06080100101",
      "schoolName": "Govt Boys Senior Secondary School, Sonipat",
      "state": "Haryana",
      "district": "Sonipat",
      "block": "Sonipat Rural",
      "villageOrWard": "Murthal",
      "pincode": "131027",
      "totalStudentsEnrolled": 420,
      "headmasterName": "Rajesh Sharma",
      "stats": {
        "totalGrievances": 14,
        "resolved": 11,
        "inProgress": 2,
        "hanged": 1,
        "resolutionRatePercentage": 78.57
      },
      "activeSmcMembersCount": 12
    }
  },
  "message": "School details retrieved",
  "success": true
}
```

---

### 6.4 `POST /schools/:id/join-smc`
Allows an authenticated user (parent, teacher, headmaster) to join a school's School Management Committee.

* **Auth**: Required (`Bearer <accessToken>`)
* **Path Parameters**:
  * `id`: UUID of the school
* **Request Body**:
```json
{
  "designation": "PARENT_MEMBER",
  "studentChildName": "Aman Kumar",
  "studentChildGrade": "Class 7"
}
```
* **Success Response (201 Created)**:
```json
{
  "statusCode": 201,
  "data": {
    "membershipId": "f1e2d3c4-9999-8888-7777-666655554444",
    "schoolId": "a1b2c3d4-0000-0000-0000-000000000001",
    "designation": "PARENT_MEMBER",
    "isVerified": false,
    "status": "PENDING_VERIFICATION"
  },
  "message": "SMC membership application submitted for verification",
  "success": true
}
```

---

## 7. Module 3: Master Data & Department Directory APIs

### 7.1 `GET /categories`
Lists all supported grievance categories, default SLAs, and icons with multilingual titles.

* **Auth**: Public
* **Query Parameters**:
  * `language`: (string, optional: `hi`, `pa`, `en`, default: `hi`)
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "c1a2b3c4-1111-2222-3333-444455556666",
      "categoryCode": "WATER_SANITATION",
      "categoryName": "पेयजल एवं स्वच्छता",
      "defaultSlaDays": 10,
      "defaultPriority": "HIGH",
      "iconUrl": "https://assets.samarthya.org/icons/water.svg",
      "description": "Drinking water taps, water tanks, pipeline leakages, submersible pump faults",
      "department": {
        "id": "d1d2d3d4-0000-0000-0000-000000000001",
        "departmentCode": "DJB",
        "departmentName": "Public Health Engineering / Jal Board"
      }
    },
    {
      "id": "c2b3c4d5-2222-3333-4444-555566667777",
      "categoryCode": "TOILET_REPAIR",
      "categoryName": "बालिका एवं बालक शौचालय",
      "defaultSlaDays": 7,
      "defaultPriority": "CRITICAL",
      "iconUrl": "https://assets.samarthya.org/icons/toilet.svg",
      "description": "Separate functional toilets for girls and boys under RTE norms",
      "department": {
        "id": "d2d3d4d5-1111-1111-1111-111111111111",
        "departmentCode": "PWD",
        "departmentName": "Public Works Department"
      }
    }
  ],
  "message": "Categories retrieved successfully",
  "success": true
}
```

---

### 7.2 `GET /departments`
Lists all government administrative bodies involved in public school services.

* **Auth**: Public
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "d1d2d3d4-0000-0000-0000-000000000001",
      "departmentCode": "DOE",
      "departmentName": "Directorate of Education",
      "description": "Teachers, textbooks, mid-day meals, academic management"
    },
    {
      "id": "d2d3d4d5-1111-1111-1111-111111111111",
      "departmentCode": "PWD",
      "departmentName": "Public Works Department",
      "description": "School buildings, boundary walls, classrooms, civil works"
    }
  ],
  "message": "Departments retrieved",
  "success": true
}
```

---

### 7.3 `GET /authorities`
Search the official government authorities directory by geography and department.

* **Auth**: Authenticated (`SMC_MEMBER`, `SAMARTHYA_ADMIN`, `SAMARTHYA_COORDINATOR`)
* **Query Parameters**:
  * `state`: (string, required) e.g., `Haryana`
  * `district`: (string, required) e.g., `Sonipat`
  * `block`: (string, optional) e.g., `Sonipat Rural`
  * `departmentId`: (string, optional)
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "g1a2b3c4-5555-6666-7777-888899990000",
      "designation": "Executive Engineer",
      "officeName": "Office of EE, Public Health Engineering Department",
      "officerName": "Er. Anil Verma",
      "jurisdictionLevel": "DISTRICT",
      "officialEmail": "ee.phed.sonipat@haryana.gov.in",
      "officialPhone": "+911302223344",
      "officeAddress": "Civil Lines, Near Mini Secretariat, Sonipat, Haryana 131001"
    }
  ],
  "message": "Authorities fetched",
  "success": true
}
```

---

## 8. Module 4: Speech-to-Text & Template Engine APIs

### 8.1 `POST /voice/process-audio`
Uploads a voice recording recorded by an SMC member. The backend runs the audio through a regional Speech-to-Text pipeline (Hindi/Punjabi/English Whisper/Bhashini), extracts key grievance entities, and maps them to form variables.

* **Auth**: Required (`Bearer <accessToken>`)
* **Content-Type**: `multipart/form-data`
* **Form Parameters**:
  * `audio`: (Binary File, required; `.m4a`, `.mp3`, `.wav`, `.webm`, max 10MB)
  * `languageHint`: (string, optional: `hi`, `pa`, `en`)
  * `categoryId`: (UUID, optional)
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "audioUrl": "https://storage.samarthya.org/audio/rec_98234.m4a",
    "durationSeconds": 18,
    "detectedLanguage": "hi",
    "confidenceScore": 96.4,
    "transcriptionRaw": "हमारे स्कूल के लड़कियों वाले शौचालय में पिछले दो महीने से पानी की टंकी टूटी हुई है और नल में पानी नहीं आ रहा है, जिससे छात्राओं को भारी परेशानी हो रही है।",
    "detectedCategory": {
      "id": "c1a2b3c4-1111-2222-3333-444455556666",
      "categoryCode": "WATER_SANITATION",
      "categoryName": "Drinking Water & Sanitation"
    },
    "extractedFields": {
      "facility_affected": "लड़कियों का शौचालय (Girls Toilet)",
      "specific_problem": "पानी की टंकी टूटी है और नल में पानी नहीं आ रहा",
      "duration_of_issue": "2 महीने (2 Months)",
      "impact": "छात्राओं को परेशानी"
    }
  },
  "message": "Audio processed and transcribed successfully",
  "success": true
}
```
* **Error Response (422 Unprocessable Entity)**:
```json
{
  "statusCode": 422,
  "data": null,
  "message": "Could not clearly transcribe audio. Please record in a quieter environment or type manually.",
  "success": false,
  "errors": ["Low audio signal-to-noise ratio"]
}
```

---

### 8.2 `GET /templates/:categoryId`
Retrieves the official administrative letter template and variable definition schema for a category in the requested language.

* **Auth**: Authenticated
* **Path Parameters**:
  * `categoryId`: UUID of the grievance category
* **Query Parameters**:
  * `language`: (`hi` | `pa` | `en`, default: `hi`)
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "templateId": "t1t2t3t4-9999-8888-7777-666655554444",
    "categoryId": "c1a2b3c4-1111-2222-3333-444455556666",
    "language": "hi",
    "templateTitle": "पेयजल एवं स्वच्छता सुविधा मरम्मत प्रार्थना पत्र",
    "subjectTemplate": "विषय: {school_name} (UDISE: {udise_code}) में {facility_affected} की तत्काल मरम्मत एवं कार्यशीलता सुनिश्चित करने हेतु।",
    "bodyMarkdownTemplate": "सेवा में,\nश्रीमान अधिशासी अभियंता महोदय,\n{authority_office_name},\n{authority_address}\n\nमहोदय,\n\nसविनय निवेदन है कि हम विद्यालय प्रबंधन समिति (SMC) के सदस्य आपका ध्यान विद्यालय की एक गंभीर समस्या की ओर आकर्षित करना चाहते हैं।\n\nविद्यालय विवरण:\n- विद्यालय: **{school_name}**\n- UDISE कोड: **{udise_code}**\n- ग्राम/वार्ड: **{village}**, ब्लॉक: **{block}**, जिला: **{district}**\n\nसमस्या का विवरण:\n- प्रभावित सुविधा: **{facility_affected}**\n- समस्या की प्रकृति: **{specific_problem}**\n- समस्या की अवधि: **{duration_of_issue}**\n\nउल्लेखनीय है कि निःशुल्क और अनिवार्य बाल शिक्षा का अधिकार अधिनियम (RTE Act, 2009) की अनुसूची के अनुसार प्रत्येक विद्यालय में स्वच्छ पेयजल एवं क्रियाशील प्रसाधन सुविधा प्रदान करना राज्य का संवैधानिक उत्तरदायित्व है।\n\nअतः आपसे करबद्ध निवेदन है कि जनहित एवं बालिकाओं के स्वास्थ्य को ध्यान में रखते हुए इस प्रार्थना पत्र पर त्वरित संज्ञान लेते हुए संबंधित तकनीकी शाखा को निरीक्षण एवं मरम्मत का आदेश जारी करने की कृपा करें।\n\nभवदीय / भवदीया,\nविद्यालय प्रबंधन समिति (SMC)\n{school_name}",
    "requiredVariables": [
      {
        "key": "facility_affected",
        "label": "प्रभावित सुविधा (जैसे: लड़कियों का शौचालय)",
        "type": "string",
        "required": true
      },
      {
        "key": "specific_problem",
        "label": "समस्या क्या है? (जैसे: पानी की टंकी टूटी है)",
        "type": "string",
        "required": true
      },
      {
        "key": "duration_of_issue",
        "label": "समस्या कितने समय से है? (जैसे: 2 महीने)",
        "type": "string",
        "required": true
      }
    ],
    "legalReferences": "Section 19 & Schedule of RTE Act 2009"
  },
  "message": "Template fetched successfully",
  "success": true
}
```

---

### 8.3 `POST /templates/preview-letter`
Previews the rendered markdown and letterhead text by injecting the school details and dynamic fields into the template before submission.

* **Auth**: Required (`Bearer <accessToken>`)
* **Request Body**:
```json
{
  "templateId": "t1t2t3t4-9999-8888-7777-666655554444",
  "schoolId": "a1b2c3d4-0000-0000-0000-000000000001",
  "dynamicFieldValues": {
    "facility_affected": "लड़कियों का शौचालय",
    "specific_problem": "पानी की टंकी टूटी है और नल में पानी नहीं आ रहा",
    "duration_of_issue": "2 महीने"
  }
}
```
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "renderedSubject": "विषय: Govt Boys Senior Secondary School, Sonipat (UDISE: 06080100101) में लड़कियों का शौचालय की तत्काल मरम्मत एवं कार्यशीलता सुनिश्चित करने हेतु।",
    "renderedMarkdown": "सेवा में,\nश्रीमान अधिशासी अभियंता महोदय...\n\nविद्यालय: Govt Boys Senior Secondary School, Sonipat (UDISE: 06080100101)...",
    "assignedAuthority": {
      "designation": "Executive Engineer",
      "officeName": "PHED Sonipat",
      "officialEmail": "ee.phed.sonipat@haryana.gov.in"
    }
  },
  "message": "Preview generated successfully",
  "success": true
}
```

---

## 9. Module 5: Grievance Lifecycle (Filing, Tracking & Ground Verification)

### 9.1 `POST /grievances`
Creates and files an official grievance. Automatically:
1. Maps responsible authority based on school location + category.
2. Generates formal application letter and high-res print PDF with verification QR code.
3. Schedules multi-channel digital dispatch (Email, SMS, WhatsApp).
4. Calculates SLA deadline and schedules automated reminders.

* **Auth**: Required (`Bearer <accessToken>`)
* **Request Body**:
```json
{
  "schoolId": "a1b2c3d4-0000-0000-0000-000000000001",
  "categoryId": "c1a2b3c4-1111-2222-3333-444455556666",
  "templateId": "t1t2t3t4-9999-8888-7777-666655554444",
  "submissionChannel": "HYBRID",
  "priority": "HIGH",
  "dynamicFieldValues": {
    "facility_affected": "लड़कियों का शौचालय",
    "specific_problem": "पानी की टंकी टूटी है और नल में पानी नहीं आ रहा",
    "duration_of_issue": "2 महीने"
  },
  "audioRecordingUrl": "https://storage.samarthya.org/audio/rec_98234.m4a",
  "audioTranscriptionRaw": "हमारे स्कूल के लड़कियों वाले शौचालय में...",
  "photoAttachmentUrls": [
    "https://storage.samarthya.org/photos/toilet_broken_1.jpg",
    "https://storage.samarthya.org/photos/toilet_broken_2.jpg"
  ]
}
```
* **Success Response (201 Created)**:
```json
{
  "statusCode": 201,
  "data": {
    "grievanceId": "g7b8c9d0-3333-4444-5555-666677778888",
    "ticketNumber": "SAM-202609-0842",
    "status": "SUBMITTED",
    "slaDays": 10,
    "slaDeadline": "2026-09-28T18:00:00.000Z",
    "assignedAuthority": {
      "officeName": "Office of Executive Engineer, Public Health Engineering Department",
      "officerName": "Er. Anil Verma",
      "officialEmail": "ee.phed.sonipat@haryana.gov.in",
      "officialPhone": "+911302223344",
      "officeAddress": "Civil Lines, Near Mini Secretariat, Sonipat, Haryana 131001"
    },
    "pdfLetterDownloadUrl": "https://storage.samarthya.org/letters/SAM-202609-0842.pdf",
    "publicTrackingUrl": "https://samarthya.org/track/SAM-202609-0842",
    "actionToken": "4e82b7190f84a761e0b..."
  },
  "message": "Grievance submitted and dispatched successfully",
  "success": true
}
```

---

### 9.2 `GET /grievances/:id`
Retrieves full details of a grievance, including the live SLA countdown, attached photos, and chronological audit trail.

* **Auth**: Public or Authenticated (PII phone numbers masked for unauthenticated viewers)
* **Path Parameters**:
  * `id`: UUID or Ticket Number (`SAM-202609-0842`)
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "id": "g7b8c9d0-3333-4444-5555-666677778888",
    "ticketNumber": "SAM-202609-0842",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "submissionChannel": "HYBRID",
    "school": {
      "id": "a1b2c3d4-0000-0000-0000-000000000001",
      "name": "Govt Boys Senior Secondary School, Sonipat",
      "udise": "06080100101",
      "district": "Sonipat",
      "block": "Sonipat Rural"
    },
    "category": {
      "code": "WATER_SANITATION",
      "name": "Drinking Water & Sanitation"
    },
    "subject": "विषय: Govt Boys Senior Secondary School, Sonipat में लड़कियों का शौचालय की तत्काल मरम्मत हेतु।",
    "letterPdfUrl": "https://storage.samarthya.org/letters/SAM-202609-0842.pdf",
    "assignedAuthority": {
      "designation": "Executive Engineer",
      "officeName": "PHED Sonipat",
      "officerName": "Er. Anil Verma",
      "officialEmail": "ee.phed.sonipat@haryana.gov.in"
    },
    "sla": {
      "slaDays": 10,
      "deadline": "2026-09-28T18:00:00.000Z",
      "isHanged": false,
      "daysRemaining": 8,
      "escalationLevel": 1
    },
    "attachments": [
      {
        "id": "att-1",
        "fileUrl": "https://storage.samarthya.org/photos/toilet_broken_1.jpg",
        "attachmentType": "ISSUE_PHOTO",
        "caption": "Damaged PVC pipeline joint"
      }
    ],
    "timeline": [
      {
        "event": "CREATED",
        "performedBy": "Ramesh Kumar (SMC Member)",
        "timestamp": "2026-09-18T10:00:00.000Z",
        "comment": "Grievance submitted by SMC Member"
      },
      {
        "event": "DISPATCHED_DIGITALLY",
        "performedBy": "System",
        "timestamp": "2026-09-18T10:01:00.000Z",
        "comment": "Official grievance email & SMS alert dispatched to EE PHED Sonipat"
      },
      {
        "event": "ACKNOWLEDGED_BY_OFFICER",
        "performedBy": "Er. Anil Verma (Authority)",
        "timestamp": "2026-09-19T14:30:00.000Z",
        "comment": "Inspection team scheduled for site survey on Monday"
      }
    ],
    "upvotesCount": 184
  },
  "message": "Grievance details retrieved",
  "success": true
}
```

---

### 9.3 `GET /grievances/my-school/:schoolId`
Lists all grievances filed for a specific school (with filter by status and pagination).

* **Auth**: Required (`Bearer <accessToken>`)
* **Path Parameters**:
  * `schoolId`: UUID of the school
* **Query Parameters**:
  * `status`: (string, optional: `ALL`, `SUBMITTED`, `IN_PROGRESS`, `RESOLVED`, `HANGED`)
  * `page`: (number, default: 1)
  * `limit`: (number, default: 15)
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "total": 5,
    "page": 1,
    "limit": 15,
    "grievances": [
      {
        "id": "g7b8c9d0-3333-4444-5555-666677778888",
        "ticketNumber": "SAM-202609-0842",
        "categoryName": "Drinking Water & Sanitation",
        "status": "IN_PROGRESS",
        "priority": "HIGH",
        "createdAt": "2026-09-18T10:00:00.000Z",
        "slaDeadline": "2026-09-28T18:00:00.000Z",
        "isHanged": false,
        "upvotesCount": 184
      }
    ]
  },
  "message": "School grievances retrieved",
  "success": true
}
```

---

### 9.4 `POST /grievances/:id/upload-physical-ack`
For rural areas where physical form submission is required, allows the SMC member to photograph and upload the official stamped receipt / receiving copy with diary number.

* **Auth**: Required (`Bearer <accessToken>`)
* **Path Parameters**:
  * `id`: UUID of the grievance
* **Content-Type**: `multipart/form-data`
* **Form Parameters**:
  * `receiptPhoto`: (Binary File, required; image)
  * `submissionDate`: (string, format: `YYYY-MM-DD`, required)
  * `diaryNumber`: (string, optional, e.g., `PHED/SNP/2026/894`)
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "status": "ACKNOWLEDGED",
    "receiptUrl": "https://storage.samarthya.org/receipts/ack_receipt_894.jpg",
    "diaryNumber": "PHED/SNP/2026/894",
    "physicalSubmittedAt": "2026-09-19"
  },
  "message": "Physical stamped receipt uploaded and verified",
  "success": true
}
```

---

### 9.5 `POST /grievances/:id/verify-resolution`
Ground verification by the SMC parent or headmaster to confirm whether the government department actually executed the work properly before the ticket is officially closed.

* **Auth**: Required (`Bearer <accessToken>`)
* **Path Parameters**:
  * `id`: UUID of the grievance
* **Request Body**:
```json
{
  "isSatisfied": true,
  "feedbackComment": "कार्य पूरी तरह से समाप्त हो गया है। पानी की टंकी नई लगा दी गई है और चारों नल ठीक से काम कर रहे हैं।",
  "proofPhotoUrls": [
    "https://storage.samarthya.org/proofs/fixed_tank_photo.jpg"
  ]
}
```
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "status": "RESOLVED",
    "resolvedAt": "2026-09-24T12:00:00.000Z"
  },
  "message": "Ground verification completed. Grievance closed successfully.",
  "success": true
}
```

---

### 9.6 `POST /grievances/:id/reopen`
Reopens an issue if the government official marked it as resolved, but inspection reveals the repair was incomplete or defective.

* **Auth**: Required (`Bearer <accessToken>`)
* **Path Parameters**:
  * `id`: UUID of the grievance
* **Request Body**:
```json
{
  "reopenReason": "अधिकारी ने काम पूरा बताया परंतु नल अभी भी टपक रहे हैं और पानी का दबाव बहुत कम है।",
  "photoUrls": [
    "https://storage.samarthya.org/proofs/defective_tap.jpg"
  ]
}
```
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "status": "IN_PROGRESS",
    "reopenCount": 1,
    "reopenedAt": "2026-09-25T09:30:00.000Z"
  },
  "message": "Grievance reopened and escalation alert sent to authority",
  "success": true
}
```

---

## 10. Module 6: Government Authority 1-Click Action APIs (Magic Link)

### 10.1 `GET /authority/grievances/:actionToken`
Direct access view for government officers via the signed magic link sent to their email or WhatsApp. No login required.

* **Auth**: Action Token in URL
* **Path Parameters**:
  * `actionToken`: 64-character hexadecimal security token
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "ticketNumber": "SAM-202609-0842",
    "status": "SUBMITTED",
    "schoolName": "Govt Boys Senior Secondary School, Sonipat",
    "udiseCode": "06080100101",
    "district": "Sonipat",
    "block": "Sonipat Rural",
    "facilityAffected": "लड़कियों का शौचालय",
    "problemDescription": "पानी की टंकी टूटी है और नल में पानी नहीं आ रहा",
    "daysPending": 1,
    "slaRemainingDays": 9,
    "attachments": [
      "https://storage.samarthya.org/photos/toilet_broken_1.jpg"
    ],
    "pdfLetterUrl": "https://storage.samarthya.org/letters/SAM-202609-0842.pdf"
  },
  "message": "Grievance details loaded for authority action",
  "success": true
}
```

---

### 10.2 `POST /authority/grievances/:actionToken/acknowledge`
1-Click official acknowledgment by the designated department officer.

* **Auth**: Action Token in URL
* **Request Body**:
```json
{
  "officerRemarks": "Received by PHED Sonipat office. Junior Engineer Er. Vikas assigned for site inspection.",
  "tentativeResolutionDate": "2026-09-26"
}
```
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "ticketNumber": "SAM-202609-0842",
    "status": "ACKNOWLEDGED",
    "acknowledgedAt": "2026-09-19T14:30:00.000Z"
  },
  "message": "Official acknowledgment logged and SMC notified",
  "success": true
}
```

---

### 10.3 `POST /authority/grievances/:actionToken/update-status`
Government official marks progress, attaches work order, or marks work completed with completion photos.

* **Auth**: Action Token in URL
* **Request Body**:
```json
{
  "newStatus": "UNDER_INSPECTION",
  "completionSummary": "Installed new 1000L Sintex PVC tank and replaced 4 damaged brass bib taps. Pipeline pressure tested.",
  "workOrderNumber": "WO-2026-PHED-441",
  "completionPhotoUrls": [
    "https://storage.samarthya.org/official_proofs/completion_photo_1.jpg"
  ]
}
```
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "status": "UNDER_INSPECTION",
    "timelineEventId": "evt-982103"
  },
  "message": "Work completion recorded. SMS sent to SMC for verification.",
  "success": true
}
```

---

### 10.4 `POST /authority/grievances/:actionToken/forward`
If a grievance is incorrectly routed or requires another department (e.g., electricity fault is under DISCOM, not PWD), official forwards it with reasons.

* **Auth**: Action Token in URL
* **Request Body**:
```json
{
  "targetDepartmentId": "d1d2d3d4-0000-0000-0000-000000000001",
  "reason": "This water issue requires main external pipeline replacement under Jal Board jurisdiction."
}
```
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "newDepartment": "Delhi Jal Board",
    "status": "SUBMITTED"
  },
  "message": "Grievance forwarded to new department successfully",
  "success": true
}
```

---

## 11. Module 7: Automated SLA Tracking & Escalation APIs

### 11.1 `GET /grievances/:id/sla-status`
Checks the live SLA countdown, breach status, and automated escalation tier.

* **Auth**: Authenticated
* **Path Parameters**:
  * `id`: UUID of grievance
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "ticketNumber": "SAM-202609-0842",
    "status": "IN_PROGRESS",
    "slaDays": 10,
    "createdAt": "2026-09-18T10:00:00.000Z",
    "deadline": "2026-09-28T18:00:00.000Z",
    "isBreached": false,
    "isHanged": false,
    "currentLevel": 1,
    "currentAuthority": "Block Education Officer",
    "nextEscalation": {
      "level": 2,
      "authority": "District Education Officer / District Magistrate",
      "escalatesOn": "2026-09-28T18:00:00.000Z"
    }
  },
  "message": "SLA status calculated",
  "success": true
}
```

---

### 11.2 `POST /grievances/:id/escalate`
Manually triggers an escalation to Level 2 (District Magistrate) or Level 3 (State Directorate) when local officers are uncooperative.

* **Auth**: Required (`SAMARTHYA_ADMIN` or `SAMARTHYA_COORDINATOR`)
* **Path Parameters**:
  * `id`: UUID of grievance
* **Request Body**:
```json
{
  "escalationReason": "Local BEO office visited twice by SMC delegation. No response after 15 days.",
  "targetLevel": 2
}
```
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "previousLevel": 1,
    "newLevel": 2,
    "escalatedTo": "Office of the District Magistrate, Sonipat",
    "escalationNoticePdfUrl": "https://storage.samarthya.org/escalations/ESC-SAM-0842-L2.pdf"
  },
  "message": "Grievance escalated to District level successfully",
  "success": true
}
```

---

## 12. Module 8: Public Transparency Portal & Citizen Upvoting APIs

### 12.1 `GET /public/dashboard-stats`
Macro-level aggregate statistics across all schools for the citizen transparency landing page.

* **Auth**: Public
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "totalSchoolsEmpowered": 19240,
    "totalGrievancesFiled": 8412,
    "totalResolved": 6930,
    "totalHanged": 482,
    "resolutionRatePercentage": 82.38,
    "averageResolutionDays": 16.4,
    "categoryBreakdown": [
      { "category": "Sanitation & Toilets", "total": 3120, "resolved": 2640, "hanged": 190 },
      { "category": "Drinking Water", "total": 2180, "resolved": 1890, "hanged": 94 },
      { "category": "Building & Boundary Wall", "total": 1940, "resolved": 1420, "hanged": 142 },
      { "category": "Electricity & Fans", "total": 1172, "resolved": 980, "hanged": 56 }
    ],
    "topPerformingDistricts": [
      { "district": "North East Delhi", "resolutionRate": 88.2 },
      { "district": "Sonipat", "resolutionRate": 83.5 }
    ]
  },
  "message": "Public stats retrieved",
  "success": true
}
```

---

### 12.2 `GET /public/grievances`
Publicly search, filter, and inspect grievances across government schools.

* **Auth**: Public
* **Query Parameters**:
  * `state`: (string, optional)
  * `district`: (string, optional)
  * `status`: (`ALL` | `OPEN` | `RESOLVED` | `HANGED`, default: `ALL`)
  * `category`: (string, optional)
  * `page`: (number, default: 1)
  * `limit`: (number, default: 20)
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "totalCount": 482,
    "page": 1,
    "limit": 20,
    "grievances": [
      {
        "ticketNumber": "SAM-202609-0842",
        "schoolName": "Govt Boys Senior Secondary School, Sonipat",
        "district": "Sonipat",
        "block": "Sonipat Rural",
        "categoryName": "Drinking Water & Sanitation",
        "status": "HANGED",
        "daysPending": 48,
        "upvotesCount": 184,
        "createdAt": "2026-08-01T10:00:00.000Z",
        "publicTrackingUrl": "https://samarthya.org/track/SAM-202609-0842"
      }
    ]
  },
  "message": "Public grievances feed fetched",
  "success": true
}
```

---

### 12.3 `POST /public/grievances/:id/upvote`
Allows local community citizens to upvote a grievance to show community concern and increase priority ranking.

* **Auth**: Public (Rate-limited: 1 vote per IP / device fingerprint per grievance)
* **Path Parameters**:
  * `id`: UUID of the grievance
* **Request Body**:
```json
{
  "deviceFingerprint": "fp_89a0b1c2..."
}
```
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "grievanceId": "g7b8c9d0-3333-4444-5555-666677778888",
    "newUpvoteCount": 185
  },
  "message": "Upvote recorded successfully",
  "success": true
}
```
* **Error Response (429 Too Many Requests)**:
```json
{
  "statusCode": 429,
  "data": null,
  "message": "You have already upvoted this grievance from this network.",
  "success": false,
  "errors": ["Duplicate vote detected"]
}
```

---

## 13. Module 9: Social Media Advocacy Generator APIs

### 13.1 `POST /social/generate-post/:grievanceId`
Generates pre-formatted advocacy posts for Twitter/X, Facebook, and WhatsApp targeting the exact MLAs, Ministers, and department handles responsible for an overdue or hanged grievance.

* **Auth**: Required (`Bearer <accessToken>`)
* **Path Parameters**:
  * `grievanceId`: UUID of grievance
* **Request Body**:
```json
{
  "platform": "TWITTER_X"
}
```
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "platform": "TWITTER_X",
    "postText": "🚨 Over 45 days and NO ACTION! Govt Boys Sr Sec School, Sonipat (UDISE: 06080100101) has broken toilets & no clean drinking water for 420 students. Multiple requests to @PHED_Haryana have gone unanswered. Requesting urgent intervention by @DchryGov & @EduMinOfIndia. Track live status: https://samarthya.org/track/SAM-202609-0842 #Samarthya #RightToEducation #PublicSchools",
    "taggedHandles": [
      "@PHED_Haryana",
      "@DchryGov",
      "@EduMinOfIndia"
    ],
    "directShareUrl": "https://twitter.com/intent/tweet?text=%F0%9F%9A%A8%20Over%2045%20days...",
    "previewCardImageUrl": "https://api.samarthya.org/cards/SAM-202609-0842.png"
  },
  "message": "Social media advocacy draft generated",
  "success": true
}
```

---

## 14. Module 10: Samarthya Admin & Macro Decision-Making APIs

### 14.1 `GET /admin/analytics/bottlenecks`
Identifies the worst-performing departments, districts, and systemic delays across the 19,000+ school network.

* **Auth**: Required (`SAMARTHYA_ADMIN`)
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "worstPerformingDepartments": [
      {
        "departmentName": "Public Works Department (PWD)",
        "openGrievances": 310,
        "hangedGrievances": 142,
        "averageDaysToResolve": 62
      },
      {
        "departmentName": "Public Health Engineering Department (PHED)",
        "openGrievances": 180,
        "hangedGrievances": 74,
        "averageDaysToResolve": 41
      }
    ],
    "worstPerformingDistricts": [
      {
        "district": "North East Delhi",
        "openGrievances": 420,
        "hangedGrievances": 188,
        "escalationRatePercentage": 44.7
      }
    ]
  },
  "message": "Bottleneck analytics retrieved",
  "success": true
}
```

---

### 14.2 `POST /admin/escalate-batch`
Allows a Samarthya administrator to batch-escalate dozens of grievances overdue past 30 days directly to the District Magistrate or State Education Directorate.

* **Auth**: Required (`SAMARTHYA_ADMIN`)
* **Request Body**:
```json
{
  "grievanceIds": [
    "g7b8c9d0-3333-4444-5555-666677778888",
    "g1b2c3d4-5555-6666-7777-888899990000"
  ],
  "escalationReason": "Overdue past 30 days without department response. Escalating to District Magistrate.",
  "targetAuthorityLevel": "DISTRICT"
}
```
* **Success Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "escalatedCount": 2,
    "notificationsDispatched": 4
  },
  "message": "Batch escalation executed successfully",
  "success": true
}
```

---

### 14.3 `GET /admin/reports/export`
Exports a comprehensive CSV/Excel dataset of grievances for meetings with government education secretaries.

* **Auth**: Required (`SAMARTHYA_ADMIN`)
* **Query Parameters**:
  * `state`: (string, optional)
  * `district`: (string, optional)
  * `startDate`: (`YYYY-MM-DD`, optional)
  * `endDate`: (`YYYY-MM-DD`, optional)
  * `format`: (`csv` | `xlsx`, default: `csv`)
* **Success Response (200 OK)**:
  * Returns `Content-Type: text/csv` with `Content-Disposition: attachment; filename="samarthya_report_2026.csv"`.

---

## 15. Error Code Reference Directory

| HTTP Status | Error Code String | Description | Action for Frontend UI |
|:---:|:---|:---|:---|
| **`400`** | `VALIDATION_ERROR` | Request body or parameters failed validation. | Display inline field errors. |
| **`401`** | `UNAUTHORIZED` | Access token missing, invalid, or expired. | Redirect to `/login` or trigger `/auth/refresh-token`. |
| **`401`** | `INVALID_OTP` | The 6-digit OTP entered was incorrect or expired. | Prompt user to re-enter OTP or click resend. |
| **`403`** | `FORBIDDEN` | User does not have the required role (e.g. non-admin accessing admin report). | Show 403 Access Denied screen. |
| **`404`** | `RESOURCE_NOT_FOUND` | School, Grievance, or Template ID does not exist. | Display 404 Not Found card. |
| **`413`** | `FILE_TOO_LARGE` | Uploaded audio or photo exceeds max size (Audio: 10MB, Photo: 5MB). | Alert user to compress or capture smaller image. |
| **`422`** | `AUDIO_UNRECOGNIZABLE` | Speech-to-Text could not parse audio into text. | Prompt user to record in a quiet room or type text. |
| **`429`** | `RATE_LIMIT_EXCEEDED` | Too many requests (e.g. repeated upvotes or OTP requests). | Disable submit button with countdown timer. |
| **`500`** | `INTERNAL_SERVER_ERROR` | Unexpected backend or database error. | Show friendly "Please try again later" banner. |

---

*Authored by Cursor AI for Samarthya Engineering Team.*
