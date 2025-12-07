import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

const User = sequelize.define("user", {
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  subscription: {
    type: DataTypes.ENUM,
    values: ["starter", "pro", "business"],
    defaultValue: "starter",
  },
  avatarURL: {
    type: DataTypes.STRING,
  },
  token: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
});

export default User;
