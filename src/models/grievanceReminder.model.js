import { DataTypes, Model } from "sequelize";
import sequelize from "../db/postgres.js";

class GrievanceReminder extends Model {
  static findById(id) {
    return this.findByPk(id);
  }
}

GrievanceReminder.init(
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
    recipientType: {
      type: DataTypes.ENUM("AUTHORITY", "SMC_MEMBER", "SAMARTHYA_ADMIN"),
      allowNull: false,
    },
    recipientContact: {
      type: DataTypes.STRING(255),
      allowNull: false, // Email or mobile phone number
    },
    channel: {
      type: DataTypes.ENUM("SMS", "WHATSAPP", "EMAIL"),
      allowNull: false,
    },
    reminderSequenceNo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1, // 1st reminder, 2nd reminder, 3rd reminder...
    },
    messageContent: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    deliveryStatus: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "SENT", // SENT, DELIVERED, FAILED
    },
    dispatchedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "GrievanceReminder",
    tableName: "grievance_reminders",
    timestamps: true,
    indexes: [
      { fields: ["grievanceId"], name: "idx_reminders_grievance" },
      { fields: ["recipientType"], name: "idx_reminders_recipient" },
      { fields: ["deliveryStatus"], name: "idx_reminders_status" },
    ],
  }
);

export { GrievanceReminder };
export default GrievanceReminder;
