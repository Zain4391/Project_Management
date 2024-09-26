import { db } from "../db/Connect.js";

export const ValidateId = async (req, res, next, id) => {
  try {
    const user = await db.query("SELECT * FROM Users WHERE id = $1", [id]);
    if (user.rows.length == 0) {
      return res.status(404).json({ message: "User not found" });
    }
    req.user = user.rows[0];
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

export const ValidateProjectId = async (req, res, next, id) => {
  try {
    const result = await db.query("SELECT * FROM Projects WHERE id = $1", [id]);
    if (result.rows.length == 0) {
      return res.status(404).json({ message: "Project not found" });
    }
    req.project = result.rows[0];
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching projects" });
  }
};

export const ValidateTaskId = async (req, res, next, id) => {
  try {
    const result = await db.query("SELECT * FROM Tasks WHERE id = $1", [id]);
    if (result.rows.length == 0) {
      return res.status(404).json({ message: "Task not found" });
    }
    req.task = result.rows[0];
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching tasks" });
  }
};
