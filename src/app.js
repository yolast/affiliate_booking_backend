import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import compression from "compression";
import { errorHandler } from "./utils/error.utils.js";
import logger from "./config/logger.js";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
//=========== configure dotenv
dotenv.config({
  path: "./.env",
});

// Import routes
// import authRoutes from "./routes/auth.routes.js";
import affiliateRoutes from "./routes/affiliate.routes.js";
// import userRoutes from "./routes/user.routes.js";
// import adminRoutes from "./routes/admin.routes.js";
// import serviceRoutes from "./routes/service.routes.js";
// import bookingRoutes from "./routes/booking.routes.js";
// import leadRoutes from "./routes/lead.routes.js";
// import webhookRoutes from "./routes/webhook.routes.js";
// import reportRoutes from "./routes/report.routes.js";

const app = express();

// ======== CORS
const definedAllowedOrigins = ["https://www.yolast.com"];
if (process.env.CORS_ORIGIN) {
  definedAllowedOrigins.push(process.env.CORS_ORIGIN);
}
const corsConfiguration = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    // and requests from whitelisted origins
    if (!origin || definedAllowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.error(`CORS Error: Origin ${origin} not allowed.`); // Log denied origins
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // Ensure OPTIONS is present
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"], // Add common headers
};

// Apply the configured CORS options to all routes, including preflight OPTIONS requests.
// This should be one of the first middleware.
app.use(cors(corsConfiguration));

// The explicit app.options line below can be a robust way to ensure OPTIONS requests are handled
// with your specific configuration, especially if there are complexities in routing.
// Make sure it uses the SAME configuration.
app.options("*", cors(corsConfiguration)); // Use the SAME configuration here

// const allowedOrigins = [process.env.CORS_ORIGIN, "http://localhost:5173"];

// Update your CORS middleware configuration
// app.use(
//   cors({
//     origin: allowedOrigins,
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
//   })
// );

// Explicit OPTIONS handler for all routes
app.options("*", cors());

app.use((req, res, next) => {
  console.log("Request Headers:", req.headers);
  console.log("Request Origin:", req.headers.origin);
  next();
});

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
}

// Rate limiting
const limiter = rateLimit({
  max: 100, // 100 requests per windowMs
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api", limiter);

// Body parser
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
// server.js (snippet)
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Compression
app.use(compression());

// Routes
// app.use("/api/auth", authRoutes);
app.use("/api/affiliates", affiliateRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/admins", adminRoutes);
// app.use("/api/services", serviceRoutes);
// app.use("/api/bookings", bookingRoutes);
// app.use("/api/leads", leadRoutes);
// app.use("/api/webhooks", webhookRoutes);
// app.use("/api/reports", reportRoutes);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.all("*", (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

// Global error handler
app.use(errorHandler);

export default app;
