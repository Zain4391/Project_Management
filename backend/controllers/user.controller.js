import { db } from "../db/Connect.js";

// CRUD on Users performed by Admin only

export const getAll = async (req, res) => {
  try {
    const users = await db.query("SELECT * FROM Users");
    if (users.rows.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    res.status(200).json({ Users: users.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

export const getOneById = async (req, res) => {
  res.status(200).json({ User: req.user });
};

// TODO add signup functionality here as well, admin sends emails to the users with credentials and verification as well.
export const postUser = async (req, res) => {};
