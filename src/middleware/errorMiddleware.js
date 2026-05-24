function notFound(req, res, next) {
  const error = new Error(`Not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
}

function errorHandler(err, req, res, next) {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || "Server error";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((item) => item.message).join(", ");
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource id";
  } else if (err.code === 11000) {
    statusCode = 409;
    message = "Duplicate data already exists";
  } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Session expired. Please login again.";
  } else if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON request body";
  }

  res.status(statusCode).json({
    success: false,
    message
  });
}

module.exports = { notFound, errorHandler };
