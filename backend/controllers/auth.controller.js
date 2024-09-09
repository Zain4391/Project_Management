import { db } from "../db/Connect.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateVerificationCode } from "../utils/generateVerificationCode.js";
import { generateTokenSetCookie } from "../utils/generateTokenSetCookie.js";
import {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
} from "../nodemailer/email_templates.js";
import { transporter } from "../nodemailer/nodemailer.config.js";
import dotenv from "dotenv";

dotenv.config();

export const signup = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    if (!email || !name || !password || !role) {
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

    const Userrole = role;

    // Insert values in the database
    const response = await db.query(
      "INSERT INTO Users (id,name,email,password,role,verificationToken,verificationTokenExpiry) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id",
      [
        userid,
        name,
        email,
        hashedPassword,
        Userrole,
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
  if (!email || !password) {
    return res.status(400).json({ message: "Email and Password are required" });
  }
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

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }
  try {
    const result = await db.query("SELECT * FROM Users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    //generate rpt
    const rpt = crypto.randomBytes(20).toString("hex");
    const expiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hr expiry

    //save data to Database
    await db.query(
      "UPDATE Users SET resetPasswordToken = $2, resetPasswordTokenExpiry = $3 WHERE id = $1",
      [result.rows[0].id, rpt, expiry]
    );

    // Send Mail for password reset
    const mailOptions = {
      from: "zainrasoolhashmi@gmail.com",
      to: result.rows[0].email,
      subject: "Reset Your Password",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace(
        "{resetURL}",
        `${process.env.APP_URL}/reset-password/${rpt}`
      ),
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
      .json({ message: "Reset Password Email sent to your email" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error, please try again later" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Please provide token and password" });
    }

    const result = await db.query(
      "SELECT * FROM Users WHERE resetPasswordToken = $1",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid token" });
    }

    if (Date.now() > result.rows[0].resetPasswordTokenExpiry) {
      return res.status(400).json({ message: "Token has expired" });
    }

    const hashedPassword = await bcrypt.hash(password, 10); //update users password
    const resetToken = null;
    const resetexpiry = null;

    //update the Users table
    await db.query(
      "UPDATE Users SET resetPasswordToken = $2, resetPasswordTokenExpiry = $3, password = $4 WHERE id = $1",
      [result.rows[0].id, resetToken, resetexpiry, hashedPassword]
    );

    const mailOptions = {
      from: "zainrasoolhashmi@gmail.com",
      to: result.rows[0].email,
      subject: "Password reset successful",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};
