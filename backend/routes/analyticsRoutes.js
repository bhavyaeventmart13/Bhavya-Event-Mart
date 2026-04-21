import express from "express";
import { getLeadAnalytics } from "../controllers/analyticsController.js";
import { protect, adminMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ======================================
// LEAD ANALYTICS DASHBOARD
// ======================================

router.get(
"/lead-dashboard",
protect,
adminMiddleware,
getLeadAnalytics
);

export default router;
