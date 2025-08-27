import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Error:", error);

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";
  const code = error.code || "internal_error";

  // Don't leak internal errors in production
  const isProduction = process.env.NODE_ENV === "production";
  const errorResponse = {
    error: code,
    message: isProduction && statusCode === 500 ? "Internal server error" : message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  };

  res.status(statusCode).json(errorResponse);
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: "not_found",
    message: `Route ${req.method} ${req.path} not found`,
  });
}
