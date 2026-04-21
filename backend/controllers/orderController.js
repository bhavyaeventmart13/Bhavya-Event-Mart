import Order from "../models/Order.js";
import User from "../models/User.js";
import {
  sendOrderPlacedEmail,
  sendAdminNewOrderEmail,
  sendPaymentVerifiedEmail,
  sendOrderStatusEmail,
  sendStaffAssignmentEmail,
} from "../services/emailService.js";

/* ================= CREATE ORDER ================= */
export const createOrder = async (req, res) => {
  try {
    let { shippingAddress, totalAmount, items, email } = req.body;

    // ✅ FIX: email validation
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // ✅ FIX: auth safety (MAIN CRASH FIX)
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    const amountToPay = Number(totalAmount);

    if (!amountToPay || amountToPay <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid total amount",
      });
    }

    let parsedItems = [];
    try {
      parsedItems =
        typeof items === "string" ? JSON.parse(items) : items;
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid items format",
      });
    }

    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No items found",
      });
    }

    const user = await User.findById(req.user._id).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const order = await Order.create({
      user: user._id,
      userInfoSnapshot: {
        name: user.name,
        phone: user.phone,
        email: email,
        address: user.address,
      },
      items: parsedItems,
      totalAmount: amountToPay,
      shippingAddress: shippingAddress || user.address,
      paymentMethod: "QR",
      paymentStatus: "Pending",
      paymentProof: req.paymentProofUrl || "",
      orderStatus: "pending",
    });

    // ===============================
    // EMAILS: CUSTOMER + ADMIN
    // ===============================
    try {
      const userEmail = order.userInfoSnapshot?.email;

      if (userEmail) {
        await sendOrderPlacedEmail(order, userEmail);
      }

      await sendAdminNewOrderEmail(order);

      console.log("📧 Order emails sent (customer + admin)");
    } catch (err) {
      console.error("❌ Order email error:", err.message);
    }

    return res.status(201).json({ success: true, order });
  } catch (err) {
    console.error("❌ FULL ORDER CREATE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ================= GET USER ORDERS ================= */
export const getUserOrders = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    return res.json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= GET ALL ORDERS ================= */
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name phone email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    return res.json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE ORDER STATUS ================= */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "assigned",
      "in_progress",
      "completed",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    try {
      const userEmail = order.userInfoSnapshot?.email;

      if (userEmail) {
        await sendOrderStatusEmail(order, userEmail);
      }
    } catch (err) {
      console.error("❌ Status email error:", err.message);
    }

    return res.json({ success: true, order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= VERIFY PAYMENT ================= */
export const verifyPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.paymentStatus = "Paid";
    order.orderStatus = "assigned";

    await order.save();

    try {
      const userEmail = order.userInfoSnapshot?.email;

      if (userEmail) {
        await sendPaymentVerifiedEmail(order, userEmail);
      }
    } catch (err) {
      console.error("❌ Payment email error:", err.message);
    }

    return res.json({
      success: true,
      message: "Payment verified",
      order,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= ASSIGN ORDER TO STAFF ================= */
export const assignOrderToStaff = async (req, res) => {
  try {
    const { staffId } = req.body;

    const staff = await User.findById(staffId);

    if (!staff || staff.role !== "staff") {
      return res.status(400).json({
        success: false,
        message: "Invalid staff user",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.assignedTo = staffId;
    order.orderStatus = "assigned";

    await order.save();

    await User.findByIdAndUpdate(staffId, {
      $push: {
        assignedOrders: {
          orderId: order._id,
          orderType: "Order",
        },
      },
    });

    try {
      if (staff?.email) {
        await sendStaffAssignmentEmail(order, staff.email);
      }
    } catch (err) {
      console.error("❌ Staff email error:", err.message);
    }

    return res.json({
      success: true,
      message: "Order assigned",
      order,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= ADD WORK IMAGES ================= */
export const addOrderImages = async (req, res) => {
  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        message: "Invalid images data",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.workImages.push(...images);

    await order.save();

    return res.json({
      success: true,
      message: "Images added",
      order,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};