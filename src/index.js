const incidents = [
  {
    id: 'inc-001',
    title: 'Generator overheating at remote site',
    severity: 'high',
    status: 'open',
    summary: 'Field operator reported repeated overheating alarms and intermittent shutdowns at a remote generator site.',
    nextActions: [
      'Dispatch technician with cooling-system checklist',
      'Review recent maintenance logs',
      'Prepare temporary load reduction plan'
    ]
  }
];

function printHeader() {
  console.log('Relay — local-first incident copilot');
  console.log('-----------------------------------');
}

function printIncident(incident) {
  console.log(`ID: ${incident.id}`);
  console.log(`Title: ${incident.title}`);
  console.log(`Severity: ${incident.severity}`);
  console.log(`Status: ${incident.status}`);
  console.log(`Summary: ${incident.summary}`);
  console.log('Next actions:');
  for (const action of incident.nextActions) {
    console.log(`- ${action}`);
  }
}

function main() {
  printHeader();
  incidents.forEach(printIncident);
}

main();
