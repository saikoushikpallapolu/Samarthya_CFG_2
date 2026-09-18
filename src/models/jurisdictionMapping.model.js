import { DataTypes, Model } from "sequelize";
import sequelize from "../db/postgres.js";

class JurisdictionMapping extends Model {
  static findById(id) {
    return this.findByPk(id);
  }
}

JurisdictionMapping.init(
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
      allowNull: true, // NULL means applies to the entire district
    },
    // Primary authority (Level 1: Block/Zonal Officer)
    primaryAuthorityId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "government_authorities",
        key: "id",
      },
    },
    // Level 2 Escalation Authority (e.g. District Education Officer / District Magistrate)
    level2AuthorityId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "government_authorities",
        key: "id",
      },
    },
    // Level 3 Escalation Authority (e.g. State Directorate / Secretary)
    level3AuthorityId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "government_authorities",
        key: "id",
      },
    },
  },
  {
    sequelize,
    modelName: "JurisdictionMapping",
    tableName: "jurisdiction_mappings",
    timestamps: true,
    indexes: [
      {
        fields: ["categoryId", "state", "district", "block"],
        unique: true,
        name: "uq_jurisdiction_mapping",
      },
      { fields: ["primaryAuthorityId"] },
    ],
  }
);

export { JurisdictionMapping };
export default JurisdictionMapping;
