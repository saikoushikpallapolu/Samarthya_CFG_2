import { DataTypes, Model } from "sequelize";
import sequelize from "../db/postgres.js";

class GrievanceCategory extends Model {
  static findById(id) {
    return this.findByPk(id);
  }
}

GrievanceCategory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    categoryName: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    categoryCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true, // e.g., 'WATER_SANITATION', 'TOILET_REPAIR', 'BUILDING_INFRA', 'ELECTRICITY', 'TEACHER_VACANCY'
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "departments",
        key: "id",
      },
    },
    defaultSlaDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 15,
      validate: {
        min: 1,
      },
    },
    defaultPriority: {
      type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"),
      allowNull: false,
      defaultValue: "MEDIUM",
    },
    iconUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Multilingual category translations for English, Hindi, and Punjabi
    nameTranslations: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        en: "",
        hi: "",
        pa: "",
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "GrievanceCategory",
    tableName: "grievance_categories",
    timestamps: true,
    indexes: [{ fields: ["categoryCode"], unique: true, name: "idx_cat_code" }],
  }
);

export { GrievanceCategory };
export default GrievanceCategory;
