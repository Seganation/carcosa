import morgan from "morgan";
import fs from "fs";
import path from "path";

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Morgan format for development
const devFormat = ":method :url :status :response-time ms - :res[content-length]";

// Morgan format for production (more concise)
const prodFormat = ":method :url :status :response-time ms";

// Create write streams for log files
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, "access.log"),
  { flags: "a" }
);

const errorLogStream = fs.createWriteStream(
  path.join(logsDir, "error.log"),
  { flags: "a" }
);

// Development logger
export const devLogger = morgan(devFormat);

// Production logger
export const prodLogger = morgan(prodFormat, {
  stream: accessLogStream,
});

// Error logger (only logs errors)
export const errorLogger = morgan("combined", {
  skip: (req, res) => res.statusCode < 400,
  stream: errorLogStream,
});

// Get appropriate logger based on environment
export function getLogger() {
  if (process.env.NODE_ENV === "production") {
    return prodLogger;
  }
  return devLogger;
}
