type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };
// const configured = (process.env.LOG_LEVEL ?? "info") as Level;
// const currentLevel = LEVELS[configured] ?? LEVELS.info;

/**
 * @dev Using debug for now.
 */
const configured = "debug" as Level;
const currentLevel = LEVELS[configured];

console.info("Starting logger with level: ", currentLevel, ":", configured);
function format(level: Level, msg: string, meta?: unknown) {
  const t = new Date().toISOString();
  const base = `[${t}] [${level.toUpperCase()}] ${msg}`;

  if (meta instanceof Error) {
    // handles errors passed as second argument
    return `${base} ${meta.message}\n${meta.stack}`;
  }

  return meta
    ? `${base} ${JSON.stringify(meta, (_key: string, value: unknown) => {
        if (typeof value === "bigint") {
          return value.toString();
        }
        return value;
      })}`
    : base;
}

export const logger = {
  debug: (msg: string, meta?: unknown) => {
    if (currentLevel <= LEVELS.debug) console.debug(format("debug", msg, meta));
  },
  info: (msg: string, meta?: unknown) => {
    if (currentLevel <= LEVELS.info) console.log(format("info", msg, meta));
  },
  warn: (msg: string, meta?: unknown) => {
    if (currentLevel <= LEVELS.warn) console.warn(format("warn", msg, meta));
  },
  error: (msg: string | Error, meta?: unknown) => {
    const text =
      msg instanceof Error ? `${msg.message}\n${msg.stack}` : String(msg);
    if (currentLevel <= LEVELS.error)
      console.error(format("error", text, meta));
  },
};
