const { incidents } = require('./data');
const {
  classifySeverity,
  buildSummary,
  suggestNextActions,
  buildHandoff
} = require('./triage');

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

function printIncidentView(incident) {
  const triage = classifySeverity(incident.notes);
  const summary = buildSummary(incident);
  const actions = suggestNextActions(incident, triage.severity);
  const handoff = buildHandoff(
    incident,
    summary,
    triage.severity,
    triage.rationale,
    actions
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

  console.log('\nAI summary:');
  console.log(summary);

  console.log('\nRecommended severity:');
  console.log(`- ${triage.severity}`);
  console.log(`- rationale: ${triage.rationale}`);

  console.log('\nRecommended next actions:');
  for (const action of actions) {
    console.log(`- ${action}`);
  }

  console.log('\nHandoff draft:');
  console.log(handoff);
  console.log('\n-----------------------------------\n');
}

function main() {
  printHeader();
  incidents.forEach(printIncidentView);
}

main();
