import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import http from "http";
import { Server } from "socket.io";

import keywordRoutes from "./routes/keywordRoutes.js";
import { connectDB } from "./config/db.js";

import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import canvaRoutes from "./routes/canvaRoutes.js";
import popupRoutes from "./routes/popupRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import homeRoutes from "./routes/homeRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import productBackupRoutes from "./routes/productBackupRoutes.js";
import userUploadRoutes from "./routes/userUploadRoutes.js";
import communicationRoutes from "./routes/communicationRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import quickOrderRoutes from "./routes/quickOrderRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
dotenv.config();
connectDB();

const app = express();

// ==============================
// CORS
// ==============================
const allowedOrigins = [
  "http://localhost:5173",
  "https://https://bhavya-event-mart.onrender.com",
  "https://pankajcloth.com",
  "https://www.pankajcloth.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

// ==============================
// SECURITY
// ==============================
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));

// ==============================
// ROUTES
// ==============================

// uploads
app.use("/api/user-uploads", userUploadRoutes);

// webhook FIRST
app.use("/api/webhooks", webhookRoutes);

// backup
app.use("/api", productBackupRoutes);

// main APIs
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/canva", canvaRoutes);
app.use("/api/popups", popupRoutes);

// ⚠️ KEEP BOTH but now CLEAN FLOW
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/quick-orders", quickOrderRoutes);
app.use("/api/tasks", taskRoutes);

app.use("/api/upload", uploadRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/keywords", keywordRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/communication", communicationRoutes);

// ==============================
// 404 API HANDLER
// ==============================
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "API route not found" });
  }
  next();
});

// ==============================
// FALLBACK
// ==============================
app.use((req, res) => {
  res.send("Backend is running");
});

// ==============================
// ERROR HANDLER
// ==============================
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

// ==============================
// SOCKET.IO
// ==============================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🔌 Admin connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Admin disconnected:", socket.id);
  });
});

export { io };

// ==============================
// START SERVER
// ==============================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});