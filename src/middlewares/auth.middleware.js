import jwt from "jsonwebtoken";
import { createError } from "../utils/error.utils.js";
import logger from "../config/logger.js";

// ============ General authentication middleware ============
export const authenticate = (req, res, next) => {
  const token =
    req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

  if (!token) return next(createError(401, "No token provided"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return next(createError(401, "Invalid or expired token"));
  }
};

// ============ roles middleware ============
export const authorizeRoles =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(createError(403, "Access denied"));
    }
    next();
  };

//========== Middleware to check regional access
export const hasRegionAccess = (regionType) => {
  return async (req, res, next) => {
    try {
      const admin = req.profile; // from authenticateAdmin
      const { district = null, state = null, country = null } = req.params;

      switch (admin.role) {
        case "super_admin":
          return next();

        case "nsa":
          if (regionType === "country" && country !== admin.nsaInfo.country) {
            return next(createError(403, "Access to this country is denied"));
          }
          return next();

        case "ssa":
          if (regionType === "country" && country !== admin.ssaInfo.country) {
            return next(createError(403, "Access to this country is denied"));
          }
          if (regionType === "state" && state !== admin.ssaInfo.state) {
            return next(createError(403, "Access to this state is denied"));
          }
          return next();

        case "dsa":
          if (regionType === "country" && country !== admin.dsaInfo.country) {
            return next(createError(403, "Access to this country is denied"));
          }
          if (regionType === "state" && state !== admin.dsaInfo.state) {
            return next(createError(403, "Access to this state is denied"));
          }
          if (
            regionType === "district" &&
            district !== admin.dsaInfo.district
          ) {
            return next(createError(403, "Access to this district is denied"));
          }
          return next();

        default:
          return next(createError(403, "Invalid admin role"));
      }
    } catch (error) {
      logger.error("Region access error:", error);
      next(createError(500, "Error checking region access"));
    }
  };
};
