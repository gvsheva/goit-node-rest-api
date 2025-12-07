import { Sequelize } from "sequelize";

const {
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_HOST = "localhost",
  DB_PORT = 5432,
  DB_SSL_REQUIRE = "false",
} = process.env;

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: DB_SSL_REQUIRE === "true",
    },
  },
  logging: false,
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
