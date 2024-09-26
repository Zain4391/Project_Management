import express from "express";
import {
  creatProject,
  deleteProjectById,
  getAllProjects,
  getProjectById,
  updateProjectById,
} from "../controllers/project.controller.js";
import { ValidateProjectId } from "../middleware/User.middleware.js";
import taskRouter from "./taskRoutes.js";

const Router = express.Router();

Router.get("/", getAllProjects);
Router.post("/", creatProject);

Router.param("id", ValidateProjectId);

Router.get("/:id", getProjectById);
Router.put("/:id", updateProjectById);
Router.delete("/:id", deleteProjectById);

//Routes related to tasks
Router.use("/:id/tasks", taskRouter);
export default Router;
