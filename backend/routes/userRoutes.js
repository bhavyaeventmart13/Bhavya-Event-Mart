import express from "express";
import {
  protect,
  adminMiddleware,
} from "../middlewares/authMiddleware.js";

import {
  getAllUsers,
  getUserProfile,
  deleteMyAccount,
} from "../controllers/userController.js";

const router = express.Router();

/* ======================================================
   🟢 USER: GET PROFILE
====================================================== */
router.get("/profile", protect, getUserProfile);

/* ======================================================
   🔴 USER: DELETE OWN ACCOUNT
====================================================== */
router.delete("/me", protect, deleteMyAccount);

/* ======================================================
   🟡 ADMIN: GET ALL USERS
====================================================== */
router.get("/all", protect, adminMiddleware, getAllUsers);

export default router;