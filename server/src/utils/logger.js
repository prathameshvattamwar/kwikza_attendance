const env = require('../config/env');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const LEVEL_CONFIG = {
  error: { color: COLORS.red, label: 'ERROR' },
  warn: { color: COLORS.yellow, label: 'WARN ' },
  info: { color: COLORS.green, label: 'INFO ' },
  debug: { color: COLORS.cyan, label: 'DEBUG' },
};

function formatTimestamp() {
  return new Date().toISOString();
}

function formatMessage(level, args) {
  const config = LEVEL_CONFIG[level];
  const timestamp = formatTimestamp();

  if (env.isDev) {
    const prefix = `${COLORS.gray}${timestamp}${COLORS.reset} ${config.color}[${config.label}]${COLORS.reset}`;
    return [prefix, ...args];
  }

  // In production, output structured JSON for the first argument if it's a string
  const message = args.length > 0 ? args[0] : '';
  const meta = args.length > 1 ? args.slice(1) : [];
  return [
    JSON.stringify({
      timestamp,
      level,
      message,
      ...(meta.length > 0 && { meta }),
    }),
  ];
}

const logger = {
  info(...args) {
    console.log(...formatMessage('info', args));
  },

  warn(...args) {
    console.warn(...formatMessage('warn', args));
  },

  error(...args) {
    console.error(...formatMessage('error', args));
  },

  debug(...args) {
    if (env.isDev) {
      console.debug(...formatMessage('debug', args));
    }
  },
};

module.exports = logger;
