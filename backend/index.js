import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan";
import errorHandler from "errorhandler";
import dotenv from "dotenv";
import { db } from "./db/Connect.js";
import { Create_Tables } from "./models/project_manager.model.js";
import authRoute from "./routes/authRoutes.js";
import userRoute from "./routes/userRoutes.js";
import projectRoute from "./routes/projectRoutes.js";
dotenv.config(); //use .env variables
const app = express();

//middlewares for the app
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(cors());
app.use(errorHandler());

//env variables
const PORT = process.env.PORT || 4000;
const url = process.env.APP_URL;

if (!url) {
  console.error("APP_URL is not defined in the environment variables.");
  process.exit(1); // Exit the process if the URL is not defined
}

//use all authentication & API routes routes
app.use("/api/auth", authRoute);
app.use("/project", projectRoute);
app.use("/user", userRoute);

//app.use("/project/task",taskRoute);

app.listen(PORT, () => {
  db.connect((err) => {
    if (err) {
      console.error(err);
    }
    console.log("Connected to project_manager");
  });
  console.log(`Server live at: ${url}`);
  Create_Tables();
});

process.on("SIGINT", () => {
  db.end((err) => {
    if (err) {
      console.error("Error during disconnection", err.stack);
    } else {
      console.log("Disconnected from the database");
    }
    process.exit(0);
  });
});
