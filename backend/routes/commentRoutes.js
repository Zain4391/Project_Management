import express from "express";
import {
  createComment,
  getAllCommentsForTask,
  updateComment,
  deleteComment,
} from "../controllers/comments.controller.js";

const router = express.Router({ mergeParams: true }); // Allows taskId from taskRouter to be passed

// Create a new comment for a task
router.post("/", createComment);

// Get all comments for a task
router.get("/", getAllCommentsForTask);

// Update a comment
router.put("/:commentId", updateComment);

// Delete a comment
router.delete("/:commentId", deleteComment);

export default router;
