import sequelize from "../db/postgres.js";
import { User } from "./user.model.js";
import { School } from "./school.model.js";
import { SmcMember } from "./smcMember.model.js";
import { Department } from "./department.model.js";
import { GovernmentAuthority } from "./governmentAuthority.model.js";
import { GrievanceCategory } from "./grievanceCategory.model.js";
import { JurisdictionMapping } from "./jurisdictionMapping.model.js";
import { GrievanceTemplate } from "./grievanceTemplate.model.js";
import { Grievance } from "./grievance.model.js";
import { GrievanceAttachment } from "./grievanceAttachment.model.js";
import { GrievanceTimelineEvent } from "./grievanceTimelineEvent.model.js";
import { GrievanceReminder } from "./grievanceReminder.model.js";
import { GrievanceUpvote } from "./grievanceUpvote.model.js";
import { SocialMediaCampaign } from "./socialMediaCampaign.model.js";

// =================================================================
// RELATIONAL ASSOCIATIONS SETUP
// =================================================================

// 1. User <-> School (Many-to-Many through SmcMember)
User.hasMany(SmcMember, { foreignKey: "userId", as: "smcMemberships" });
SmcMember.belongsTo(User, { foreignKey: "userId", as: "user" });

School.hasMany(SmcMember, { foreignKey: "schoolId", as: "smcMembers" });
SmcMember.belongsTo(School, { foreignKey: "schoolId", as: "school" });

User.belongsToMany(School, {
  through: SmcMember,
  foreignKey: "userId",
  otherKey: "schoolId",
  as: "associatedSchools",
});
School.belongsToMany(User, {
  through: SmcMember,
  foreignKey: "schoolId",
  otherKey: "userId",
  as: "members",
});

// 2. Department <-> GovernmentAuthority
Department.hasMany(GovernmentAuthority, {
  foreignKey: "departmentId",
  as: "authorities",
});
GovernmentAuthority.belongsTo(Department, {
  foreignKey: "departmentId",
  as: "department",
});

// 3. Department <-> GrievanceCategory
Department.hasMany(GrievanceCategory, {
  foreignKey: "departmentId",
  as: "categories",
});
GrievanceCategory.belongsTo(Department, {
  foreignKey: "departmentId",
  as: "department",
});

// 4. GrievanceCategory <-> GrievanceTemplate
GrievanceCategory.hasMany(GrievanceTemplate, {
  foreignKey: "categoryId",
  as: "templates",
});
GrievanceTemplate.belongsTo(GrievanceCategory, {
  foreignKey: "categoryId",
  as: "category",
});

// 5. GrievanceCategory <-> JurisdictionMapping
GrievanceCategory.hasMany(JurisdictionMapping, {
  foreignKey: "categoryId",
  as: "jurisdictionMappings",
});
JurisdictionMapping.belongsTo(GrievanceCategory, {
  foreignKey: "categoryId",
  as: "category",
});

// 6. JurisdictionMapping <-> GovernmentAuthorities
JurisdictionMapping.belongsTo(GovernmentAuthority, {
  foreignKey: "primaryAuthorityId",
  as: "primaryAuthority",
});
JurisdictionMapping.belongsTo(GovernmentAuthority, {
  foreignKey: "level2AuthorityId",
  as: "level2Authority",
});
JurisdictionMapping.belongsTo(GovernmentAuthority, {
  foreignKey: "level3AuthorityId",
  as: "level3Authority",
});

// 7. Grievance Relationships
School.hasMany(Grievance, { foreignKey: "schoolId", as: "grievances" });
Grievance.belongsTo(School, { foreignKey: "schoolId", as: "school" });

GrievanceCategory.hasMany(Grievance, { foreignKey: "categoryId", as: "grievances" });
Grievance.belongsTo(GrievanceCategory, { foreignKey: "categoryId", as: "category" });

GrievanceTemplate.hasMany(Grievance, { foreignKey: "templateId", as: "template" });
Grievance.belongsTo(GrievanceTemplate, { foreignKey: "templateId", as: "template" });

User.hasMany(Grievance, { foreignKey: "createdByUserId", as: "filedGrievances" });
Grievance.belongsTo(User, { foreignKey: "createdByUserId", as: "creator" });

GovernmentAuthority.hasMany(Grievance, {
  foreignKey: "assignedAuthorityId",
  as: "assignedGrievances",
});
Grievance.belongsTo(GovernmentAuthority, {
  foreignKey: "assignedAuthorityId",
  as: "assignedAuthority",
});

// 8. Grievance <-> Attachments
Grievance.hasMany(GrievanceAttachment, {
  foreignKey: "grievanceId",
  as: "attachments",
  onDelete: "CASCADE",
});
GrievanceAttachment.belongsTo(Grievance, { foreignKey: "grievanceId", as: "grievance" });
GrievanceAttachment.belongsTo(User, { foreignKey: "uploadedByUserId", as: "uploader" });

// 9. Grievance <-> Timeline Audit Events
Grievance.hasMany(GrievanceTimelineEvent, {
  foreignKey: "grievanceId",
  as: "timeline",
  onDelete: "CASCADE",
});
GrievanceTimelineEvent.belongsTo(Grievance, {
  foreignKey: "grievanceId",
  as: "grievance",
});
GrievanceTimelineEvent.belongsTo(User, {
  foreignKey: "performedByUserId",
  as: "performedBy",
});

// 10. Grievance <-> Automated Reminders
Grievance.hasMany(GrievanceReminder, {
  foreignKey: "grievanceId",
  as: "reminders",
  onDelete: "CASCADE",
});
GrievanceReminder.belongsTo(Grievance, { foreignKey: "grievanceId", as: "grievance" });

// 11. Grievance <-> Citizen Upvotes
Grievance.hasMany(GrievanceUpvote, {
  foreignKey: "grievanceId",
  as: "upvotes",
  onDelete: "CASCADE",
});
GrievanceUpvote.belongsTo(Grievance, { foreignKey: "grievanceId", as: "grievance" });
GrievanceUpvote.belongsTo(User, { foreignKey: "userId", as: "voter" });

// 12. Grievance <-> Social Media Campaigns
Grievance.hasMany(SocialMediaCampaign, {
  foreignKey: "grievanceId",
  as: "socialCampaigns",
  onDelete: "CASCADE",
});
SocialMediaCampaign.belongsTo(Grievance, {
  foreignKey: "grievanceId",
  as: "grievance",
});
SocialMediaCampaign.belongsTo(User, {
  foreignKey: "createdByUserId",
  as: "campaignCreator",
});

// =================================================================
// AUTOMATIC DATABASE SCHEMA SYNCHRONIZATION HELPER
// =================================================================
/**
 * Automatically creates all tables in PostgreSQL based on model definitions.
 * Use alter: true in development to automatically update tables when columns change.
 */
export const syncDatabase = async (options = { alter: true }) => {
  try {
    console.log("⏳ Synchronizing PostgreSQL database schemas...");
    await sequelize.sync(options);
    console.log("✅ All PostgreSQL tables and relationships synchronized successfully!");
  } catch (error) {
    console.error("❌ Failed to synchronize PostgreSQL database schemas: ", error);
    throw error;
  }
};

export {
  sequelize,
  User,
  School,
  SmcMember,
  Department,
  GovernmentAuthority,
  GrievanceCategory,
  JurisdictionMapping,
  GrievanceTemplate,
  Grievance,
  GrievanceAttachment,
  GrievanceTimelineEvent,
  GrievanceReminder,
  GrievanceUpvote,
  SocialMediaCampaign,
};

export default {
  sequelize,
  syncDatabase,
  User,
  School,
  SmcMember,
  Department,
  GovernmentAuthority,
  GrievanceCategory,
  JurisdictionMapping,
  GrievanceTemplate,
  Grievance,
  GrievanceAttachment,
  GrievanceTimelineEvent,
  GrievanceReminder,
  GrievanceUpvote,
  SocialMediaCampaign,
};
