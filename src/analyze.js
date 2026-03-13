const { analyzeWithNova, DEFAULT_MODEL_ID, DEFAULT_REGION } = require('./nova');

function classifySeverity(notes) {
  const text = notes.map((n) => n.text.toLowerCase()).join(' ');

  let high = 0;
  let medium = 0;

  if (/(shutdown|auto-recovered|overheat|overheating|abnormal|repeat alarms|load remains elevated)/.test(text)) {
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

function buildFallbackHandoff(role, incident, summary, severity, rationale, nextActions) {
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
    `Summary: ${summary}`,
    'Next actions:',
    ...nextActions.map((action) => `- ${action}`)
  ].join('\n');
}

function buildFallbackAnalysis(incident) {
  const triage = classifySeverity(incident.notes);
  const summary = buildFallbackSummary(incident);
  const nextActions = buildFallbackActions(triage.severity);

  return {
    provider: 'local-fallback',
    modelId: 'heuristic-triage-v1',
    region: 'local',
    analysis: {
      summary,
      severity: triage.severity,
      severityRationale: triage.rationale,
      nextActions,
      commandBrief: `Command brief: ${summary} Priority is ${triage.severity}. Immediate focus is keeping the timeline current and the next response owner explicit.`,
      handoff: {
        supervisor: buildFallbackHandoff('supervisor', incident, summary, triage.severity, triage.rationale, nextActions),
        field: buildFallbackHandoff('field', incident, summary, triage.severity, triage.rationale, nextActions),
        maintenance: buildFallbackHandoff('maintenance', incident, summary, triage.severity, triage.rationale, nextActions)
      },
      impact: {
        operations: triage.severity === 'high' ? 'Operational continuity is at risk if the issue repeats or escalates.' : 'Operational impact appears manageable but still requires coordination discipline.',
        safety: triage.severity === 'high' ? 'Potential safety exposure exists if unstable equipment remains in service.' : 'No immediate safety emergency is confirmed, but conditions should be rechecked.',
        continuity: incident.connectivity === 'offline-first' || incident.connectivity === 'intermittent'
          ? 'Relay preserves local incident context despite unreliable connectivity.'
          : 'Incident data is available across connected devices.'
      }
    }
  };
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
  DEFAULT_MODEL_ID,
  DEFAULT_REGION
};
