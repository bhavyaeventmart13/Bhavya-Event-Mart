import Lead from "../models/Lead.js";

// ======================================
// LEAD ANALYTICS DASHBOARD
// ======================================

export const getLeadAnalytics = async (req, res) => {
  try {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ===============================
    // BASIC LEAD METRICS
    // ===============================

    const totalLeads = await Lead.countDocuments();

    const todayLeads = await Lead.countDocuments({
      createdAt: { $gte: today },
    });

    const highPriorityLeads = await Lead.countDocuments({
      priority: "high",
    });

    const assignedLeads = await Lead.countDocuments({
      status: "assigned",
    });

    const closedLeads = await Lead.countDocuments({
      status: "closed",
    });

    // ===============================
    // INTENT ANALYTICS
    // ===============================

    const intentStats = await Lead.aggregate([
      {
        $group: {
          _id: "$intent",
          count: { $sum: 1 },
        },
      },
    ]);

    // ===============================
    // PLATFORM SOURCE ANALYTICS
    // ===============================

    const platformStats = await Lead.aggregate([
      {
        $group: {
          _id: "$platform",
          count: { $sum: 1 },
        },
      },
    ]);

    // ===============================
    // RESPONSE
    // ===============================

    return res.json({
      success: true,
      analytics: {
        totalLeads,
        todayLeads,
        highPriorityLeads,
        assignedLeads,
        closedLeads,
        intentStats,
        platformStats,
      },
    });

  } catch (error) {

    console.error("❌ Analytics Error:", error);

    return res.status(500).json({
      success: false,
      message: "Analytics fetch failed",
    });

  }
};