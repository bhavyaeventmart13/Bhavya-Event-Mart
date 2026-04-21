import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ==============================
// USER SCHEMA
// ==============================
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 40,
    },

    phone: {
      type: String,
      trim: true,
      unique: true,
      minlength: 10,
      maxlength: 15,
      sparse: true,
      index: true,
    },

    email: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
      index: true,
    },

    password: {
      type: String,
      minlength: 6,
      select: false, // 🔥 security improvement
    },

    address: {
      type: String,
      trim: true,
      maxlength: 120,
    },

    // ==============================
    // ROLE SYSTEM
    // ==============================
    role: {
      type: String,
      enum: ["admin", "staff", "customer"],
      default: "customer",
      index: true,
    },

    // ==============================
    // ADMIN → STAFF RELATION
    // ==============================
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ==============================
    // TASK ASSIGNMENT
    // ==============================
    assignedTasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],

    // ==============================
    // ORDER ASSIGNMENT (VERY IMPORTANT)
    // ==============================
    assignedOrders: [
      {
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: "assignedOrders.orderType", // 🔥 dynamic ref
        },
        orderType: {
          type: String,
          enum: ["Order", "QuickOrder"],
          required: true,
        },
        assignedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ==============================
    // LOCATION TRACKING
    // ==============================
    currentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      lastUpdated: { type: Date, default: null },
    },

    locationSharingEnabled: {
      type: Boolean,
      default: false,
    },

    // ==============================
    // STATUS
    // ==============================
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { versionKey: false, timestamps: true }
);

// ==============================
// VALIDATION — phone or email required
// ==============================
userSchema.pre("validate", function (next) {
  if (!this.phone && !this.email) {
    return next(new Error("Either phone or email must be provided."));
  }

  // 🔥 Staff must have admin creator
  if (this.role === "staff" && !this.createdBy) {
    return next(new Error("Staff must be created by an admin."));
  }

  next();
});

// ==============================
// HASH PASSWORD
// ==============================
userSchema.pre("save", async function (next) {
  if (!this.password) return next();

  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ==============================
// MATCH PASSWORD
// ==============================
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

// ==============================
// LOGIN HELPER
// ==============================
userSchema.statics.findByLoginField = async function (identifier) {
  return this.findOne({
    $or: [{ phone: identifier }, { email: identifier }],
  }).select("+password");
};

const User = mongoose.model("User", userSchema);
export default User;