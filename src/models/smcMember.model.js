import { DataTypes, Model } from "sequelize";
import sequelize from "../db/postgres.js";

class SmcMember extends Model {
  static findById(id) {
    return this.findByPk(id);
  }
}

SmcMember.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    schoolId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "schools",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    designation: {
      type: DataTypes.ENUM(
        "PRESIDENT",
        "SECRETARY",
        "PARENT_MEMBER",
        "TEACHER_MEMBER",
        "HEADMASTER",
        "COMMUNITY_REPRESENTATIVE"
      ),
      allowNull: false,
      defaultValue: "PARENT_MEMBER",
    },
    // Optional details for parent members representing enrolled children
    studentChildName: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    studentChildGrade: {
      type: DataTypes.STRING(20),
      allowNull: true, // e.g. "Class 6"
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    verifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    tenureStart: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    tenureEnd: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "SmcMember",
    tableName: "smc_members",
    timestamps: true,
    indexes: [
      { fields: ["userId", "schoolId"], unique: true, name: "idx_smc_user_school" },
      { fields: ["schoolId"], name: "idx_smc_school" },
      { fields: ["designation"], name: "idx_smc_designation" },
    ],
  }
);

export { SmcMember };
export default SmcMember;
