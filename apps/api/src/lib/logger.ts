import pino from "pino";

/** Structured logs without personal data: bodies are never logged; known PII fields are redacted. */
export function createLogger(level: string) {
  return pino({
    level,
    redact: { paths: ["*.email", "*.phone", "*.address", "*.name", "*.password", "req.headers.cookie", "req.headers.authorization"], censor: "[redacted]" },
    base: undefined,
  });
}
export type Logger = ReturnType<typeof createLogger>;
