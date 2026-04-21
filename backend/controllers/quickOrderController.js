import QuickOrder from "../models/quickOrderModel.js";
import User from "../models/User.js";

/* ================= CALCULATION HELPER ================= */
const processItems = (items) => {
  let totalAmount = 0;

  const processedItems = items.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    const discountPercent = Number(item.discountPercent) || 0;
    const gstPercent = Number(item.gstPercent) || 0;

    const base = quantity * price;
    const discount = (base * discountPercent) / 100;
    const afterDiscount = base - discount;
    const gst = (afterDiscount * gstPercent) / 100;
    const finalAmount = afterDiscount + gst;

    totalAmount += finalAmount;

    return {
      productName: item.productName,
      quantity,
      price,
      discountPercent,
      gstPercent,
      finalAmount,
    };
  });

  return { processedItems, totalAmount };
};

/* ================= VALIDATION ================= */
const validateItems = (items) => {
  if (!items || !Array.isArray(items) || items.length === 0) return false;

  return items.every(
    (item) =>
      item.productName &&
      Number(item.quantity) > 0 &&
      Number(item.price) > 0
  );
};

/* ================= CREATE QUICK ORDER ================= */
export const createQuickOrder = async (req, res) => {
  try {
    if (!["staff", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only staff/admin can create quick orders",
      });
    }

    const { customerName, phone, address, gstNumber, items } = req.body;

    if (!customerName || !phone) {
      return res.status(400).json({
        success: false,
        message: "Customer name and phone are required",
      });
    }

    if (!validateItems(items)) {
      return res.status(400).json({
        success: false,
        message: "Invalid items data",
      });
    }

    const { processedItems, totalAmount } = processItems(items);

    const order = await QuickOrder.create({
      customerName,
      phone,
      address,
      gstNumber,
      items: processedItems,
      totalAmount,
      createdBy: req.user._id,
      workImages: [],
    });

    res.status(201).json({
      success: true,
      message: "Quick Order created",
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET ALL QUICK ORDERS ================= */
export const getQuickOrders = async (req, res) => {
  try {
    const orders = await QuickOrder.find()
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= UPDATE QUICK ORDER ================= */
export const updateQuickOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName, phone, address, gstNumber, items, status, assignedTo } =
      req.body;

    const order = await QuickOrder.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (items) {
      if (!validateItems(items)) {
        return res.status(400).json({
          success: false,
          message: "Invalid items data",
        });
      }

      const { processedItems, totalAmount } = processItems(items);
      order.items = processedItems;
      order.totalAmount = totalAmount;
    }

    order.customerName = customerName || order.customerName;
    order.phone = phone || order.phone;
    order.address = address || order.address;
    order.gstNumber = gstNumber || order.gstNumber;

    const allowedStatus = [
      "pending",
      "assigned",
      "in_progress",
      "completed",
      "cancelled",
    ];

    if (status && allowedStatus.includes(status)) {
      order.status = status;
    }

    if (assignedTo) {
      const staff = await User.findById(assignedTo);

      if (!staff || staff.role !== "staff") {
        return res.status(400).json({
          success: false,
          message: "Invalid staff user",
        });
      }

      order.assignedTo = assignedTo;
      order.status = "assigned";

      await User.findByIdAndUpdate(assignedTo, {
        $push: {
          assignedOrders: {
            orderId: order._id,
            orderType: "QuickOrder",
          },
        },
      });
    }

    await order.save();

    res.json({
      success: true,
      message: "Quick Order updated",
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= ADD WORK IMAGES ================= */
export const addWorkImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { images } = req.body;

    if (!images || !Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        message: "Invalid images data",
      });
    }

    const order = await QuickOrder.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.workImages.push(...images);

    await order.save();

    res.json({
      success: true,
      message: "Images added",
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= DELETE QUICK ORDER ================= */
export const deleteQuickOrder = async (req, res) => {
  try {
    const order = await QuickOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await order.deleteOne();

    res.json({
      success: true,
      message: "Quick Order deleted",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};