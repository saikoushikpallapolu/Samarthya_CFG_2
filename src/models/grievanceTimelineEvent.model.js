import { DataTypes, Model } from "sequelize";
import sequelize from "../db/postgres.js";

class GrievanceTimelineEvent extends Model {
  static findById(id) {
    return this.findByPk(id);
  }
}

GrievanceTimelineEvent.init(
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
    performedByUserId: {
      type: DataTypes.UUID,
      allowNull: true, // Nullable for automated system-level cron actions
      references: {
        model: "users",
        key: "id",
      },
    },
    eventType: {
      type: DataTypes.ENUM(
        "CREATED",
        "DISPATCHED_DIGITALLY",
        "PHYSICAL_ACK_UPLOADED",
        "ACKNOWLEDGED_BY_OFFICER",
        "STATUS_UPDATED",
        "COMMENT_ADDED",
        "REMINDER_DISPATCHED",
        "AUTOMATICALLY_ESCALATED",
        "MANUALLY_ESCALATED",
        "RESOLVED_BY_OFFICER",
        "VERIFIED_BY_SMC",
        "REOPENED"
      ),
      allowNull: false,
    },
    previousStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    newStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    eventMetadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: "GrievanceTimelineEvent",
    tableName: "grievance_timeline_events",
    timestamps: true,
    updatedAt: false, // Audit trail events are immutable
    indexes: [
      { fields: ["grievanceId"], name: "idx_timeline_grievance" },
      { fields: ["eventType"], name: "idx_timeline_event_type" },
      { fields: ["createdAt"], name: "idx_timeline_created" },
    ],
  }
);

export { GrievanceTimelineEvent };
export default GrievanceTimelineEvent;
