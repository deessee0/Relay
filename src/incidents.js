const { readIncidents, writeIncidents } = require('./store');

function nowIso() {
  return new Date().toISOString();
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 24);
}

function makeIncidentId(title, incidents) {
  const base = slugify(title) || 'incident';
  let suffix = incidents.length + 1;
  let candidate = `inc-${base}-${suffix}`;

  while (incidents.some((incident) => incident.id === candidate)) {
    suffix += 1;
    candidate = `inc-${base}-${suffix}`;
  }

  return candidate;
}

function listIncidents() {
  return readIncidents();
}

function getIncident(id) {
  return readIncidents().find((incident) => incident.id === id);
}

function createIncident({ title, location, reporter, connectivity = 'offline-first' }) {
  const incidents = readIncidents();
  const timestamp = nowIso();

  const incident = {
    id: makeIncidentId(title, incidents),
    title,
    location,
    reporter,
    severity: 'pending',
    status: 'open',
    connectivity,
    createdAt: timestamp,
    updatedAt: timestamp,
    notes: [
      {
        at: timestamp,
        type: 'intake',
        text: `Incident created by ${reporter}.`
      }
    ]
  };

  incidents.push(incident);
  writeIncidents(incidents);
  return incident;
}

function addNote(id, { type = 'observation', text }) {
  const incidents = readIncidents();
  const incident = incidents.find((item) => item.id === id);

  if (!incident) {
    throw new Error(`Incident not found: ${id}`);
  }

  const timestamp = nowIso();
  incident.notes.push({ at: timestamp, type, text });
  incident.updatedAt = timestamp;

  writeIncidents(incidents);
  return incident;
}

function updateStatus(id, status) {
  const incidents = readIncidents();
  const incident = incidents.find((item) => item.id === id);

  if (!incident) {
    throw new Error(`Incident not found: ${id}`);
  }

  const timestamp = nowIso();
  incident.status = status;
  incident.updatedAt = timestamp;
  incident.notes.push({
    at: timestamp,
    type: 'status',
    text: `Status changed to ${status}.`
  });

  writeIncidents(incidents);
  return incident;
}

module.exports = {
  listIncidents,
  getIncident,
  createIncident,
  addNote,
  updateStatus
};
