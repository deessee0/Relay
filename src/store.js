const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const INCIDENTS_PATH = path.join(DATA_DIR, 'incidents.json');

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readIncidents() {
  ensureDataDir();

  if (!fs.existsSync(INCIDENTS_PATH)) {
    fs.writeFileSync(INCIDENTS_PATH, '[]\n');
  }

  return JSON.parse(fs.readFileSync(INCIDENTS_PATH, 'utf8'));
}

function writeIncidents(incidents) {
  ensureDataDir();
  fs.writeFileSync(INCIDENTS_PATH, `${JSON.stringify(incidents, null, 2)}\n`);
}

module.exports = {
  readIncidents,
  writeIncidents,
  INCIDENTS_PATH
};
