import express from "express";
const router = express.Router();

// Controllers
import {
  createTask,
  getAllTasks,
  deleteTask,
  getMyTasks,
  updateTaskStatus,
  updateTask,
  addTaskImages,
} from "../controllers/taskController.js";

// Middlewares
import { protect, adminMiddleware } from "../middlewares/authMiddleware.js";

/* ── ADMIN ROUTES ───────────────────────── */

// Create Task
router.post("/", protect, adminMiddleware, createTask);

// Get All Tasks
router.get("/all", protect, adminMiddleware, getAllTasks);

// Update Task
router.put("/:id", protect, adminMiddleware, updateTask);

// Delete Task
router.delete("/:id", protect, adminMiddleware, deleteTask);

/* ── STAFF ROUTES ───────────────────────── */

// Get My Tasks
router.get("/my", protect, getMyTasks);

// Update Task Status
router.patch("/:id/status", protect, updateTaskStatus);

// Add Work Images
router.post("/:id/images", protect, addTaskImages);

export default router;