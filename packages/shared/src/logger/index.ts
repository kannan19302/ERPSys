/* eslint-disable no-console */
export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: 'info', message, timestamp: new Date().toISOString(), ...meta }));
  },
  error: (message: string, error?: unknown, meta?: Record<string, unknown>) => {
    console.error(JSON.stringify({ level: 'error', message, error: error instanceof Error ? error.message : error, timestamp: new Date().toISOString(), ...meta }));
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: 'warn', message, timestamp: new Date().toISOString(), ...meta }));
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    console.debug(JSON.stringify({ level: 'debug', message, timestamp: new Date().toISOString(), ...meta }));
  }
};
