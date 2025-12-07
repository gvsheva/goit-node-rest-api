import express from "express";
import validateBody from "../helpers/validateBody.js";
import authenticate from "../middleware/authenticate.js";
import {
  register,
  login,
  logout,
  getCurrent,
  updateSubscription,
  updateAvatar,
  verifyEmail,
  resendVerifyEmail,
} from "../controllers/authControllers.js";
import {
  registerSchema,
  loginSchema,
  updateSubscriptionSchema,
  verifyEmailSchema,
} from "../schemas/authSchemas.js";
import upload from "../middleware/upload.js";

const authRouter = express.Router();

authRouter.post("/register", validateBody(registerSchema), register);
authRouter.post("/login", validateBody(loginSchema), login);
authRouter.post("/logout", authenticate, logout);
authRouter.get("/current", authenticate, getCurrent);
authRouter.patch(
  "/subscription",
  authenticate,
  validateBody(updateSubscriptionSchema),
  updateSubscription
);
authRouter.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  updateAvatar
);
authRouter.get("/verify/:verificationToken", verifyEmail);
authRouter.post(
  "/verify",
  validateBody(verifyEmailSchema),
  resendVerifyEmail
);

export default authRouter;
