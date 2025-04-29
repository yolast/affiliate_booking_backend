import express from "express";
import {
  getRevenueReport,
  getCommissionReport,
  getLeadConversionReport,
  getProductPerformanceReport,
  getAffiliatePerformanceReport,
  getRegionalPerformanceReport,
} from "../controllers/report.controller.js";
import { verifyToken, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All report routes require admin authentication
router.use(verifyToken, verifyAdmin);

// Report routes
router.get("/revenue", getRevenueReport);
router.get("/commission", getCommissionReport);
router.get("/lead-conversion", getLeadConversionReport);
router.get("/product-performance", getProductPerformanceReport);
router.get("/affiliate-performance", getAffiliatePerformanceReport);
router.get("/regional-performance", getRegionalPerformanceReport);

export default router;
