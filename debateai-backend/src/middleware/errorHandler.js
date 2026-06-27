export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.code === "23505") {
    // Postgres unique violation
    return res.status(409).json({ error: "That email is already in use" });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || "Internal server error",
  });
};

export const notFound = (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
};
