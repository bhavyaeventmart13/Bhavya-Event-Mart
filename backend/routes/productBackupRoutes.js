import express from "express";
import { backupProducts } from "../controllers/productBackupController.js";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ==============================
// 📦 PRODUCT BACKUP ROUTE
// ==============================
router.get(
  "/products/backup",
  authMiddleware,     // 🔒 JWT required
  adminMiddleware,       // 🛡 admin only
  backupProducts
);

export default router;