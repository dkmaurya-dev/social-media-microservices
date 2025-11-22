import jwt from "jsonwebtoken";
import crypto from "crypto";

export const generateAuthToken = (user) => {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
  };

  // Create access token
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "60m",
  });

  // Create refresh token
  const refreshToken = crypto.randomBytes(40).toString("hex");

  // Set refresh token expiry (7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // ✅ Return both tokens
  return { accessToken, refreshToken, expiresAt };
};
