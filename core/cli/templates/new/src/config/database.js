const configs = {
  development: {
    database: "pat_test",
    user: "root",
    password: "Tobiloba",
  },
  test: {
    database: "pat_test",
    user: "root",
    password: "Tobiloba",
  },
  production: {
    database: "pat_test",
    user: "root",
    password: "Tobiloba",
  },
};

const env = process.env.NODE_ENV || "development";

const config = configs[env];

export default config;
