import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Optional auth — attaches req.user if token present, but doesn't block if absent
export const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return next();

  const token = header.split(" ")[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    // ignore invalid token in optional mode
  }
  next();
};
