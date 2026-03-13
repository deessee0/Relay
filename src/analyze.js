const { analyzeWithNova, DEFAULT_MODEL_ID, DEFAULT_REGION } = require('./nova');
const { normalizeAnalysis } = require('./schema');

function classifySeverity(notes) {
  const text = notes.map((n) => n.text.toLowerCase()).join(' ');

  let high = 0;
  let medium = 0;

  if (/(shutdown|auto-recovered|overheat|overheating|abnormal|repeat alarms|load remains elevated)/.test(text)) {
    high += 3;
  }

  if (/(near-miss|near miss|pedestrian|injury|unsafe|blocked sightline|visibility blocked|immediate control actions)/.test(text)) {
    high += 3;
  }

  if (/(risk|equipment failure|critical|dispatch immediately|evacuate|safety)/.test(text)) {
    high += 2;
  }

  if (/(water|moisture|wet|inspection|monitoring|roof seal|temporary isolation)/.test(text)) {
    medium += 2;
  }

  if (/(electrical cabinet|nearby equipment|limited visibility|access constrained)/.test(text)) {
    medium += 1;
  }

  if (high >= 3) {
    return {
      severity: 'high',
      rationale: 'The incident indicates unstable operations or signs of imminent equipment failure, so rapid escalation is justified.'
    };
  }

  if (medium >= 2) {
    return {
      severity: 'medium',
      rationale: 'The issue may worsen if ignored, but current evidence suggests controlled inspection and monitored mitigation are still appropriate.'
    };
  }

  return {
    severity: 'low',
    rationale: 'The current notes suggest limited impact and no strong escalation signal.'
  };
}

function buildFallbackSummary(incident) {
  const latest = incident.notes[incident.notes.length - 1]?.text || 'No recent updates.';
  return `${incident.title} at ${incident.location} remains ${incident.status}. Connectivity is ${incident.connectivity}; latest field signal: ${latest}`;
}

function buildFallbackActions(severity) {
  const shared = [
    'Capture one more timestamped field update to reduce uncertainty',
    'Send the fresh incident brief to the next responsible team',
    'Confirm an owner for the next operational checkpoint'
  ];

  if (severity === 'high') {
    return [
      'Dispatch field support immediately',
      'Reduce operational load until inspection is completed',
      ...shared
    ];
  }

  if (severity === 'medium') {
    return [
      'Schedule inspection in the next operational window',
      'Isolate nearby risk points if conditions worsen',
      ...shared
    ];
  }

  return [
    'Continue monitoring with periodic updates',
    'Document closure criteria before resolving the incident',
    ...shared
  ];
}

function buildFallbackHandoff(role, incident, summary, severity, rationale, nextActions, evidenceStatus, commanderIntent) {
  const roleName = {
    supervisor: 'Supervisor handoff',
    field: 'Field operator handoff',
    maintenance: 'Maintenance handoff'
  }[role] || 'Team handoff';

  return [
    roleName,
    `Incident: ${incident.title}`,
    `Location: ${incident.location}`,
    `Current status: ${incident.status}`,
    `Recommended severity: ${severity}`,
    `Why: ${rationale}`,
    `Evidence status: ${evidenceStatus}`,
    `Commander intent: ${commanderIntent}`,
    `Summary: ${summary}`,
    'Next actions:',
    ...nextActions.map((action) => `- ${action}`)
  ].join('\n');
}

function buildFallbackAnalysis(incident) {
  const triage = classifySeverity(incident.notes);
  const summary = buildFallbackSummary(incident);
  const nextActions = buildFallbackActions(triage.severity);
  const text = incident.notes.map((note) => note.text.toLowerCase()).join(' ');
  const confidence = triage.severity === 'high' ? 'high' : 'medium';
  const evidenceStatus = incident.connectivity === 'offline-first'
    ? 'mixed'
    : /(no active leak visible|no injury reported|requested|sounds abnormal)/.test(text)
      ? 'mixed'
      : 'confirmed';
  const commanderIntent = triage.severity === 'high'
    ? 'Stabilize the asset quickly, verify whether the risk is still active, and keep escalation ownership explicit.'
    : triage.severity === 'medium'
      ? 'Contain the issue, verify whether impact is spreading, and preserve a clean command timeline.'
      : 'Maintain visibility, confirm closure criteria, and avoid unnecessary escalation.';
  const escalationTriggers = triage.severity === 'high'
    ? [
        'Repeated alarms or another automatic shutdown',
        'Evidence of rising load or abnormal cooling behavior',
        'Any new safety exposure for onsite personnel'
      ]
    : triage.severity === 'medium'
      ? [
          'Visible spread of damage or moisture',
          'Loss of containment or worsening environmental conditions'
        ]
      : ['Any sign that impact is spreading beyond the initial report'];
  const informationNeeds = [
    'Latest field verification from the asset owner',
    'Confirmation of whether the condition is stable, improving, or worsening'
  ];
  const blockers = incident.connectivity === 'offline-first' || incident.connectivity === 'intermittent'
    ? ['Unreliable connectivity may delay remote review or attachment upload']
    : ['No major coordination blocker identified from current notes'];

  const uncertaintyLine = evidenceStatus === 'confirmed'
    ? 'Evidence is currently consistent across the available notes.'
    : 'Evidence is still mixed, so field verification and another checkpoint are needed before overcommitting.';

  return {
    provider: 'local-fallback',
    modelId: 'heuristic-triage-v2',
    region: 'local',
    analysis: normalizeAnalysis({
      summary: `${summary} ${uncertaintyLine}`,
      severity: triage.severity,
      severityRationale: triage.rationale,
      confidence,
      evidenceStatus,
      commanderIntent,
      escalationTriggers,
      informationNeeds,
      blockers,
      nextActions,
      nextCheckpoint: triage.severity === 'high'
        ? 'Recheck asset status within 15 minutes or immediately after field inspection begins.'
        : triage.severity === 'medium'
          ? 'Collect a verification update in the next operating window and confirm whether containment is holding.'
          : 'Review the incident again at the next routine checkpoint before closure.',
      commandBrief: `Command brief: ${summary} Priority is ${triage.severity}. Evidence status is ${evidenceStatus}. Immediate focus is ${commanderIntent.toLowerCase()}`,
      handoff: {
        supervisor: buildFallbackHandoff('supervisor', incident, summary, triage.severity, triage.rationale, nextActions, evidenceStatus, commanderIntent),
        field: buildFallbackHandoff('field', incident, summary, triage.severity, triage.rationale, nextActions, evidenceStatus, commanderIntent),
        maintenance: buildFallbackHandoff('maintenance', incident, summary, triage.severity, triage.rationale, nextActions, evidenceStatus, commanderIntent)
      },
      impact: {
        operations: triage.severity === 'high' ? 'Operational continuity is at risk if the issue repeats or escalates.' : 'Operational impact appears manageable but still requires coordination discipline.',
        safety: triage.severity === 'high' ? 'Potential safety exposure exists if unstable equipment remains in service.' : 'No immediate safety emergency is confirmed, but conditions should be rechecked.',
        continuity: incident.connectivity === 'offline-first' || incident.connectivity === 'intermittent'
          ? 'Relay preserves local incident context despite unreliable connectivity.'
          : 'Incident data is available across connected devices.'
      }
    })
  };
}

function createStoredSnapshot(result) {
  return {
    generatedAt: new Date().toISOString(),
    provider: result.provider,
    modelId: result.modelId,
    region: result.region,
    analysis: result.analysis
  };
}

function summarizeChanges(previousSnapshot, nextSnapshot) {
  if (!previousSnapshot) {
    return ['Initial analysis captured.'];
  }

  const previous = previousSnapshot.analysis || {};
  const next = nextSnapshot.analysis || {};
  const changes = [];

  if (previous.severity !== next.severity) {
    changes.push(`Severity changed from ${previous.severity || 'unknown'} to ${next.severity || 'unknown'}.`);
  }

  if (previous.confidence !== next.confidence) {
    changes.push(`Confidence changed from ${previous.confidence || 'unknown'} to ${next.confidence || 'unknown'}.`);
  }

  if (previous.evidenceStatus !== next.evidenceStatus) {
    changes.push(`Evidence status changed from ${previous.evidenceStatus || 'unknown'} to ${next.evidenceStatus || 'unknown'}.`);
  }

  if (previous.commanderIntent !== next.commanderIntent) {
    changes.push('Commander intent changed.');
  }

  if (previous.nextCheckpoint !== next.nextCheckpoint) {
    changes.push('Recommended next checkpoint changed.');
  }

  if (previous.summary !== next.summary) {
    changes.push('Summary updated from the latest timeline.');
  }

  if (!changes.length) {
    changes.push('No major analysis shift detected; latest refresh mainly confirms the current picture.');
  }

  return changes;
}

async function analyzeIncident(incident) {
  const provider = process.env.RELAY_AI_PROVIDER || 'auto';
  const wantsNova = provider === 'amazon-nova' || provider === 'bedrock' || provider === 'auto';

  if (wantsNova) {
    try {
      return await analyzeWithNova(incident);
    } catch (error) {
      if (provider === 'amazon-nova' || provider === 'bedrock') {
        const message = [
          'Amazon Nova analysis was requested, but Relay could not reach Bedrock successfully.',
          `Model: ${DEFAULT_MODEL_ID}`,
          `Region: ${DEFAULT_REGION}`,
          `Cause: ${error.message}`,
          'Set AWS credentials for Bedrock access, or use RELAY_AI_PROVIDER=auto/local to keep the demo running.'
        ].join('\n');

        throw new Error(message);
      }
    }
  }

  return buildFallbackAnalysis(incident);
}

function getAiRuntimeLabel(result) {
  if (result.provider === 'amazon-nova') {
    return `Amazon Nova via Bedrock (${result.modelId}, ${result.region})`;
  }

  return `Local fallback (${result.modelId}) — set RELAY_AI_PROVIDER=amazon-nova to use Amazon Nova on AWS`;
}

module.exports = {
  analyzeIncident,
  getAiRuntimeLabel,
  buildFallbackAnalysis,
  classifySeverity,
  createStoredSnapshot,
  summarizeChanges,
  DEFAULT_MODEL_ID,
  DEFAULT_REGION
};
