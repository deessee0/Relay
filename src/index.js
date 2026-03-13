const {
  listIncidents,
  getIncident,
  createIncident,
  addNote,
  updateStatus
} = require('./incidents');
const {
  analyzeIncident,
  getAiRuntimeLabel,
  DEFAULT_MODEL_ID,
  DEFAULT_REGION
} = require('./analyze');
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

async function printIncidentView(incident, role = 'supervisor') {
  const result = await analyzeIncident(incident);
  const analysis = result.analysis;
  const handoff = analysis.handoff?.[role] || analysis.handoff?.supervisor || 'No handoff available.';

  console.log(`ID: ${incident.id}`);
  console.log(`Title: ${incident.title}`);
  console.log(`Location: ${incident.location}`);
  console.log(`Reporter: ${incident.reporter}`);
  console.log(`Status: ${incident.status}`);
  console.log(`Connectivity: ${incident.connectivity}`);
  console.log(`Created: ${incident.createdAt}`);
  console.log(`Updated: ${incident.updatedAt}`);
  console.log(`AI runtime: ${getAiRuntimeLabel(result)}\n`);

  printTimeline(incident);
  printSyncLog(incident);

  console.log('\nAI summary:');
  console.log(analysis.summary);

  console.log('\nRecommended severity:');
  console.log(`- ${analysis.severity}`);
  console.log(`- rationale: ${analysis.severityRationale}`);

  console.log('\nOperational impact:');
  console.log(`- operations: ${analysis.impact?.operations || 'n/a'}`);
  console.log(`- safety: ${analysis.impact?.safety || 'n/a'}`);
  console.log(`- continuity: ${analysis.impact?.continuity || 'n/a'}`);

  console.log('\nRecommended next actions:');
  for (const action of analysis.nextActions || []) {
    console.log(`- ${action}`);
  }

  console.log('\nCommand brief:');
  console.log(analysis.commandBrief || 'n/a');

  console.log(`\nHandoff draft (${role}):`);
  console.log(handoff);
  console.log('\n-----------------------------------\n');
}

function printUsage() {
  console.log('Usage:');
  console.log('  node src/index.js list');
  console.log('  node src/index.js view <incident-id> [role]');
  console.log('  node src/index.js analyze <incident-id>');
  console.log('  node src/index.js create <title> <location> <reporter> [connectivity]');
  console.log('  node src/index.js note <incident-id> <type> <text>');
  console.log('  node src/index.js status <incident-id> <status>');
  console.log('  node src/index.js demo');
  console.log('');
  console.log(`Amazon Nova defaults: model=${DEFAULT_MODEL_ID} region=${DEFAULT_REGION}`);
}

function assertArgs(args, expected, example) {
  if (args.length < expected) {
    console.error(`Missing arguments. Example: ${example}`);
    process.exitCode = 1;
    return false;
  }

  return true;
}

async function main() {
  const [command = 'demo', ...args] = process.argv.slice(2);

  if (command === 'list') {
    printHeader();
    for (const incident of listIncidents()) {
      console.log(`${incident.id} | ${incident.title} | status=${incident.status} | updated=${incident.updatedAt}`);
    }
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
    await printIncidentView(incident, role);
    return;
  }

  if (command === 'analyze') {
    if (!assertArgs(args, 1, 'node src/index.js analyze inc-001')) return;
    const incident = getIncident(args[0]);

    if (!incident) {
      console.error(`Incident not found: ${args[0]}`);
      process.exitCode = 1;
      return;
    }

    const result = await analyzeIncident(incident);
    console.log(JSON.stringify(result, null, 2));
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
    for (const incident of listIncidents()) {
      await printIncidentView(incident);
    }
    return;
  }

  printUsage();
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
