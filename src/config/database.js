import dotenv from "dotenv";

dotenv.config();
const { DB_NAME, DB_USER, PASSWORD } = process.env;

const configs = {
  development: {
    client: "mysql2",
    connection: {
      database: DB_NAME,
      user: DB_USER,
      password: PASSWORD,
    },
  },
  test: {
    client: "mysql2",
    connection: {
      database: DB_NAME,
      user: DB_USER,
      password: PASSWORD,
    },
  },
  production: {
    client: "mysql2",
    connection: {
      database: DB_NAME,
      user: DB_USER,
      password: PASSWORD,
    },
  },
};

const env = process.env.NODE_ENV || "development";

const config = configs[env];

export default config;
