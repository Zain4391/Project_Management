import { db } from "../db/Connect.js";
import bcrypt from "bcryptjs";
import { generateVerificationCode } from "../utils/generateVerificationCode.js";
import { generateTokenSetCookie } from "../utils/generateTokenSetCookie.js";
import { transporter } from "../nodemailer/nodemailer.config.js";
import { ADMIN_USER_CREDNTAILS_EMAIL } from "../nodemailer/email_templates.js";
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
export const postUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || !role) {
      res.status(400).json({ message: "Please fill in all required fields" });
    }

    const result = await db.query("SELECT * FROM User WHERE email = $1", [
      email,
    ]);

    if (result.rows.length > 0) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userid = Math.floor(Math.random() * 1000000); //generate random id

    const verificationToken = generateVerificationCode();

    //set expiry, convert it to Date object
    const verificationTokenExpiresAT = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    //generate jwt token and set cookie
    generateTokenSetCookie(res, userid);

    const Userrole = role;

    const response = await db.query(
      "INSERT INTO Users (id,name,email,password,role,verificationToken,verificationTokenExpiry) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id",
      [
        userid,
        username,
        email,
        hashedPassword,
        Userrole,
        verificationToken,
        verificationTokenExpiresAT,
      ]
    );

    const mailOptions = {
      from: "zainrasoolhashmi@gmail.com",
      to: email,
      subject: "Verify your email",
      html: ADMIN_USER_CREDNTAILS_EMAIL.replace(
        "{verificationCode}",
        verificationToken
      )
        .replace("{email}", email)
        .replace("{password}", password)
        .replace("{name}", username),
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    res
      .status(201)
      .json({ message: "User created", UserId: response.rows[0].id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error accessing Database" });
  }
};

//update email & password
export const patchUser = async (req, res) => {
  const { id } = req.params;
  const { email, password } = req.body;
  try {
    const user = await db.query("SELECT * FROM Users WHERE id = $1", [id]);
    if (!user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = generateVerificationCode();
    const verificationTokenExpiresAT = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );
    generateTokenSetCookie(res, id);

    const response = await db.query(
      "UPDATE Users SET email = $2, password = $3, verificationToken = $4, verificationTokenExpiry = $5 WHERE id = $1",
      [id, email, hashedPassword, verificationToken, verificationTokenExpiresAT]
    );

    const mailOptions = {
      from: "zainrasoolhashmi@gmail.com",
      to: email,
      subject: "Verify your email",
      html: ADMIN_USER_CREDNTAILS_EMAIL.replace(
        "{verificationCode}",
        verificationToken
      )
        .replace("{email}", email)
        .replace("{password}", password)
        .replace("{name}", username),
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    res
      .status(200)
      .json({ message: "User credentials updated", User: response.rows[0] });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error accessing Database" });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM Users WHERE id = $1", [id]);
    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error accessing Database" });
  }
};
