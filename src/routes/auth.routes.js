// =========== auth.routes.js
import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { getCurrentUser } from "../controllers/auth.controller.js";

const router = express.Router();
router.get("/me", authenticate, getCurrentUser);

export default router;
