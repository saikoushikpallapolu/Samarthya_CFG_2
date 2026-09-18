import { DataTypes, Model } from "sequelize";
import sequelize from "../db/postgres.js";

class Department extends Model {
  static findById(id) {
    return this.findByPk(id);
  }
}

Department.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    departmentName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    departmentCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true, // e.g. 'DOE', 'PWD', 'DJB', 'MCD', 'PHED', 'DISCOM'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Department",
    tableName: "departments",
    timestamps: true,
    indexes: [{ fields: ["departmentCode"], unique: true, name: "idx_dept_code" }],
  }
);

export { Department };
export default Department;
