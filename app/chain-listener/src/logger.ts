type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const env = (name: string, fallback: string) => process.env[name] ?? fallback;
const configured = (process.env.LOG_LEVEL ?? "info") as Level;
const currentLevel = LEVELS[configured] ?? LEVELS.info;

function format(level: Level, msg: string, meta?: unknown) {
  const t = new Date().toISOString();
  const base = `[${t}] [${level.toUpperCase()}] ${msg}`;
  return meta ? `${base} ${JSON.stringify(meta)}` : base;
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
