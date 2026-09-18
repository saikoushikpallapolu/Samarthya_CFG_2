import dotenv from "dotenv";
dotenv.config();

import { sequelize, syncDatabase } from "../models/index.js";

const runSync = async () => {
  try {
    console.log("--------------------------------------------------");
    console.log("🐘 Testing connection to PostgreSQL database...");
    console.log("--------------------------------------------------");
    await sequelize.authenticate();
    console.log("✅ Successfully connected to PostgreSQL!");

    // If clean sync is requested or first time setup, clean public schema for pristine creation
    const isClean = process.argv.includes("--clean") || process.argv.includes("--force");
    if (isClean) {
      console.log("\n🧹 Resetting public schema for a clean synchronization...");
      await sequelize.query("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;");
      console.log("✨ Public schema reset successfully.");
    }

    console.log("\n📦 Creating and synchronizing tables...");
    await syncDatabase({ alter: !isClean, force: isClean });

    // Query tables in current schema to display what was created
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log("\n📋 Tables verified in your PostgreSQL database:");
    results.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.table_name}`);
    });

    console.log("\n🎉 Database setup & synchronization complete! You are ready to build!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Database synchronization failed:");
    console.error(error.message);
    if (error.original) {
      console.error("Details:", error.original.message);
    }
    process.exit(1);
  }
};

runSync();
