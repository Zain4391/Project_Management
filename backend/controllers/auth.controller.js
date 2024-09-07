import { db } from "../db/Connect.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateVerificationCode } from "../utils/generateVerificationCode.js";
import { generateTokenSetCookie } from "../utils/generateTokenSetCookie.js";
import {
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
} from "../nodemailer/email_templates.js";
import { transporter } from "../nodemailer/nodemailer.config.js";
import { error } from "console";

export const signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!email || !name || !password) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    //check existing user
    const query_vals = [email];
    const result = await db.query(
      "SELECT * FROM Users WHERE email = $1",
      query_vals
    );
    if (result.rows.length > 0) {
      return res.status(400).json({ message: "Email already in use" });
    }
    const hashedPassword = await bcrypt.hash(password, 10); //hash the password for security

    const userid = Math.floor(Math.random() * 1000000); //generate random id

    const verificationToken = generateVerificationCode();

    //set expiry, convert it to Date object
    const verificationTokenExpiresAT = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    //generate jwt token and set cookie
    generateTokenSetCookie(res, userid);

    const role = "Member"; //default role upon signup (can be modified later by admin)

    // Insert values in the database
    const response = await db.query(
      "INSERT INTO Users (id,name,email,password,role,verificationToken,verificationTokenExpiry) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id",
      [
        userid,
        name,
        email,
        hashedPassword,
        role,
        verificationToken,
        verificationTokenExpiresAT,
      ]
    );

    // Send Mail for verification
    const mailOptions = {
      from: "zainrasoolhashmi@gmail.com",
      to: email,
      subject: "Verify your email",
      html: VERIFICATION_EMAIL_TEMPLATE.replace(
        "{verificationCode}",
        verificationToken
      ),
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    // return successful response from the API along with the ID of the latest created user
    return res
      .status(200)
      .json({ message: "User Added to Database", UserId: response.rows[0].id });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  const { code } = req.body; // extract verification token from request body

  try {
    // attempt to get the user from database
    const result = await db.query(
      "SELECT id,verificationTokenExpiry,name,email FROM Users WHERE verificationToken = $1",
      [code]
    );

    // check for user existence
    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid Verification Code" });
    }

    // check for expired token
    if (Date.now() > result.rows[0].verificationTokenExpiry) {
      return res
        .status(400)
        .json({ message: "token expired, please signup again!" });
    }

    // set user as verified and update the corresponding record
    const verified = true;
    const expiry = null;
    const token = null;

    await db.query(
      "UPDATE Users SET isVerified = $2, verificationToken = $3, verificationTokenExpiry = $4 WHERE id = $1",
      [result.rows[0].id, verified, token, expiry]
    );

    //send welcome email to the user
    const mailOptions = {
      from: "zainrasoolhashmi@gmail.com",
      to: result.rows[0].email,
      subject: "Welcome On-Board!",
      html: WELCOME_EMAIL_TEMPLATE.replace(/{username}/g, result.rows[0].name),
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    return res
      .status(200)
      .json({ message: "User Verified successfully, email sent!" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query("SELECT * FROM Users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }

    generateTokenSetCookie(res, user.id); //generate cookie for the logged in user
    return res.status(200).json({ message: "Logged in successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token");
  return res.status(200).json({ message: "Logged out successfully" });
};
