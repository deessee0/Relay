const {
  listIncidents,
  getIncident,
  createIncident,
  addNote,
  updateStatus
} = require('./incidents');
const {
  classifySeverity,
  buildSummary,
  suggestNextActions,
  buildHandoff
} = require('./triage');
const { buildSyncLog } = require('./sync');

function printHeader() {
  console.log('Relay — local-first incident copilot');
  console.log('===================================\n');
}

function printTimeline(incident) {
  console.log('Timeline:');
  for (const note of incident.notes) {
    console.log(`- [${note.at}] (${note.type}) ${note.text}`);
  }
}

function printSyncLog(incident) {
  console.log('\nSync state:');
  for (const event of buildSyncLog(incident)) {
    console.log(`- ${event.state}: ${event.detail}`);
  }
}

function printIncidentView(incident, role = 'supervisor') {
  const triage = classifySeverity(incident.notes);
  const summary = buildSummary(incident);
  const actions = suggestNextActions(incident, triage.severity);
  const handoff = buildHandoff(
    incident,
    summary,
    triage.severity,
    triage.rationale,
    actions,
    role
  );

  console.log(`ID: ${incident.id}`);
  console.log(`Title: ${incident.title}`);
  console.log(`Location: ${incident.location}`);
  console.log(`Reporter: ${incident.reporter}`);
  console.log(`Status: ${incident.status}`);
  console.log(`Connectivity: ${incident.connectivity}`);
  console.log(`Created: ${incident.createdAt}`);
  console.log(`Updated: ${incident.updatedAt}\n`);

  printTimeline(incident);
  printSyncLog(incident);

  console.log('\nAI summary:');
  console.log(summary);

  console.log('\nRecommended severity:');
  console.log(`- ${triage.severity}`);
  console.log(`- rationale: ${triage.rationale}`);

  console.log('\nRecommended next actions:');
  for (const action of actions) {
    console.log(`- ${action}`);
  }

  console.log(`\nHandoff draft (${role}):`);
  console.log(handoff);
  console.log('\n-----------------------------------\n');
}

function printUsage() {
  console.log('Usage:');
  console.log('  node src/index.js list');
  console.log('  node src/index.js view <incident-id> [role]');
  console.log('  node src/index.js create <title> <location> <reporter> [connectivity]');
  console.log('  node src/index.js note <incident-id> <type> <text>');
  console.log('  node src/index.js status <incident-id> <status>');
  console.log('  node src/index.js demo');
}

function assertArgs(args, expected, example) {
  if (args.length < expected) {
    console.error(`Missing arguments. Example: ${example}`);
    process.exitCode = 1;
    return false;
  }

  return true;
}

function main() {
  const [command = 'demo', ...args] = process.argv.slice(2);

  if (command === 'list') {
    printHeader();
    listIncidents().forEach((incident) => {
      const triage = classifySeverity(incident.notes);
      console.log(`${incident.id} | ${incident.title} | status=${incident.status} | severity=${triage.severity} | updated=${incident.updatedAt}`);
    });
    return;
  }

  if (command === 'view') {
    if (!assertArgs(args, 1, 'node src/index.js view inc-001 maintenance')) return;
    const [incidentId, role = 'supervisor'] = args;
    const incident = getIncident(incidentId);

    if (!incident) {
      console.error(`Incident not found: ${incidentId}`);
      process.exitCode = 1;
      return;
    }

    printHeader();
    printIncidentView(incident, role);
    return;
  }

  if (command === 'create') {
    if (!assertArgs(args, 3, 'node src/index.js create "Pump pressure drop" "West Intake" "Operator S. Kim" intermittent')) return;
    const [title, location, reporter, connectivity] = args;
    const incident = createIncident({ title, location, reporter, connectivity });
    console.log(`Created ${incident.id}`);
    return;
  }

  if (command === 'note') {
    if (!assertArgs(args, 3, 'node src/index.js note inc-001 observation "Thermal camera confirms hotspot near fan housing."')) return;
    const [incidentId, type, text] = args;
    const incident = addNote(incidentId, { type, text });
    console.log(`Updated ${incident.id} with ${type} note.`);
    return;
  }

  if (command === 'status') {
    if (!assertArgs(args, 2, 'node src/index.js status inc-001 in-review')) return;
    const [incidentId, status] = args;
    const incident = updateStatus(incidentId, status);
    console.log(`Updated ${incident.id} status to ${incident.status}.`);
    return;
  }

  if (command === 'demo') {
    printHeader();
    listIncidents().forEach((incident) => printIncidentView(incident));
    return;
  }

  printUsage();
  process.exitCode = 1;
}

main();
