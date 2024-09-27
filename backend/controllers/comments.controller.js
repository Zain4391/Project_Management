import { db } from "../db/Connect.js";

// Create a new comment for a task
export const createComment = async (req, res) => {
  try {
    const { content, user_id } = req.body;
    const { taskId } = req.params;

    if (!content || !user_id) {
      return res
        .status(400)
        .json({ message: "Content and user_id are required" });
    }

    // Insert the new comment into the database
    const result = await db.query(
      `INSERT INTO Comments (content, user_id, task_id) 
       VALUES ($1, $2, $3) RETURNING id, content, created_at`,
      [content, user_id, taskId]
    );

    res.status(201).json({
      message: "Comment created successfully",
      comment: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating comment", error: true });
  }
};

// Get all comments for a specific task
export const getAllCommentsForTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Query all comments associated with the taskId
    const result = await db.query(
      `SELECT Comments.id, Comments.content, Comments.created_at, Users.username 
       FROM Comments
       JOIN Users ON Comments.user_id = Users.id
       WHERE Comments.task_id = $1`,
      [taskId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No comments found for this task" });
    }

    res.status(200).json({ comments: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching comments", error: true });
  }
};

// Update a specific comment by its ID
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    // Check if the comment exists
    const checkComment = await db.query(
      "SELECT * FROM Comments WHERE id = $1",
      [commentId]
    );
    if (checkComment.rows.length === 0) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Update the comment with the new content
    const result = await db.query(
      `UPDATE Comments 
       SET content = $1 
       WHERE id = $2 RETURNING id, content, created_at`,
      [content || checkComment.rows[0].content, commentId]
    );

    res.status(200).json({
      message: "Comment updated successfully",
      comment: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating comment", error: true });
  }
};

// Delete a specific comment by its ID
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    // Check if the comment exists
    const checkComment = await db.query(
      "SELECT * FROM Comments WHERE id = $1",
      [commentId]
    );
    if (checkComment.rows.length === 0) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Delete the comment
    await db.query("DELETE FROM Comments WHERE id = $1", [commentId]);

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting comment", error: true });
  }
};
