import { db } from "../db/Connect.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { generateVerificationCode } from "../utils/generateVerificationCode.js";
import { generateTokenSetCookie } from "../utils/generateTokenSetCookie.js";
import { VERIFICATION_EMAIL_TEMPLATE } from "../nodemailer/email_templates.js";
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

    const role = "Member"; //default role upon signup (can be modded later by admin)

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
    return res
      .status(200)
      .json({ message: "User Added to Database", UserId: response.rows[0].id });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
