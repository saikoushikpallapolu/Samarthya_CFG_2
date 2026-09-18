import { DataTypes, Model } from "sequelize";
import sequelize from "../db/postgres.js";

class GrievanceUpvote extends Model {
  static findById(id) {
    return this.findByPk(id);
  }
}

GrievanceUpvote.init(
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
    userId: {
      type: DataTypes.UUID,
      allowNull: true, // Nullable for unregistered local citizens upvoting
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true, // IPv4 or IPv6 string for rate-limiting guest votes
    },
    deviceFingerprint: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "GrievanceUpvote",
    tableName: "grievance_upvotes",
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ["grievanceId"], name: "idx_upvotes_grievance" },
      { fields: ["userId"], name: "idx_upvotes_user" },
      { fields: ["ipAddress"], name: "idx_upvotes_ip" },
    ],
  }
);

export { GrievanceUpvote };
export default GrievanceUpvote;
