import { Sequelize } from "sequelize";

const {
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_HOST = "localhost",
  DB_PORT = 5432,
  DB_SSL = "false",
} = process.env;

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  logging: false,
  dialect: "postgres",
  dialectOptions:
    DB_SSL === "true"
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
});

export const initDb = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("Database connection successful");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};
