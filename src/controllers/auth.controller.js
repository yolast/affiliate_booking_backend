// ========== auth.controller.js
import User from "../models/user.model.js";
import generateToken from "../utils/generateToken.js";
import { createError } from "../utils/error.utils.js";
import logger from "../config/logger.js";

//============  Register a new user 👍
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, address } = req.body;

    // Basic validation
    if (!name || !email || !phone || !password || !address) {
      return next(createError(400, "All fields are required"));
    }

    // Check for existing user by email or phone
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return next(
        createError(400, "User with this email or phone already exists")
      );
    }

    // Construct new user object
    const newUser = new User({
      name,
      email,
      phone,
      password,
      role,
      address,
    });

    await newUser.save();

    // Generate JWT
    const token = generateToken({ userId: newUser._id });

    // Remove sensitive fields from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    logger.error("Error in registerUser:", error);
    next(error);
  }
};

// current user for keeping login state
export const getCurrentUser = (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  res.status(200).json({ user: req.user });
};
