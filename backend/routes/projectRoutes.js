import express from "express";
import {
  getAllProjects,
  getProjectById,
} from "../controllers/project.controller";

const Router = express.Router();

Router.get("/", getAllProjects);
Router.get("/:id", getProjectById);

export default Router;
