import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import HttpError from "../helpers/HttpError.js";
import User from "../db/models/user.js";
import gravatar from "gravatar";
import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import sendEmail from "../helpers/sendEmail.js";

const { JWT_SECRET = "default_jwt_secret" } = process.env;
const avatarsDir = path.resolve("public", "avatars");

export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return next(HttpError(409, "Email in use"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarURL = gravatar.url(email, { s: "250", d: "retro" }, true);
    const verificationToken = nanoid();
    const newUser = await User.create({
      email,
      password: hashedPassword,
      avatarURL,
      verificationToken,
    });

    const verifyUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/auth/verify/${verificationToken}`;
    await sendEmail({
      to: email,
      subject: "Verify your email",
      html: `<p>Please verify your email by clicking <a href="${verifyUrl}">this link</a>.</p>`,
    });

    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
        avatarURL: newUser.avatarURL,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return next(HttpError(401, "Email or password is wrong"));
    }

    if (!user.verify) {
      return next(HttpError(401, "Email not verified"));
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return next(HttpError(401, "Email or password is wrong"));
    }

    const payload = { id: user.id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });

    await user.update({ token });

    res.status(200).json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription,
        avatarURL: user.avatarURL,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { id } = req.user;
    const user = await User.findByPk(id);

    if (!user) {
      return next(HttpError(401, "Not authorized"));
    }

    await user.update({ token: null });

    res.status(204).json();
  } catch (error) {
    next(error);
  }
};

export const getCurrent = async (req, res, next) => {
  try {
    const { email, subscription } = req.user;
    res.status(200).json({ email, subscription });
  } catch (error) {
    next(error);
  }
};

export const updateSubscription = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { subscription } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return next(HttpError(401, "Not authorized"));
    }

    await user.update({ subscription });

    res.status(200).json({
      email: user.email,
      subscription: user.subscription,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAvatar = async (req, res, next) => {
  try {
    const { id } = req.user;
    if (!req.file) {
      return next(HttpError(400, "Avatar file is required"));
    }

    const { path: tempPath, originalname } = req.file;
    const ext = path.extname(originalname);
    const filename = `${id}_${Date.now()}${ext}`;
    const finalPath = path.join(avatarsDir, filename);
    const avatarURL = path.join("/avatars", filename);

    await fs.rename(tempPath, finalPath);

    const user = await User.findByPk(id);
    if (!user) {
      return next(HttpError(401, "Not authorized"));
    }

    await user.update({ avatarURL });

    res.status(200).json({ avatarURL });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({ where: { verificationToken } });

    if (!user) {
      return next(HttpError(404, "User not found"));
    }

    await user.update({ verify: true, verificationToken: null });
    res.status(200).json({ message: "Verification successful" });
  } catch (error) {
    next(error);
  }
};

export const resendVerifyEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return next(HttpError(404, "User not found"));
    }

    if (user.verify) {
      return next(HttpError(400, "Verification has already been passed"));
    }

    const verifyUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/auth/verify/${user.verificationToken}`;

    await sendEmail({
      to: email,
      subject: "Verify your email",
      html: `<p>Please verify your email by clicking <a href="${verifyUrl}">this link</a>.</p>`,
    });

    res.status(200).json({ message: "Verification email sent" });
  } catch (error) {
    next(error);
  }
};
