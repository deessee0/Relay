const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const NOVA_PROOF_PATH = path.join(DATA_DIR, 'nova-proof.json');
const FRESH_PROOF_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readNovaProof() {
  ensureDataDir();

  if (!fs.existsSync(NOVA_PROOF_PATH)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(NOVA_PROOF_PATH, 'utf8'));
  } catch (error) {
    return null;
  }
}

function writeNovaProof(proof) {
  ensureDataDir();
  fs.writeFileSync(NOVA_PROOF_PATH, `${JSON.stringify(proof, null, 2)}\n`);
  return proof;
}

function getProofFreshness(proof, now = new Date()) {
  if (!proof?.checkedAt) {
    return { label: 'unknown age', fresh: false };
  }

  const checkedAtMs = new Date(proof.checkedAt).getTime();
  if (Number.isNaN(checkedAtMs)) {
    return { label: 'invalid timestamp', fresh: false };
  }

  const ageMs = Math.max(0, now.getTime() - checkedAtMs);
  const ageMinutes = Math.round(ageMs / 60000);

  if (ageMinutes < 1) {
    return { label: 'fresh just now', fresh: true };
  }

  if (ageMinutes < 60) {
    return { label: `fresh ${ageMinutes}m ago`, fresh: true };
  }

  const ageHours = Math.round(ageMinutes / 60);
  if (ageMs <= FRESH_PROOF_MAX_AGE_MS) {
    return { label: `fresh ${ageHours}h ago`, fresh: true };
  }

  const ageDays = Math.round(ageHours / 24);
  return { label: `stale ${ageDays}d ago`, fresh: false };
}

function formatNovaProof(proof, now = new Date()) {
  if (!proof) {
    return 'No stored live Nova proof yet — run `node src/index.js nova-check` before the demo.';
  }

  const validation = proof.validation?.ok ? 'schema pass' : 'schema needs review';
  const freshness = getProofFreshness(proof, now).label;
  return `${proof.checkedAt} | ${proof.modelId} | ${proof.region} | ${validation} | ${freshness}`;
}

module.exports = {
  FRESH_PROOF_MAX_AGE_MS,
  NOVA_PROOF_PATH,
  readNovaProof,
  writeNovaProof,
  getProofFreshness,
  formatNovaProof
};
