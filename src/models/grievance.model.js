import { DataTypes, Model } from "sequelize";
import sequelize from "../db/postgres.js";
import crypto from "crypto";

class Grievance extends Model {
  static findById(id) {
    return this.findByPk(id);
  }

  // Helper method to check if the grievance has crossed SLA and is in a hanged state
  checkIfHanged() {
    if (["RESOLVED", "REJECTED"].includes(this.status)) {
      return false;
    }
    const isOverdue = new Date() > new Date(this.slaDeadline);
    if (isOverdue && !this.isHanged) {
      this.isHanged = true;
      this.status = "HANGED";
    }
    return isOverdue;
  }
}

Grievance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Unique public tracking ticket number (e.g. SAM-202609-0842)
    ticketNumber: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    schoolId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "schools",
        key: "id",
      },
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "grievance_categories",
        key: "id",
      },
    },
    templateId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "grievance_templates",
        key: "id",
      },
    },
    createdByUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    assignedAuthorityId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "government_authorities",
        key: "id",
      },
    },
    // Escalation level: 1 = Block/Zonal, 2 = District Officer/DM, 3 = State Directorate
    currentEscalationLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    status: {
      type: DataTypes.ENUM(
        "DRAFT",
        "SUBMITTED",
        "ACKNOWLEDGED",
        "UNDER_INSPECTION",
        "IN_PROGRESS",
        "RESOLVED",
        "REJECTED",
        "HANGED"
      ),
      allowNull: false,
      defaultValue: "SUBMITTED",
    },
    priority: {
      type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"),
      allowNull: false,
      defaultValue: "MEDIUM",
    },
    submissionChannel: {
      type: DataTypes.ENUM("DIGITAL_DISPATCH", "PHYSICAL_MANUAL", "HYBRID"),
      allowNull: false,
      defaultValue: "HYBRID",
    },

    // -------------------------------------------------------------
    // SPEECH-TO-TEXT (STT) AUDIO FIELDS
    // -------------------------------------------------------------
    audioRecordingUrl: {
      type: DataTypes.STRING(1000),
      allowNull: true, // Cloudinary / S3 URL of the recorded voice note
    },
    audioDurationSeconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    audioTranscriptionRaw: {
      type: DataTypes.TEXT,
      allowNull: true, // Raw transcribed text from speech model (e.g. Whisper / Bhashini)
    },
    audioDetectedLanguage: {
      type: DataTypes.ENUM("hi", "pa", "en"),
      allowNull: true,
    },
    audioSttConfidence: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true, // Confidence percentage (e.g. 96.50%)
    },
    audioExtractedFields: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}, // Structured parameters parsed from voice (e.g. { facility: "toilet", duration: "2 months" })
    },
    speechToTextStatus: {
      type: DataTypes.ENUM("NONE", "PROCESSING", "COMPLETED", "FAILED"),
      allowNull: false,
      defaultValue: "NONE",
    },

    // -------------------------------------------------------------
    // LANGUAGE TRANSLATION FIELDS
    // -------------------------------------------------------------
    originalLanguage: {
      type: DataTypes.ENUM("hi", "pa", "en"),
      allowNull: false,
      defaultValue: "hi",
    },
    translatedSubject: {
      type: DataTypes.STRING(500),
      allowNull: true, // Subject translated into English or official administrative dialect
    },
    translatedLetterContent: {
      type: DataTypes.TEXT,
      allowNull: true, // Formal letter translated into department's working language
    },
    languageTranslations: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}, // Multilingual cache: { en: { subject: "...", body: "..." }, hi: {...}, pa: {...} }
    },

    // -------------------------------------------------------------
    // FORMAL APPLICATION LETTER & DOCUMENTS
    // -------------------------------------------------------------
    subject: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    dynamicFieldValues: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    formalLetterContent: {
      type: DataTypes.TEXT,
      allowNull: false, // Formatted formal letter markdown
    },
    generatedPdfUrl: {
      type: DataTypes.STRING(1000),
      allowNull: true, // Downloadable official letterhead PDF with verification QR code
    },
    // Secure token for 1-click magic link acknowledgment by government officers without requiring app login
    actionToken: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: () => crypto.randomBytes(32).toString("hex"),
      unique: true,
    },

    // -------------------------------------------------------------
    // PHYSICAL SUBMISSION & STAMPED RECEIPT TRACKING
    // -------------------------------------------------------------
    physicalSubmissionAckPhotoUrl: {
      type: DataTypes.STRING(1000),
      allowNull: true, // Uploaded photo of the stamped receipt received from government office
    },
    physicalSubmittedAt: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    physicalDiaryNumber: {
      type: DataTypes.STRING(100),
      allowNull: true, // Government office diary / receiving dispatch number
    },

    // -------------------------------------------------------------
    // SLA & TIMELINE TRACKING
    // -------------------------------------------------------------
    slaDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 15,
    },
    slaDeadline: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isHanged: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false, // Automatically flagged true if ticket exceeds SLA without resolution
    },
    firstAcknowledgedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reopenedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reopenCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    // -------------------------------------------------------------
    // CITIZEN SEARCH & PUBLIC ENGAGEMENT
    // -------------------------------------------------------------
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true, // Visible on the citizen public transparency portal
    },
    upvotesCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, // Community upvotes signaling urgency
    },
  },
  {
    sequelize,
    modelName: "Grievance",
    tableName: "grievances",
    timestamps: true,
    indexes: [
      { fields: ["ticketNumber"], unique: true, name: "idx_grievances_ticket" },
      { fields: ["schoolId"], name: "idx_grievances_school" },
      { fields: ["status"], name: "idx_grievances_status" },
      { fields: ["isHanged"], name: "idx_grievances_hanged" },
      { fields: ["assignedAuthorityId"], name: "idx_grievances_authority" },
      { fields: ["slaDeadline"], name: "idx_grievances_sla" },
      { fields: ["actionToken"], unique: true, name: "idx_grievances_token" },
    ],
  }
);

export { Grievance };
export default Grievance;
