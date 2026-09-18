import dotenv from "dotenv";
import { connectPostgres } from "./db/postgres.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

const startServer = async () => {
  // Connect to PostgreSQL database
  try {
    await connectPostgres();
  } catch (error) {
    console.warn("⚠️ Warning: PostgreSQL connection pending. Server starting...");
  }

  const port = process.env.PORT || 8000;
  app.listen(port, () => {
    console.log(`⚙️ Server is running at port : ${port}`);
  });
};

startServer();
