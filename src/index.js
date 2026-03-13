const {
  listIncidents,
  getIncident,
  createIncident,
  addNote,
  updateStatus,
  getLatestAnalysis,
  saveAnalysis
} = require('./incidents');
const {
  analyzeIncident,
  getAiRuntimeLabel,
  createStoredSnapshot,
  summarizeChanges,
  DEFAULT_MODEL_ID,
  DEFAULT_REGION
} = require('./analyze');
const { buildSyncLog } = require('./sync');
const { analyzePortfolio, getPortfolioRuntimeLabel, computeAttentionScore } = require('./command-center');
const { runEvaluation } = require('./eval');
const { probeNova } = require('./nova');

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

function printList(items, emptyMessage = 'None.') {
  if (!items || !items.length) {
    console.log(`- ${emptyMessage}`);
    return;
  }

  for (const item of items) {
    console.log(`- ${item}`);
  }
}

function printAnalysis(analysis, role = 'supervisor') {
  const handoff = analysis.handoff?.[role] || analysis.handoff?.supervisor || 'No handoff available.';

  console.log('\nAI summary:');
  console.log(analysis.summary);

  console.log('\nRecommended severity:');
  console.log(`- ${analysis.severity}`);
  console.log(`- rationale: ${analysis.severityRationale}`);
  console.log(`- confidence: ${analysis.confidence || 'n/a'}`);
  console.log(`- evidence status: ${analysis.evidenceStatus || 'n/a'}`);

  console.log('\nCommander intent:');
  console.log(analysis.commanderIntent || 'n/a');

  console.log('\nOperational impact:');
  console.log(`- operations: ${analysis.impact?.operations || 'n/a'}`);
  console.log(`- safety: ${analysis.impact?.safety || 'n/a'}`);
  console.log(`- continuity: ${analysis.impact?.continuity || 'n/a'}`);

  console.log('\nEscalation triggers:');
  printList(analysis.escalationTriggers, 'No explicit escalation trigger identified.');

  console.log('\nInformation needed next:');
  printList(analysis.informationNeeds, 'No additional information requested.');

  console.log('\nCurrent blockers:');
  printList(analysis.blockers, 'No blocker identified.');

  console.log('\nRecommended next actions:');
  printList(analysis.nextActions, 'No action generated.');

  console.log('\nNext checkpoint:');
  console.log(analysis.nextCheckpoint || 'n/a');

  console.log('\nCommand brief:');
  console.log(analysis.commandBrief || 'n/a');

  console.log(`\nHandoff draft (${role}):`);
  console.log(handoff);
}

function printBoard() {
  printHeader();
  console.log('Incident command board:\n');

  const incidents = [...listIncidents()].sort((a, b) => computeAttentionScore(b) - computeAttentionScore(a));

  for (const incident of incidents) {
    const latest = getLatestAnalysis(incident);
    const analysis = latest?.analysis;
    console.log(`${incident.id} | ${incident.title}`);
    console.log(`  status=${incident.status} | location=${incident.location} | connectivity=${incident.connectivity}`);
    console.log(`  severity=${analysis?.severity || incident.severity || 'pending'} | confidence=${analysis?.confidence || 'n/a'} | evidence=${analysis?.evidenceStatus || 'n/a'} | attention=${computeAttentionScore(incident)}`);
    console.log(`  intent=${analysis?.commanderIntent || 'Run refresh to generate a command objective.'}`);
    console.log(`  next checkpoint=${analysis?.nextCheckpoint || 'Run refresh to generate a command update.'}`);
    console.log(`  blocker=${analysis?.blockers?.[0] || 'none'}`);
    console.log('');
  }
}

async function printIncidentView(incident, role = 'supervisor') {
  const latestSnapshot = getLatestAnalysis(incident);
  const result = latestSnapshot
    ? {
        provider: latestSnapshot.provider,
        modelId: latestSnapshot.modelId,
        region: latestSnapshot.region,
        analysis: latestSnapshot.analysis
      }
    : await analyzeIncident(incident);
  const analysis = result.analysis;

  console.log(`ID: ${incident.id}`);
  console.log(`Title: ${incident.title}`);
  console.log(`Location: ${incident.location}`);
  console.log(`Reporter: ${incident.reporter}`);
  console.log(`Status: ${incident.status}`);
  console.log(`Connectivity: ${incident.connectivity}`);
  console.log(`Created: ${incident.createdAt}`);
  console.log(`Updated: ${incident.updatedAt}`);
  console.log(`AI runtime: ${getAiRuntimeLabel(result)}`);
  console.log(`Stored analysis: ${latestSnapshot ? latestSnapshot.generatedAt : 'none yet — displaying live analysis'}`);

  printTimeline(incident);
  printSyncLog(incident);
  printAnalysis(analysis, role);
  console.log('\n-----------------------------------\n');
}

async function refreshIncidentAnalysis(incidentId, role = 'supervisor') {
  const incident = getIncident(incidentId);

  if (!incident) {
    throw new Error(`Incident not found: ${incidentId}`);
  }

  const previousSnapshot = getLatestAnalysis(incident);
  const result = await analyzeIncident(incident);
  const snapshot = createStoredSnapshot(result);
  const updatedIncident = saveAnalysis(incidentId, snapshot);

  printHeader();
  console.log(`Refreshed command package for ${updatedIncident.id}`);
  console.log(`AI runtime: ${getAiRuntimeLabel(result)}`);
  console.log(`Stored at: ${snapshot.generatedAt}`);

  console.log('\nChange summary:');
  printList(summarizeChanges(previousSnapshot, snapshot));

  printAnalysis(snapshot.analysis, role);
  console.log('\n-----------------------------------\n');
}

function printPortfolioAnalysis(result) {
  const analysis = result.analysis || {};

  console.log('\nPortfolio summary:');
  console.log(analysis.portfolioSummary || 'n/a');

  console.log('\nCommand posture:');
  console.log(analysis.commandPosture || 'n/a');

  console.log('\nPriority order:');
  for (const item of analysis.priorityOrder || []) {
    console.log(`- #${item.rank} ${item.incidentId}: ${item.whyNow}`);
    console.log(`  commander action: ${item.commanderAction}`);
  }

  console.log('\nCross-incident risks:');
  printList(analysis.crossIncidentRisks, 'No cross-incident risk identified.');

  console.log('\nResource tensions:');
  printList(analysis.resourceTensions, 'No resource tension identified.');

  console.log('\nNext command brief:');
  console.log(analysis.nextCommandBrief || 'n/a');
}

async function printCommandCenter() {
  const incidents = listIncidents();
  const result = await analyzePortfolio(incidents);

  printHeader();
  console.log('Relay Command Center');
  console.log('--------------------');
  console.log(`AI runtime: ${getPortfolioRuntimeLabel(result)}`);
  console.log(`Active incidents: ${incidents.length}`);
  printPortfolioAnalysis(result);
  console.log('\n-----------------------------------\n');
}

function printEvaluation(report) {
  printHeader();
  console.log('Relay evaluation harness');
  console.log('------------------------');
  console.log(`Provider mode: ${report.provider}`);
  console.log(`Scenarios: ${report.scenarioCount}`);
  console.log(`Average score: ${report.averageScore}/100\n`);

  for (const item of report.results) {
    console.log(`${item.scenarioId} | score=${item.score}/100 | severity=${item.severity} | expected=${item.expectedSeverity}`);
    console.log(`  keywords=${item.checks.keywordCoverage} | uncertainty=${item.checks.uncertaintyHandled ? 'ok' : 'missed'} | evidence=${item.checks.evidenceStatusGood ? 'ok' : 'weak'} | intent=${item.checks.commanderIntentGood ? 'ok' : 'weak'} | nextActions=${item.checks.actionCountGood ? 'ok' : 'weak'}`);
    console.log(`  ${item.summary}`);
    console.log('');
  }
}

async function printNovaProbe() {
  printHeader();
  console.log('Amazon Nova readiness check');
  console.log('---------------------------');

  try {
    const result = await probeNova();

    console.log(`Checked at: ${result.checkedAt}`);
    console.log(`AI runtime: Amazon Nova via Bedrock (${result.modelId}, ${result.region})`);
    console.log(`Schema validation: ${result.validation?.ok ? 'pass' : 'needs review'}`);
    if (result.validation?.problems?.length) {
      console.log('Validation notes:');
      printList(result.validation.problems);
    }

    console.log('\nProbe summary:');
    console.log(result.analysis.summary);

    console.log('\nCommand brief:');
    console.log(result.analysis.commandBrief);
    console.log('\n-----------------------------------\n');
    return;
  } catch (error) {
    console.log('Status: not ready for live Amazon Nova demo');
    console.log(`Model: ${DEFAULT_MODEL_ID}`);
    console.log(`Region: ${DEFAULT_REGION}`);
    console.log(`Cause: ${error.message}`);
    console.log('\nNext step: configure Bedrock credentials, then re-run `node src/index.js nova-check`.');
    console.log('Relay itself still remains usable in local fallback mode for offline demonstration.');
    console.log('\n-----------------------------------\n');
    process.exitCode = 1;
  }
}

function printUsage() {
  console.log('Usage:');
  console.log('  node src/index.js list');
  console.log('  node src/index.js board');
  console.log('  node src/index.js command-center');
  console.log('  node src/index.js view <incident-id> [role]');
  console.log('  node src/index.js analyze <incident-id>');
  console.log('  node src/index.js refresh <incident-id> [role]');
  console.log('  node src/index.js nova-check');
  console.log('  node src/index.js create <title> <location> <reporter> [connectivity]');
  console.log('  node src/index.js note <incident-id> <type> <text>');
  console.log('  node src/index.js status <incident-id> <status>');
  console.log('  node src/index.js eval');
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

  if (command === 'board') {
    printBoard();
    return;
  }

  if (command === 'command-center') {
    await printCommandCenter();
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

  if (command === 'refresh') {
    if (!assertArgs(args, 1, 'node src/index.js refresh inc-001 maintenance')) return;
    const [incidentId, role = 'supervisor'] = args;
    await refreshIncidentAnalysis(incidentId, role);
    return;
  }

  if (command === 'nova-check') {
    await printNovaProbe();
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

  if (command === 'eval') {
    const report = await runEvaluation();
    printEvaluation(report);
    return;
  }

  if (command === 'demo') {
    printHeader();
    printBoard();
    await printCommandCenter();
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
