import jwt from "jsonwebtoken";
import crypto from "crypto";

export const generateAccessToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });

export const generateRefreshToken = () => crypto.randomBytes(40).toString("hex");

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const refreshExpiryDate = () => {
  const days = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN) || 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};
