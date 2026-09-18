# Samarthya — Digital Grievance Redressal & Public School Empowerment Platform
## Comprehensive Problem Statement, System Architecture, Functional Requirements, Database Schema & API Documentation

---

## 1. Problem Statement Explanation (In Simple & Clear Words)

### 1.1 Context & Background
**Samarthya** is an initiative founded in 2017 by Teach for India alumni with a vision to empower citizens and local communities to actively participate in improving government public services. While public services span across various civic domains, Samarthya’s current primary focus is on **government public schools**.

In government schools across North East Delhi, Sonipat, Haryana, and Punjab (impacting over 19,000+ schools and 24,00,000+ students), public schools are mandated to form **School Management Committees (SMCs)**. 
An SMC is composed of:
- **Parents** of enrolled children
- **School Headmasters/Principals**
- **Senior Teachers**
- **Local community representatives**

These committees meet regularly to identify, discuss, and resolve pressing school-level problems—such as broken infrastructure, lack of separate functional toilets for girls, contaminated drinking water, electricity failures, boundary wall collapses, mid-day meal hygiene issues, and teacher shortages.

### 1.2 The Core Problem & Grassroots Pain Points
While issues that can be solved within the school are resolved through mutual discussions, many severe problems are **external**. They require intervention, budget allocation, and official action from **government administrative bodies** (e.g., Directorate of Education, Municipal Corporations, Public Works Department (PWD), Jal Board, State Electricity Boards, District Magistrates).

When an SMC identifies an issue requiring government action, the current workflow encounters severe friction:
1. **Low Technology Adoption & Language Barriers**:
   - SMC members (especially parents in rural and semi-urban areas) are not tech-savvy.
   - Only about **50% of members have access to smartphones**.
   - Drafting formal government grievance applications requires official, administrative phrasing (in English, Hindi, or Punjabi) which most rural parents cannot write.
2. **Physical Submission & Travel Hardship**:
   - Currently, SMC members must manually write or get physical applications drafted.
   - They must travel long distances (often miles away from rural areas) to district or zonal government offices during working hours.
   - Government officers are frequently unavailable, out for inspections, or make SMC members wait for hours, only to ask them to return another day.
   - This leads to loss of daily wages, travel costs, and eventual fatigue, causing members to give up.
3. **The "Hanged State" (Grievance Black Hole)**:
   - Once a physical letter is submitted, there is zero visibility into its progress.
   - No tracking ID exists; there are no automated alerts or timelines.
   - Grievances sit forgotten in bureaucratic files for months or years in an unresolved "hanged state."
4. **Administrative Overhead on Samarthya**:
   - Currently, Samarthya volunteers manually assist SMCs using **static Excel sheets** to track problems and look up which government department or official is responsible for which geographical location.
   - Excel sheets cannot scale to 19,000+ schools, cannot send automated reminders, and cannot trigger timely escalations.

### 1.3 The Purpose of the Digital Tool
The objective is to build a **mobile-first, voice-enabled, automated Grievance Redressal and Advocacy Management Platform** that:
- **Empowers SMC members** to generate formal, legally and administratively sound grievance letters in seconds using templates and native **audio/voice input**.
- **Eliminates unnecessary physical travel** by automatically mapping the school's location and issue category to the responsible government department and digitally dispatching the grievance (while providing print-ready PDF copies with verification QR codes when physical submission is necessary).
- **Enforces accountability** through automated reminders and rule-based multi-tier escalations sent to authorities.
- **Brings public transparency** through a citizen-facing dashboard showing real-time grievance statuses across all schools.
- **Amplifies community voice** via one-click social media advocacy campaigns when grievances remain stuck.

---

## 2. Everything You Need to Build (System Blueprint)

To fulfill this mission end-to-end, the system comprises the following components:

```
+----------------------------------------------------------------------------------------------------+
|                                    SAMARTHYA DIGITAL ECOSYSTEM                                     |
+----------------------------------------------------------------------------------------------------+
                                                  |
         +----------------------------------------+----------------------------------------+
         |                                        |                                        |
+-------------------+                    +-------------------+                    +-------------------+
|   SMC Members     |                    |    Samarthya      |                    |    Government     |
|   (Mobile Web/PWA |                    |    Admin Portal   |                    |    Authority      |
|    & Voice/Audio) |                    |  (Web Dashboard)  |                    | (Portal / Action) |
+-------------------+                    +-------------------+                    +-------------------+
         |                                        |                                        |
         +----------------------------------------+----------------------------------------+
                                                  |
                       +----------------------------------------------------+
                       |              CORE PLATFORM SERVICES                |
                       +----------------------------------------------------+
                       | 1. Voice-to-Text & Template Population Engine     |
                       | 2. Geographical Authority Mapping & Router Engine  |
                       | 3. PDF Generator (Letterhead, Watermark, QR Code)  |
                       | 4. Multi-Channel Dispatcher (Email, SMS, WhatsApp) |
                       | 5. Automated SLA Tracker & Escalation Engine       |
                       | 6. Social Media Campaign Generator                 |
                       | 7. Citizen Public Dashboard & Upvote System        |
                       +----------------------------------------------------+
                                                  |
                       +----------------------------------------------------+
                       |             PERSISTENCE & INFRASTRUCTURE           |
                       +----------------------------------------------------+
                       | - PostgreSQL (Relational Master & Transactional DB)|
                       | - Redis (Task Queues, Caching, Rate Limiting)      |
                       | - Cloud Object Store (Audio, Letter PDFs, Proofs)  |
                       | - Background Workers (Celery / BullMQ)             |
                       +----------------------------------------------------+
```

1. **Template-Based Grievance Letter Generator**:
   - Pre-configured, vetted grievance templates categorized by domain (Infrastructure, Sanitation, Staffing, Academics, Mid-Day Meal, Safety).
   - Form fields auto-filled using school master data (UDISE code, village, block, district).
   - Multilingual support: Hindi, Punjabi, and English.
2. **Audio/Voice Input Engine**:
   - For users who cannot type formal administrative text, an audio recorder captures their voice in their regional language/dialect.
   - A Speech-to-Text (STT) and entity extractor transcribes the voice, identifies key details (nature of fault, location in school, duration of issue, severity), and automatically populates the template.
3. **Geographical Authority Mapping Engine**:
   - Dynamically resolves: `(School State + District + Block) + Grievance Category = Specific Government Office & Officer`.
   - Replaces manual Excel lookup with an automated database directory containing official emails, mobile numbers, and physical office addresses.
4. **Digital & Physical Dispatch System**:
   - **Digital**: Sends formatted grievance emails and SMS/WhatsApp notifications to designated officers with a direct acknowledgment link.
   - **Physical Hybrid Support**: Generates a downloadable, print-friendly PDF with a unique tracking number, barcoded verification link, and sign-off placeholders for physical submission if the officer requires on-site hard copies. Allows SMC members to snap and upload the stamped physical acknowledgment receipt.
5. **Automated Reminders & Escalation Engine**:
   - Monitors resolution SLAs (e.g., 7 days for minor issues, 15 days for repairs, 30 days for major infrastructure).
   - Periodically pings government officers with reminder alerts.
   - Pings SMC members asking if ground reality has changed.
   - Automatically escalates from Level 1 (Zonal/Block Officer) to Level 2 (District Education Officer) and Level 3 (State Directorate) if no acknowledgment or action is taken.
6. **Public Transparency Dashboard**:
   - Citizen portal showing searchable, filterable school profiles, grievance counts, resolution rates, and average resolution times.
   - Dedicated "Hanged Grievances" view highlighting long-pending issues.
7. **Social Media & Public Advocacy Amplifier**:
   - Allows SMC members and Samarthya coordinators to generate formatted social media posts (X/Twitter threads, Facebook cards, WhatsApp broadcast messages) tagging local authorities, MLAs, and education ministers.
8. **Samarthya Administrative Analytics Suite**:
   - Macro-level decision-making analytics for Samarthya leadership: regional heatmaps, departmental performance, common recurring issues, and policy advocacy reports.

---

## 3. User Roles & Detailed Functional Requirements

### 3.1 Role: SMC Member / School Representative
*Users: Parents, Headmasters, School Principals, and Teacher representatives on the School Management Committee.*

- **FR-SMC-01: Low-Friction Authentication**:
  - Login via Phone Number + OTP.
  - One-time linkage to School via unique UDISE code or school selection dropdown.
  - Role verification by school headmaster or Samarthya coordinator.
- **FR-SMC-02: Guided Grievance Creation**:
  - Select grievance category from visual, icon-based menu (e.g., Water, Electricity, Toilets, Teachers, Building).
  - Select language (Hindi, Punjabi, English).
  - Preview pre-filled school information (UDISE, Principal Name, District, Block).
- **FR-SMC-03: Voice-to-Text Input**:
  - Tap-to-record voice note in local language explaining the problem.
  - Playback audio and re-record if needed.
  - Automated transcription populates description and location within school.
  - Optional manual edit mode to correct transcription.
- **FR-SMC-04: Photo & Proof Attachment**:
  - Capture and attach up to 5 photos/videos directly from mobile camera (e.g., collapsed wall, leaking roof).
- **FR-SMC-05: Letter Preview & PDF Download**:
  - Preview generated formal application letter with official salutations, legal references (RTE Act / State Education Codes), and formal demands.
  - Download print-ready PDF containing unique QR code and grievance tracking ID.
- **FR-SMC-06: Submission Mode Selection**:
  - Choose between "Digital Submission" (system emails/messages the officer) and "Physical Submission" (member prints and submits manually).
  - For physical submission: upload photo of stamped acknowledgment receipt received from government office.
- **FR-SMC-07: Tracking & Timeline**:
  - View real-time status: `Draft`, `Submitted`, `Acknowledged`, `Under Inspection`, `In Progress`, `Resolved`, `Hanged/Overdue`.
  - Receive automated SMS/WhatsApp alerts on status changes.
- **FR-SMC-08: Ground Verification & Feedback**:
  - Confirm whether work is actually completed on the ground before grievance is officially closed.
  - Reopen grievance with comments if work is substandard or incomplete.
- **FR-SMC-09: Social Media Escalation Trigger**:
  - If grievance exceeds SLA, click "Amplify on Social Media" to generate pre-filled post tagging relevant authorities.

---

### 3.2 Role: Samarthya Administrator / Field Coordinator
*Users: Samarthya team members, program managers, and regional coordinators.*

- **FR-ADM-01: Master Data Management**:
  - Manage Schools: Add, update, batch-import schools (UDISE, coordinates, zone, district).
  - Manage Authorities Directory: Maintain list of government departments, designations, official emails, phone numbers, and physical addresses by block/district/state.
  - Manage Templates: Create, update, and localize grievance letter templates with placeholder variables.
  - Manage Categories & SLAs: Set resolution deadlines (days) and escalation paths for each issue category.
- **FR-ADM-02: Grievance Quality Review & Moderation**:
  - Queue of submitted grievances with audio recordings and auto-transcriptions.
  - Ability to review, refine wording, and approve before dispatch.
- **FR-ADM-03: Manual Routing & Department Re-assignment**:
  - Re-route grievances if an authority rejects jurisdiction or forwards to another department.
- **FR-ADM-04: Manual Follow-up & Escalation Control**:
  - Trigger ad-hoc reminders to officers.
  - Manually escalate grievance to higher administrative levels (e.g., District Magistrate / Education Secretary).
- **FR-ADM-05: Analytics & Policy Reporting**:
  - View dashboard of systemic bottlenecks (e.g., "70% of toilet repair requests in District X are delayed past 60 days").
  - Export structured grievance reports to CSV/Excel for government meetings and advocacy.

---

### 3.3 Role: Government Authority / Department Officer
*Users: Block Education Officers (BEO), District Education Officers (DEO), PWD Junior Engineers, Jal Board officers.*

- **FR-GOV-01: Lightweight / Magic-Link Access**:
  - Direct access to grievance details via secure, signed token link sent in official email/SMS (no complex app installation required).
  - Optional authenticated portal for departments managing high volumes.
- **FR-GOV-02: Grievance Review**:
  - View formal letter, uploaded photos, school details, and submission timestamp.
- **FR-GOV-03: Acknowledgment & Action Logging**:
  - 1-click official acknowledgment button (`Acknowledged`).
  - Update status to `Work Scheduled`, `Funds Sanctioned`, `In Progress`, or `Resolved`.
  - Add official action comments, inspection dates, and upload completion photos/work orders.
- **FR-GOV-04: Departmental Forwarding / Rejection**:
  - If misrouted, reject or forward grievance to appropriate department with official reasoning.
- **FR-GOV-05: Request Additional Information**:
  - Post inquiry to SMC (e.g., "Please provide specific room number or water pipeline joint photo").

---

### 3.4 Role: Citizen / General Public
*Users: Local community members, village elders, parents, journalists, civil society advocates.*

- **FR-PUB-01: Public School Transparency Explorer**:
  - Search any school by UDISE, school name, district, or PIN code.
  - View full history of grievances raised by school's SMC, along with current status and resolution metrics.
- **FR-PUB-02: Issue Upvoting / Community Support**:
  - Upvote an open grievance to demonstrate community concern and increase priority ranking.
- **FR-PUB-03: Public Sharing**:
  - Share grievance status cards on WhatsApp, Facebook, and Twitter to create awareness.
- **FR-PUB-04: Macro Analytics Dashboard**:
  - View state-wide and district-wide charts: total grievances raised, resolution percentage, average time taken, and most affected school facilities.

---

### 3.5 Role: System / Automation Worker (Background Engine)
*Automated background worker processes.*

- **FR-SYS-01: Voice Transcription & Extraction**:
  - Process uploaded audio files through Speech-to-Text API and parse key entities into structured template fields.
- **FR-SYS-02: Automated Routing & Dispatch**:
  - Match school location and category against jurisdiction matrix and trigger dispatch jobs.
- **FR-SYS-03: SLA Tracking & Escalation Worker**:
  - Run hourly/daily cron job to calculate aging against defined SLAs.
  - Transition status from `IN_PROGRESS` to `HANGED` if overdue.
  - Automatically dispatch Level 2 / Level 3 escalation notifications.
- **FR-SYS-04: Reminder Scheduler**:
  - Send automated reminder notifications (SMS/Email/WhatsApp) to authorities at 50%, 75%, and 100% of SLA time.
  - Send status check pings to SMC members.
- **FR-SYS-05: PDF & QR Code Rendering**:
  - Render high-resolution PDF letter with embedded verification QR code pointing to public tracking URL.

---

## 4. Database Architecture & Complete Schemas

We will use a primary relational database (**PostgreSQL**) for transactional data integrity, geographic queries, and JSONB document support for dynamic template variables, alongside **Redis** for rate limiting, session caching, and background job queues.

### 4.1 Database Names
1. **`samarthya_core_db`** (PostgreSQL) — Main production database containing all master data, user accounts, templates, grievances, timelines, reminders, and analytics tables.
2. **`samarthya_queue_cache`** (Redis) — Cache and broker for background jobs (audio processing, PDF generation, SMS/email dispatch, SLA monitoring cron).

---

### 4.2 Detailed Relational Schemas (`samarthya_core_db`)

```
+----------------------------------------------------------------------------------------------------+
|                                    ENTITY RELATIONSHIP OVERVIEW                                    |
+----------------------------------------------------------------------------------------------------+
  users ------------< smc_members >------------ schools
    |                                              |
    |                                              |
    +----< grievances >----------------------------+
                |
                +---< grievance_attachments
                +---< grievance_timeline_events
                +---< grievance_reminders
                +---< grievance_upvotes
                +---< social_media_campaigns
                |
   grievance_categories ----< jurisdiction_mappings >---- government_authorities
                |                                                 |
   grievance_templates                                      departments
```

#### Table 1: `users`
*Stores all platform users (SMC members, Samarthya staff, government officials).*
```sql
CREATE TYPE user_role_enum AS ENUM ('SMC_MEMBER', 'SAMARTHYA_ADMIN', 'SAMARTHYA_COORDINATOR', 'GOVERNMENT_OFFICER', 'CITIZEN');
CREATE TYPE preferred_language_enum AS ENUM ('en', 'hi', 'pa');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE,
    role user_role_enum NOT NULL DEFAULT 'SMC_MEMBER',
    preferred_language preferred_language_enum NOT NULL DEFAULT 'hi',
    is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_role ON users(role);
```

#### Table 2: `schools`
*Master registry of all covered government schools.*
```sql
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    udise_code VARCHAR(20) UNIQUE NOT NULL,
    school_name VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    block VARCHAR(100) NOT NULL,
    cluster VARCHAR(100),
    village_or_ward VARCHAR(150) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    category VARCHAR(50), -- Primary, Upper Primary, Secondary, Sr. Secondary
    management_type VARCHAR(100) DEFAULT 'Department of Education',
    total_students_enrolled INTEGER DEFAULT 0,
    headmaster_name VARCHAR(150),
    headmaster_phone VARCHAR(15),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schools_udise ON schools(udise_code);
CREATE INDEX idx_schools_location ON schools(state, district, block);
```

#### Table 3: `smc_members`
*Maps users to schools as School Management Committee members with designations.*
```sql
CREATE TYPE smc_designation_enum AS ENUM ('PRESIDENT', 'SECRETARY', 'PARENT_MEMBER', 'TEACHER_MEMBER', 'HEADMASTER', 'COMMUNITY_REPRESENTATIVE');

CREATE TABLE smc_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    designation smc_designation_enum NOT NULL DEFAULT 'PARENT_MEMBER',
    student_child_name VARCHAR(150),
    student_child_grade VARCHAR(20),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    tenure_start DATE NOT NULL DEFAULT CURRENT_DATE,
    tenure_end DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_school UNIQUE (user_id, school_id)
);

CREATE INDEX idx_smc_members_school ON smc_members(school_id);
```

#### Table 4: `departments`
*Government administrative departments.*
```sql
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_name VARCHAR(200) NOT NULL,
    department_code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'DOE', 'PWD', 'DJB', 'MCD', 'DISCOM'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Table 5: `government_authorities`
*Government officials directory with jurisdiction and official contact info.*
```sql
CREATE TYPE jurisdiction_level_enum AS ENUM ('BLOCK', 'ZONE', 'DISTRICT', 'STATE');

CREATE TABLE government_authorities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    designation VARCHAR(150) NOT NULL, -- e.g., 'Block Education Officer', 'Executive Engineer PWD'
    office_name VARCHAR(255) NOT NULL,
    jurisdiction_level jurisdiction_level_enum NOT NULL DEFAULT 'BLOCK',
    jurisdiction_state VARCHAR(100) NOT NULL,
    jurisdiction_district VARCHAR(100) NOT NULL,
    jurisdiction_block VARCHAR(100),
    officer_name VARCHAR(150),
    official_email VARCHAR(255) NOT NULL,
    official_phone VARCHAR(20),
    office_address TEXT NOT NULL,
    pincode VARCHAR(10),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gov_jurisdiction ON government_authorities(jurisdiction_state, jurisdiction_district, jurisdiction_block);
CREATE INDEX idx_gov_department ON government_authorities(department_id);
```

#### Table 6: `grievance_categories`
*Issue categories with SLA days and primary department.*
```sql
CREATE TYPE priority_level_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TABLE grievance_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(150) NOT NULL,
    category_code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'INFRA_TOILET', 'WATER_DRINKING', 'TEACHER_VACANCY'
    department_id UUID NOT NULL REFERENCES departments(id),
    default_sla_days INTEGER NOT NULL DEFAULT 15,
    default_priority priority_level_enum NOT NULL DEFAULT 'MEDIUM',
    icon_url VARCHAR(500),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Table 7: `jurisdiction_mappings`
*Lookup matrix linking (Category + Location) to Primary Authority and Escalation Authority.*
```sql
CREATE TABLE jurisdiction_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES grievance_categories(id) ON DELETE CASCADE,
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    block VARCHAR(100), -- NULL implies entire district
    primary_authority_id UUID NOT NULL REFERENCES government_authorities(id),
    level_2_authority_id UUID REFERENCES government_authorities(id),
    level_3_authority_id UUID REFERENCES government_authorities(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_mapping UNIQUE (category_id, state, district, block)
);

CREATE INDEX idx_jurisdiction_match ON jurisdiction_mappings(category_id, state, district, block);
```

#### Table 8: `grievance_templates`
*Formal grievance letter templates with language versions and variable placeholders.*
```sql
CREATE TABLE grievance_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES grievance_categories(id) ON DELETE CASCADE,
    language preferred_language_enum NOT NULL DEFAULT 'hi',
    template_title VARCHAR(255) NOT NULL,
    subject_template VARCHAR(500) NOT NULL,
    body_markdown_template TEXT NOT NULL,
    required_variables JSONB NOT NULL, 
    -- e.g. [{"key": "issue_duration", "label": "How long has it been broken?", "type": "string"}]
    legal_references TEXT, -- e.g., "Under Section 24 of RTE Act 2009..."
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cat_lang_ver UNIQUE (category_id, language, version)
);
```

#### Table 9: `grievances`
*Core transaction table representing a filed grievance.*
```sql
CREATE TYPE grievance_status_enum AS ENUM (
    'DRAFT', 
    'SUBMITTED', 
    'ACKNOWLEDGED', 
    'UNDER_INSPECTION', 
    'IN_PROGRESS', 
    'RESOLVED', 
    'REJECTED', 
    'HANGED'
);

CREATE TYPE submission_channel_enum AS ENUM (
    'DIGITAL_DISPATCH', 
    'PHYSICAL_MANUAL', 
    'HYBRID'
);

CREATE TABLE grievances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_ticket_no VARCHAR(30) UNIQUE NOT NULL, -- Format: SAM-YYYYMM-XXXX
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES grievance_categories(id) ON DELETE RESTRICT,
    template_id UUID REFERENCES grievance_templates(id),
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    assigned_authority_id UUID REFERENCES government_authorities(id),
    current_escalation_level INTEGER NOT NULL DEFAULT 1, -- 1: Block/Zone, 2: District, 3: State
    status grievance_status_enum NOT NULL DEFAULT 'SUBMITTED',
    priority priority_level_enum NOT NULL DEFAULT 'MEDIUM',
    submission_channel submission_channel_enum NOT NULL DEFAULT 'HYBRID',
    
    subject VARCHAR(500) NOT NULL,
    dynamic_field_values JSONB NOT NULL DEFAULT '{}'::jsonb,
    formal_letter_content TEXT NOT NULL,
    generated_pdf_url VARCHAR(1000),
    audio_recording_url VARCHAR(1000),
    audio_transcription_raw TEXT,
    
    physical_submission_ack_photo_url VARCHAR(1000),
    physical_submitted_at DATE,
    
    sla_days INTEGER NOT NULL DEFAULT 15,
    sla_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    first_acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    reopened_at TIMESTAMP WITH TIME ZONE,
    reopen_count INTEGER NOT NULL DEFAULT 0,
    
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    upvotes_count INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_grievances_ticket ON grievances(grievance_ticket_no);
CREATE INDEX idx_grievances_school ON grievances(school_id);
CREATE INDEX idx_grievances_status ON grievances(status);
CREATE INDEX idx_grievances_authority ON grievances(assigned_authority_id);
CREATE INDEX idx_grievances_sla ON grievances(sla_deadline) WHERE status NOT IN ('RESOLVED', 'REJECTED');
```

#### Table 10: `grievance_attachments`
*Photos, documents, audio clips, and inspection reports.*
```sql
CREATE TYPE attachment_type_enum AS ENUM ('ISSUE_PHOTO', 'ISSUE_AUDIO', 'ACK_RECEIPT', 'COMPLETION_PHOTO', 'OFFICIAL_DOCUMENT');

CREATE TABLE grievance_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
    file_url VARCHAR(1000) NOT NULL,
    attachment_type attachment_type_enum NOT NULL,
    file_mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT,
    caption VARCHAR(255),
    uploaded_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attachments_grievance ON grievance_attachments(grievance_id);
```

#### Table 11: `grievance_timeline_events`
*Immutable audit trail of every status change, action, and comment.*
```sql
CREATE TYPE timeline_event_type_enum AS ENUM (
    'CREATED',
    'DISPATCHED_DIGITALLY',
    'PHYSICAL_ACK_UPLOADED',
    'ACKNOWLEDGED_BY_OFFICER',
    'STATUS_UPDATED',
    'COMMENT_ADDED',
    'REMINDER_DISPATCHED',
    'AUTOMATICALLY_ESCALATED',
    'MANUALLY_ESCALATED',
    'RESOLVED_BY_OFFICER',
    'VERIFIED_BY_SMC',
    'REOPENED'
);

CREATE TABLE grievance_timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
    performed_by_user_id UUID REFERENCES users(id),
    event_type timeline_event_type_enum NOT NULL,
    previous_status grievance_status_enum,
    new_status grievance_status_enum,
    comment TEXT,
    event_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_timeline_grievance ON grievance_timeline_events(grievance_id);
```

#### Table 12: `grievance_reminders`
*Tracks all automated follow-up notices sent to authorities and SMC members.*
```sql
CREATE TYPE reminder_recipient_enum AS ENUM ('AUTHORITY', 'SMC_MEMBER', 'SAMARTHYA_ADMIN');
CREATE TYPE reminder_channel_enum AS ENUM ('SMS', 'WHATSAPP', 'EMAIL');

CREATE TABLE grievance_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
    recipient_type reminder_recipient_enum NOT NULL,
    recipient_contact VARCHAR(255) NOT NULL,
    channel reminder_channel_enum NOT NULL,
    reminder_sequence_no INTEGER NOT NULL DEFAULT 1, -- 1st reminder, 2nd reminder...
    message_content TEXT NOT NULL,
    delivery_status VARCHAR(50) NOT NULL DEFAULT 'SENT', -- SENT, DELIVERED, FAILED
    dispatched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reminders_grievance ON grievance_reminders(grievance_id);
```

#### Table 13: `grievance_upvotes`
*Citizen and community engagement upvotes for public transparency.*
```sql
CREATE TABLE grievance_upvotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_grievance_voter UNIQUE (grievance_id, user_id)
);
```

#### Table 14: `social_media_campaigns`
*Generated social advocacy drafts and performance tracking.*
```sql
CREATE TYPE social_platform_enum AS ENUM ('TWITTER_X', 'FACEBOOK', 'WHATSAPP_SHARE');

CREATE TABLE social_media_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    platform social_platform_enum NOT NULL,
    post_text TEXT NOT NULL,
    tagged_handles TEXT[], -- e.g., ['@EduMinOfIndia', '@DirectorateEdu']
    share_url VARCHAR(1000),
    clicks_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. API Documentation Reference

The complete, exhaustive API documentation with full request/response schemas, TypeScript interfaces, and error codes has been divided into a standalone, dedicated document for frontend and backend developers:

👉 **[Complete API Documentation (API_DOCUMENTATION.md)](./API_DOCUMENTATION.md)**

### Summary of Modules Covered in `API_DOCUMENTATION.md`:
1. **Module 1: Authentication & User Profile APIs** (OTP login, verification, refresh token, language preference).
2. **Module 2: School Discovery & Citizen Location Search APIs** (Text search, GPS radius search, school details, join SMC).
3. **Module 3: Master Data & Department Directory APIs** (Categories, departments, official authorities directory).
4. **Module 4: Speech-to-Text & Template Engine APIs** (Voice audio processing, formal letter templates, markdown preview).
5. **Module 5: Grievance Lifecycle APIs** (Filing, tracking, physical receipt photo upload, ground verification, reopening).
6. **Module 6: Government Authority 1-Click Action APIs** (Magic link direct access, acknowledgment, status updates, forwarding).
7. **Module 7: Automated SLA Tracking & Escalation APIs** (Live countdown, manual escalation, batch admin escalation).
8. **Module 8: Public Transparency Portal & Citizen Upvoting APIs** (Public dashboard stats, grievance search, upvoting).
9. **Module 9: Social Media Advocacy Generator APIs** (Twitter/X, Facebook, WhatsApp advocacy posts with tagged officials).
10. **Module 10: Samarthya Admin & Macro Decision-Making APIs** (Systemic bottleneck analytics, CSV/Excel report exports).

Please refer to **`API_DOCUMENTATION.md`** for all endpoint specifications, request payloads, response envelopes, and TypeScript types.

---

## 6. Implementation Roadmap

| Phase | Milestone | Key Deliverables |
|:---:|:---|:---|
| **Phase 1** | **Core Foundation & Master Data** | Database setup, School & Authority directory, Role-based authentication (OTP). |
| **Phase 2** | **Template Engine & Audio Input** | Grievance letter templates, Speech-to-Text pipeline, Form populator, PDF generator with QR code. |
| **Phase 3** | **Dispatch & Multi-Channel Notifications** | Automatic authority routing, Email/SMS/WhatsApp dispatch, Physical receipt upload. |
| **Phase 4** | **Escalations, Reminders & SLA Cron** | Background workers for SLA monitoring, Automated reminders, Multi-level escalation engine. |
| **Phase 5** | **Public Transparency & Social Advocacy** | Public dashboard, Upvoting system, 1-click social media campaign generator. |
| **Phase 6** | **Analytics & Administrative Reporting** | Systemic bottleneck heatmaps, CSV/PDF export for government meetings. |

---
*Created by Cursor AI for Samarthya Project Team.*
