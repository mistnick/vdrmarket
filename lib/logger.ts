import winston from "winston";

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

winston.addColors(colors);

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define transports
const transports: winston.transport[] = [
  // Console transport for all environments
  new winston.transports.Console(),
];

// Add file transports in production
if (process.env.NODE_ENV === "production") {
  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }) as winston.transport,
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }) as winston.transport
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  levels,
  format,
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: "logs/exceptions.log" }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: "logs/rejections.log" }),
  ],
});

// Structured logging helper
export const structuredLog = {
  info: (message: string, meta?: Record<string, any>) => {
    logger.info(message, { ...meta, timestamp: new Date().toISOString() });
  },

  error: (message: string, error?: Error, meta?: Record<string, any>) => {
    logger.error(message, {
      ...meta,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
      timestamp: new Date().toISOString(),
    });
  },

  warn: (message: string, meta?: Record<string, any>) => {
    logger.warn(message, { ...meta, timestamp: new Date().toISOString() });
  },

  debug: (message: string, meta?: Record<string, any>) => {
    logger.debug(message, { ...meta, timestamp: new Date().toISOString() });
  },

  http: (message: string, meta?: Record<string, any>) => {
    logger.http(message, { ...meta, timestamp: new Date().toISOString() });
  },
};

export default logger;
