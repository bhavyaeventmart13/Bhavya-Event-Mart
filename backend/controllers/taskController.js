import Task from "../models/Task.js";
import User from "../models/User.js";

/* ─── ADMIN: Create Task ───────────────────────── */
export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      deadline,
      assignedTo,
      linkedOrder,
      orderModel,
      taskType,
    } = req.body;

    const user = await User.findById(assignedTo);

    if (!user || user.role !== "staff") {
      return res.status(400).json({
        success: false,
        message: "Task can only be assigned to staff users",
      });
    }

    const task = await Task.create({
      title,
      description,
      deadline: deadline || null,
      assignedTo,
      createdBy: req.user._id,
      linkedOrder: linkedOrder || null,
      orderModel: orderModel || null,
      taskType: taskType || "general",
    });

    await User.findByIdAndUpdate(assignedTo, {
      $addToSet: { assignedTasks: task._id },
    });

    res.status(201).json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─── ADMIN: Get All Tasks ─────────────────────── */
export const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("linkedOrder")
      .sort({ createdAt: -1 });

    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─── ADMIN: Update Task ───────────────────────── */
export const updateTask = async (req, res) => {
  try {
    const {
      title,
      description,
      deadline,
      assignedTo,
      linkedOrder,
      orderModel,
      taskType,
    } = req.body;

    if (assignedTo) {
      const user = await User.findById(assignedTo);

      if (!user || user.role !== "staff") {
        return res.status(400).json({
          success: false,
          message: "Only staff can be assigned tasks",
        });
      }

      await User.findByIdAndUpdate(assignedTo, {
        $addToSet: { assignedTasks: req.params.id },
      });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        deadline,
        assignedTo,
        linkedOrder,
        orderModel,
        taskType,
      },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─── ADMIN: Delete Task ───────────────────────── */
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    await task.deleteOne();

    res.json({ success: true, message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─── STAFF: Get My Tasks ─────────────────────── */
export const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate("createdBy", "name email")
      .populate("linkedOrder")
      .sort({ createdAt: -1 });

    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─── STAFF: Update Task Status ───────────────── */
export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ["pending", "started", "completed"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      assignedTo: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    task.status = status;
    await task.save();

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─── STAFF: Add Work Images ─────────────────── */
export const addTaskImages = async (req, res) => {
  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        message: "Invalid images data",
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      assignedTo: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    task.workImages.push(...images);

    await task.save();

    res.json({
      success: true,
      message: "Images added",
      task,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};