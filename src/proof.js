const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const NOVA_PROOF_PATH = path.join(DATA_DIR, 'nova-proof.json');

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

function formatNovaProof(proof) {
  if (!proof) {
    return 'No stored live Nova proof yet — run `node src/index.js nova-check` before the demo.';
  }

  const validation = proof.validation?.ok ? 'schema pass' : 'schema needs review';
  return `${proof.checkedAt} | ${proof.modelId} | ${proof.region} | ${validation}`;
}

module.exports = {
  NOVA_PROOF_PATH,
  readNovaProof,
  writeNovaProof,
  formatNovaProof
};
