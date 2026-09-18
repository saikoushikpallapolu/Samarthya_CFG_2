import { DataTypes, Model } from "sequelize";
import sequelize from "../db/postgres.js";

class School extends Model {
  // Compatibility helper
  static findById(id) {
    return this.findByPk(id);
  }
}

School.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // UDISE Code is unique nationally across all Indian schools
    udiseCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    schoolName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    // Location hierarchy for geographical jurisdiction mapping
    state: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    district: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    block: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    cluster: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    villageOrWard: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    // Geographical GPS Coordinates for Citizen Map Search and Distance Calculation
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      validate: {
        min: -90,
        max: 90,
      },
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      validate: {
        min: -180,
        max: 180,
      },
    },
    // School Demographics & Info
    category: {
      type: DataTypes.STRING(50),
      allowNull: true, // Primary, Upper Primary, Secondary, Senior Secondary
    },
    managementType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "Department of Education",
    },
    totalStudentsEnrolled: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    headmasterName: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    headmasterPhone: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    // Cached counters for fast public citizen search & discovery cards
    totalGrievancesCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    resolvedGrievancesCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    hangedGrievancesCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "School",
    tableName: "schools",
    timestamps: true,
    indexes: [
      { fields: ["udiseCode"], unique: true, name: "idx_schools_udise" },
      { fields: ["schoolName"], name: "idx_schools_name" },
      { fields: ["state", "district", "block"], name: "idx_schools_location" },
      { fields: ["pincode"], name: "idx_schools_pincode" },
      { fields: ["villageOrWard"], name: "idx_schools_village" },
      { fields: ["latitude", "longitude"], name: "idx_schools_lat_lng" },
    ],
  }
);

export { School };
export default School;
