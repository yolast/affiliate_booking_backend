import dotenv from "dotenv";
import app from "./app.js";
import logger from "./config/logger.js";
import mongoose from "mongoose";
// Load environment variables
dotenv.config();

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  logger.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(`${process.env.MONGO_DB_URI}`);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    logger.info(
      `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    );
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (err) => {
    logger.error("UNHANDLED REJECTION! 💥 Shutting down...");
    logger.error(err.name, err.message, err.stack);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle SIGTERM
  process.on("SIGTERM", () => {
    logger.info("👋 SIGTERM RECEIVED. Shutting down gracefully");
    server.close(() => {
      logger.info("💥 Process terminated!");
    });
  });
});
