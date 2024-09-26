import db from "../db/Connect.js";

export const createTask = async (req, res) => {
  try {
    const { task_title, description, assigned_to, due_date, status } = req.body;
    const projectId = req.params.id;

    if (!task_title || !status) {
      return res
        .status(400)
        .json({ message: "Please provide task title and status" });
    }

    const result = await db.query(
      `INSERT INTO Tasks (task_title, description, assigned_to, project_id, due_date, status) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [task_title, description, assigned_to, projectId, due_date, status]
    );

    res.status(201).json({
      message: "Task created successfully",
      taskId: result.rows[0].id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating task", error: true });
  }
};

export const getAllTasksForProject = async (req, res) => {
  try {
    const projectId = req.params.id;

    const result = await db.query("SELECT * FROM Tasks WHERE project_id = $1", [
      projectId,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No tasks found for this project" });
    }

    res.status(200).json({ tasks: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching tasks", error: true });
  }
};

export const updateTaskById = async (req, res) => {
  try {
    const { task_title, description, assigned_to, due_date, status } = req.body;
    const taskId = req.params.taskId;

    // Validate that the task exists before updating
    const checkTask = await db.query("SELECT * FROM Tasks WHERE id = $1", [
      taskId,
    ]);
    if (checkTask.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Update the task in the database with the fields provided
    const result = await db.query(
      `UPDATE Tasks 
       SET task_title = $1, description = $2, assigned_to = $3, due_date = $4, status = $5 
       WHERE id = $6 RETURNING id`,
      [
        task_title || checkTask.rows[0].task_title,
        description || checkTask.rows[0].description,
        assigned_to || checkTask.rows[0].assigned_to,
        due_date || checkTask.rows[0].due_date,
        status || checkTask.rows[0].status,
        taskId || checkTask.rows[0].taskId,
      ]
    );

    // Return success response with the updated task ID
    res.status(200).json({
      message: "Task updated successfully",
      taskId: result.rows[0].id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating task", error: true });
  }
};

// Delete a specific task by ID
export const deleteTaskById = async (req, res) => {
  try {
    const taskId = req.params.taskId;

    // Validate that the task exists before deleting
    const checkTask = await db.query("SELECT * FROM Tasks WHERE id = $1", [
      taskId,
    ]);
    if (checkTask.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Delete the task from the database
    await db.query("DELETE FROM Tasks WHERE id = $1", [taskId]);

    res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting task", error: true });
  }
};
