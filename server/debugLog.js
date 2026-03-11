const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, '..', 'debug-217282.log');

function debugLog(payload) {
  try {
    const line = JSON.stringify({ ...payload, timestamp: payload.timestamp || Date.now() }) + '\n';
    fs.appendFileSync(LOG_PATH, line);
  } catch (_) {}
}

module.exports = { debugLog };
