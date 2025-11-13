import { Router } from "express";
import { register, login, logout, me } from "../controllers/auth.controller.js";
import {
  validate,
  registerSchema,
  loginSchema,
} from "../utils/validation.js";

const router = Router();

router.post("/auth/register", validate(registerSchema), register);
router.post("/auth/login", validate(loginSchema), login);
router.post("/auth/logout", logout);
router.get("/auth/me", me);

export default router;
