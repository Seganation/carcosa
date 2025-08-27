import { Router } from "express";
import { register, login, logout, me } from "../controllers/auth.controller.js";

const router = Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/logout", logout);
router.get("/auth/me", me);

export default router;
