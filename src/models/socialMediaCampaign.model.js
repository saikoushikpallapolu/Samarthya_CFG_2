import { DataTypes, Model } from "sequelize";
import sequelize from "../db/postgres.js";

class SocialMediaCampaign extends Model {
  static findById(id) {
    return this.findByPk(id);
  }
}

SocialMediaCampaign.init(
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
    createdByUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    platform: {
      type: DataTypes.ENUM("TWITTER_X", "FACEBOOK", "WHATSAPP_SHARE"),
      allowNull: false,
    },
    postText: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    taggedHandles: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [], // e.g. ['@EduMinOfIndia', '@DirectorateEdu', '@DchryGov']
    },
    shareUrl: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    clicksCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "SocialMediaCampaign",
    tableName: "social_media_campaigns",
    timestamps: true,
    indexes: [
      { fields: ["grievanceId"], name: "idx_social_grievance" },
      { fields: ["platform"], name: "idx_social_platform" },
    ],
  }
);

export { SocialMediaCampaign };
export default SocialMediaCampaign;
