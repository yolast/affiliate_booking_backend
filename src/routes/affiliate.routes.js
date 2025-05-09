// =========== affiliate.routes.js
import express from "express";
import {
  registerAffiliate,
  loginAffiliate,
  getAffiliateQR,
  generateAffiliateQR,
  getAffiliateEarnings,
} from "../controllers/affiliate.controller.js";

import {
  authenticate,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";
import upload from "../middlewares/uploads.js";

const router = express.Router();

// ======= PUBLIC ROUTES =======

// @route   POST /api/affiliate/register
// @desc    Register as an affiliate
router.post(
  "/register",
  upload.fields([
    { name: "aadhar", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
  ]),
  registerAffiliate
);

// @route   POST /api/affiliate/login
// @desc    Login as an affiliate
router.post("/login", loginAffiliate);

// @route   GET /api/affiliate/qr
// @desc    Get or Generate QR Code
router.get("/qr", authenticate, authorizeRoles("affiliate"), getAffiliateQR); // Get existing or generate new

// @route   POST /api/affiliate/qr/generate
// @desc    Force generate new QR (if required separately)
router.post(
  "/qr/generate",
  authenticate,
  authorizeRoles("affiliate"),
  generateAffiliateQR
);

// @route   GET /api/affiliate/earnings
// @desc    Get affiliate earnings with filters
router.get("/earnings", getAffiliateEarnings);

export default router;
