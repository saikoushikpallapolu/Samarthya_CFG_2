import { Sequelize } from "sequelize";

let sequelize;

if (process.env.DATABASE_URL) {
  // Support cloud-hosted PostgreSQL instances (Neon, Supabase, Render, Railway, RDS)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    dialectOptions: process.env.DATABASE_URL.includes("localhost")
      ? {}
      : {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else {
  // Local PostgreSQL instance defaults
  sequelize = new Sequelize(
    process.env.PG_DATABASE || "samarthya_core_db",
    process.env.PG_USER || "postgres",
    process.env.PG_PASSWORD || "postgres",
    {
      host: process.env.PG_HOST || "localhost",
      port: Number(process.env.PG_PORT) || 5432,
      dialect: "postgres",
      logging: process.env.NODE_ENV === "development" ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
}

const connectPostgres = async () => {
  try {
    await sequelize.authenticate();
    console.log(`\n🐘 PostgreSQL connected successfully! DB: ${sequelize.config.database}`);
  } catch (error) {
    console.error("❌ PostgreSQL connection FAILED: ", error);
  }
};

export { sequelize, connectPostgres };
export default sequelize;
