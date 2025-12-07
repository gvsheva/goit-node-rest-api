import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";
import User from "./user.js";

const Contact = sequelize.define("contact", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  favorite: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  owner: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: "id",
    },
  },
});

Contact.belongsTo(User, { foreignKey: "owner" });
User.hasMany(Contact, { foreignKey: "owner" });

export default Contact;
