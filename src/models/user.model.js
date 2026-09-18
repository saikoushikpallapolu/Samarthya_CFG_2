import { DataTypes, Model } from "sequelize";
import sequelize from "../db/postgres.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

class User extends Model {
  // Method to check password validity
  async isPasswordCorrect(password) {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
  }

  // Method to generate JWT Access Token
  generateAccessToken() {
    return jwt.sign(
      {
        id: this.id,
        _id: this.id, // For backward compatibility with mongo-based code
        phoneNumber: this.phoneNumber,
        email: this.email,
        role: this.role,
        fullName: this.fullName,
      },
      process.env.ACCESS_TOKEN_SECRET || "samarthya-access-token-secret-key-2026",
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d",
      }
    );
  }

  // Method to generate JWT Refresh Token
  generateRefreshToken() {
    return jwt.sign(
      {
        id: this.id,
        _id: this.id,
      },
      process.env.REFRESH_TOKEN_SECRET || "samarthya-refresh-token-secret-key-2026",
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d",
      }
    );
  }

  // Compatibility helper for Mongoose-style findById
  static findById(id) {
    return this.findByPk(id);
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    phoneNumber: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    fullName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true, // Optional: SMC members log in with Phone + OTP
    },
    role: {
      type: DataTypes.ENUM(
        "SMC_MEMBER",
        "SAMARTHYA_ADMIN",
        "SAMARTHYA_COORDINATOR",
        "GOVERNMENT_OFFICER",
        "CITIZEN"
      ),
      allowNull: false,
      defaultValue: "SMC_MEMBER",
    },
    // User interface and translation preference (Hindi, Punjabi, English)
    preferredLanguage: {
      type: DataTypes.ENUM("hi", "pa", "en"),
      allowNull: false,
      defaultValue: "hi",
    },
    isPhoneVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    indexes: [
      { fields: ["phoneNumber"], unique: true, name: "idx_users_phone" },
      { fields: ["role"], name: "idx_users_role" },
      { fields: ["email"], name: "idx_users_email" },
    ],
    hooks: {
      beforeSave: async (user) => {
        if (user.changed("password") && user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
    },
  }
);

export { User };
export default User;
