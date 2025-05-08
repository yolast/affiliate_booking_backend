// ========== affiliate.controller.js

import QRCode from "qrcode";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import User from "../models/user.model.js";
import generateToken from "../utils/generateToken.js";

export const registerAffiliate = async (req, res) => {
  try {
    const { name, email, phone, city, district, state, country, password } =
      req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const newUser = await User.create({
      name,
      email,
      phone,
      password,
      role: "affiliate",
      address: { city, district, state, country },
    });

    res.status(201).json({ success: true, userId: newUser._id });
  } catch (err) {
    console.error("Affiliate Registration Error:", err);
    res.status(500).json({ message: "Failed to register affiliate" });
  }
};

export const loginAffiliate = async (req, res) => {
  try {
    const { email, password } = req.body;

    const affiliate = await User.findOne({ email });
    if (!affiliate || !(await affiliate.comparePassword(password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    const token = generateToken(affiliate._id, affiliate.role);

    res
      .cookie("accessToken", token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        success: true,
        message: "Login successful.",
        affiliate: {
          id: affiliate._id,
          name: affiliate.name,
          email: affiliate.email,
          role: affiliate.role,
        },
      });
  } catch (error) {
    console.error("Affiliate login error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

//   generate affiliate qr
export const generateAffiliateQR = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || user.role !== "affiliate") {
      return res
        .status(403)
        .json({ message: "Access denied. Not an affiliate." });
    }

    if (user.affiliateInfo?.qrCode) {
      return res.status(200).json({ qrCodeUrl: user.affiliateInfo.qrCode });
    }

    const referralLink = `${process.env.CLIENT_URL}/lead-form?ref=${user._id}`;
    const qrDataUrl = await QRCode.toDataURL(referralLink);

    const uploadRes = await uploadOnCloudinary(qrDataUrl, "affiliates/qrcodes");

    if (!uploadRes?.secure_url) {
      return res.status(500).json({ message: "Failed to upload QR" });
    }

    if (!user.affiliateInfo) {
      user.affiliateInfo = {};
    }

    user.affiliateInfo.qrCode = uploadRes.secure_url;
    await user.save();

    res.status(200).json({ qrCodeUrl: uploadRes.secure_url });
  } catch (err) {
    console.error("QR Gen Error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// @desc Generate affiliate QR Code
// @route GET /api/affiliate/qr
// @access Private (Affiliate Only)
export const getAffiliateQR = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(userId);
    const user = await User.findById(userId);

    if (!user || user.role !== "affiliate") {
      return res
        .status(403)
        .json({ message: "Access denied. Not an affiliate." });
    }

    // Return existing QR code if already generated
    if (!user.affiliateInfo?.qrCode) {
      return res.status(400).json("qr code did not found");
    }
    return res.status(200).json({ qrCodeUrl: user.affiliateInfo.qrCode });
  } catch (error) {
    console.error("QR Gen Error:", error);
    res.status(500).json({ message: "Failed to generate QR code" });
  }
};
//========== Generate QR code for affiliate ❓ (not clear)
// export const generateAffiliateQR = async (req, res, next) => {
//   try {
//     const userId = req.user.id;

//     // Check if user is an affiliate
//     const user = await User.findById(userId);

//     if (!user) {
//       return next(createError(404, "User not found"));
//     }

//     if (user.role !== "affiliate") {
//       return next(createError(400, "Only affiliates can generate QR codes"));
//     }

//     // Generate QR code using Razorpay
//     const qrCode = await generateQRCode(userId.toString(), {
//       name: user.name,
//       email: user.email,
//       phone: user.phone,
//     });

//     // Update user with QR code
//     user.affiliateInfo.qrCode = qrCode.image_url;
//     await user.save();

//     res.status(200).json({
//       success: true,
//       data: {
//         qrCode: qrCode.image_url,
//         qrId: qrCode.id,
//       },
//     });
//   } catch (error) {
//     logger.error("Error in generateAffiliateQR:", error);
//     next(error);
//   }
// };

//============  Get affiliate earnings  👍
export const getAffiliateEarnings = async (req, res, next) => {
  try {
    const affiliateId = req.user.id;
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    // Check if user is an affiliate
    const user = await User.findById(affiliateId);

    if (!user) {
      return next(createError(404, "User not found"));
    }

    if (user.role !== "affiliate") {
      return next(createError(400, "Only affiliates can access earnings"));
    }

    // Build filter
    const filter = { affiliateId };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get bookings with commissions
    const bookings = await Booking.find({
      ...filter,
      status: { $in: ["confirmed", "completed"] },
    })
      .select("bookingId productId commissions.affiliate status createdAt")
      .populate("productId", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count
    const total = await Booking.countDocuments({
      ...filter,
      status: { $in: ["confirmed", "completed"] },
    });

    // Calculate total earnings
    const totalEarnings = await Booking.aggregate([
      {
        $match: {
          affiliateId,
          status: { $in: ["confirmed", "completed"] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$commissions.affiliate.amount" },
        },
      },
    ]);

    // Calculate earnings by status
    const earningsByStatus = await Booking.aggregate([
      {
        $match: {
          affiliateId,
          status: { $in: ["confirmed", "completed"] },
        },
      },
      {
        $group: {
          _id: "$commissions.affiliate.status",
          total: { $sum: "$commissions.affiliate.amount" },
        },
      },
    ]);

    // Format the results
    const formattedEarningsByStatus = earningsByStatus.reduce((acc, item) => {
      acc[item._id] = item.total;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
        earnings: {
          total: totalEarnings.length > 0 ? totalEarnings[0].total : 0,
          byStatus: formattedEarningsByStatus,
        },
      },
    });
  } catch (error) {
    logger.error("Error in getAffiliateEarnings:", error);
    next(error);
  }
};
