import express from "express";
import {
  getAll,
  getOneById,
  patchUser,
  postUser,
} from "../controllers/user.controller.js";
import { ValidateId } from "../middleware/User.middleware.js";

//will be Admin only TODO: Implement Verification middleware passed into router.<HTTP Method> Function

const router = express.Router();

router.get("/", getAll); //get all users

router.param("id", ValidateId);
router.get("/:id", getOneById);
router.post("/", postUser);
router.put("/:id", patchUser);
export default router;
