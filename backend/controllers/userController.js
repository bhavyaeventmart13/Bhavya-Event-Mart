import User from "../models/User.js";

/* ======================================================
   🟢 ADMIN: GET ALL NON-ADMIN USERS
====================================================== */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } }) // 🔥 FIXED
      .select("name phone address email role createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    console.error("❌ getAllUsers Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

/* ======================================================
   🟢 ADMIN: UPDATE USER (SAFE)
====================================================== */
export const updateUser = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;

    // 🔥 SAFE UPDATE (no role change allowed)
    const updateData = {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(email && { email }),
      ...(address && { address }),
    };

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: { $ne: "admin" } }, // 🔥 FIXED
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .select("name phone email address role createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("❌ updateUser Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

/* ======================================================
   🔴 ADMIN: DELETE USER (SAFE)
====================================================== */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({
      _id: req.params.id,
      role: { $ne: "admin" }, // 🔥 FIXED
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("❌ deleteUser Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

/* ======================================================
   🟢 USER: GET PROFILE
====================================================== */
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("name phone email address role createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("❌ getUserProfile Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

/* ======================================================
   🔴 USER: DELETE OWN ACCOUNT
====================================================== */
export const deleteMyAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (err) {
    console.error("❌ deleteMyAccount Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};