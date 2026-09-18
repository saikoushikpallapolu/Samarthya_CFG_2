import { DataTypes, Model } from "sequelize";
import sequelize from "../db/postgres.js";

class GovernmentAuthority extends Model {
  static findById(id) {
    return this.findByPk(id);
  }
}

GovernmentAuthority.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "departments",
        key: "id",
      },
      onDelete: "RESTRICT",
    },
    designation: {
      type: DataTypes.STRING(150),
      allowNull: false, // e.g. "Block Education Officer", "Executive Engineer (PWD)"
    },
    officeName: {
      type: DataTypes.STRING(255),
      allowNull: false, // e.g. "Office of BEO Sonipat Rural"
    },
    jurisdictionLevel: {
      type: DataTypes.ENUM("BLOCK", "ZONE", "DISTRICT", "STATE"),
      allowNull: false,
      defaultValue: "BLOCK",
    },
    jurisdictionState: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    jurisdictionDistrict: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    jurisdictionBlock: {
      type: DataTypes.STRING(100),
      allowNull: true, // NULL means jurisdiction covers entire district
    },
    officerName: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    officialEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    officialPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    officeAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "GovernmentAuthority",
    tableName: "government_authorities",
    timestamps: true,
    indexes: [
      { fields: ["jurisdictionState", "jurisdictionDistrict", "jurisdictionBlock"], name: "idx_gov_jurisdiction" },
      { fields: ["departmentId"], name: "idx_gov_dept" },
      { fields: ["officialEmail"], name: "idx_gov_email" },
      { fields: ["isActive"], name: "idx_gov_active" },
    ],
  }
);

export { GovernmentAuthority };
export default GovernmentAuthority;
