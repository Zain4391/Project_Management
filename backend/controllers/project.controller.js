import { db } from "../db/Connect.js";

//get all projects
export const getAllProjects = async (req, res) => {
  try {
    const projects = await db.query("SELECT * FROM Projects");
    if (projects.rows.length === 0) {
      return res.status(404).json({ message: "No projects found" });
    }
    res.status(200).json({ Projects: projects.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching projects" });
  }
};

export const getProjectById = async (req, res) => {
  res.status(200).json({ Project: req.project });
};

//Create a new Project
export const creatProject = async (req, res) => {
  try {
    const { projectName, description, userId, date } = req.body;
    if (!projectName || !description || !userId) {
      return res
        .status(400)
        .json({ message: "Please enter all fields", error: true });
    }

    const checkUser = await db.query("SELECT * FROM Users WHERE id = $1", [
      userId,
    ]);

    if (checkUser.rows.length === 0) {
      return res.status(404).json({ message: "User does not exist found" });
    }

    if (!date) {
      const id = Math.floor(Math.random() * 1000000);
      const status = "Not Started";
      const result = await db.query(
        "INSERT INTO Projects (id,project_name,description,created_by,status) VALUES ($1,$2,$3,$4,$5) RETURNING id",
        [id, projectName, description, userId, status]
      );

      res.status(200).json({
        message: "Project created successfully",
        ProjectId: result.rows[0].id,
      });
    }

    const id = Math.floor(Math.random() * 1000000);
    const status = "Not Started";
    const result = await db.query(
      "INSERT INTO Projects (id,project_name,description,created_by,created_at,status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
      [id, projectName, description, userId, date, status]
    );

    return res.status(200).json({
      message: "Project created successfully",
      ProjectId: result.rows[0].id,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error processing request", error: true });
  }
};

export const updateProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const { projectName, description, status } = req.body;

    const existingProject = await db.query(
      "SELECT * FROM Projects WHERE id = $1",
      [id]
    );

    if (existingProject.rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    const updatedProject = await db.query(
      "UPDATE Projects SET project_name = $1, description = $2, status = $3 WHERE id = $4 RETURNING *",
      [
        projectName || existingProject.rows[0].project_name,
        description || existingProject.rows[0].description,
        status || existingProject.rows[0].status,
        id,
      ]
    );

    res.status(200).json({
      message: "Project updated successfully",
      Project: updatedProject.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating project", error: true });
  }
};

export const deleteProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProject = await db.query(
      "SELECT * FROM Projects WHERE id = $1",
      [id]
    );

    if (existingProject.rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    await db.query("DELETE FROM Projects WHERE id = $1", [id]);

    res.status(200).json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting project", error: true });
  }
};
