import pg from "pg";
import dotenv from "dotenv";

dotenv.config();
const password = process.env.DB_PASSWORD;
const PORT = process.env.DB_PORT;

export const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "project_manager",
  password: password,
  port: PORT,
});
