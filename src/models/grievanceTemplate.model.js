import { DataTypes, Model } from "sequelize";
import sequelize from "../db/postgres.js";

class GrievanceTemplate extends Model {
  static findById(id) {
    return this.findByPk(id);
  }
}

GrievanceTemplate.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "grievance_categories",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    // Multilingual support: Hindi, Punjabi, English
    language: {
      type: DataTypes.ENUM("en", "hi", "pa"),
      allowNull: false,
      defaultValue: "hi",
    },
    templateTitle: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    subjectTemplate: {
      type: DataTypes.STRING(500),
      allowNull: false, // e.g. "विषय: {school_name} में {facility_affected} की मरम्मत हेतु प्रार्थना पत्र।"
    },
    bodyMarkdownTemplate: {
      type: DataTypes.TEXT,
      allowNull: false, // Full administrative letter with variables {school_name}, {udise_code}, etc.
    },
    // Dynamic fields schema extracted from audio or filled by user
    requiredVariables: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      // Example: [{ key: "facility_affected", label: "प्रभावित सुविधा", type: "string", required: true }]
    },
    legalReferences: {
      type: DataTypes.TEXT,
      allowNull: true, // e.g. "Under Section 24 of Right to Education (RTE) Act 2009..."
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "GrievanceTemplate",
    tableName: "grievance_templates",
    timestamps: true,
    indexes: [
      {
        fields: ["categoryId", "language", "version"],
        unique: true,
        name: "uq_cat_lang_ver",
      },
    ],
  }
);

export { GrievanceTemplate };
export default GrievanceTemplate;
