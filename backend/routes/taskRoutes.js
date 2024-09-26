import express, { Router } from "express";
import {
  createTask,
  getAllTasksForProject,
  updateTaskById,
  deleteTaskById,
} from "../controllers/task.controller.js";
import { ValidateTaskId } from "../middleware/User.middleware.js";

const taskRouter = express.Router({ mergeParams: true });

taskRouter.get("/", getAllTasksForProject);
taskRouter.post("/", createTask);

taskRouter.param("id", ValidateTaskId);
taskRouter.put("/:taskId", updateTaskById);
taskRouter.delete("/:taskId", deleteTaskById);

export default taskRouter;
