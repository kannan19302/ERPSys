/* eslint-disable no-console */
export const logger = {
    info: (message, meta) => {
        console.log(JSON.stringify({ level: 'info', message, timestamp: new Date().toISOString(), ...meta }));
    },
    error: (message, error, meta) => {
        console.error(JSON.stringify({ level: 'error', message, error: error instanceof Error ? error.message : error, timestamp: new Date().toISOString(), ...meta }));
    },
    warn: (message, meta) => {
        console.warn(JSON.stringify({ level: 'warn', message, timestamp: new Date().toISOString(), ...meta }));
    },
    debug: (message, meta) => {
        console.debug(JSON.stringify({ level: 'debug', message, timestamp: new Date().toISOString(), ...meta }));
    }
};
//# sourceMappingURL=index.js.map