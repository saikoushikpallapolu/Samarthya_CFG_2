import { DataTypes, Model } from "sequelize";
import sequelize from "../db/postgres.js";

class GrievanceAttachment extends Model {
  static findById(id) {
    return this.findByPk(id);
  }
}

GrievanceAttachment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    grievanceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "grievances",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    fileUrl: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    attachmentType: {
      type: DataTypes.ENUM(
        "ISSUE_PHOTO",
        "ISSUE_AUDIO",
        "ACK_RECEIPT",
        "COMPLETION_PHOTO",
        "OFFICIAL_DOCUMENT"
      ),
      allowNull: false,
    },
    fileMimeType: {
      type: DataTypes.STRING(100),
      allowNull: false, // e.g. 'image/jpeg', 'audio/mp4', 'application/pdf'
    },
    fileSizeBytes: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    caption: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    uploadedByUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    sequelize,
    modelName: "GrievanceAttachment",
    tableName: "grievance_attachments",
    timestamps: true,
    updatedAt: false, // Attachments are immutable once uploaded
    indexes: [
      { fields: ["grievanceId"], name: "idx_attachments_grievance" },
      { fields: ["attachmentType"], name: "idx_attachments_type" },
    ],
  }
);

export { GrievanceAttachment };
export default GrievanceAttachment;
