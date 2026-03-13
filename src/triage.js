function scoreIncident(notes) {
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

function buildSummary(incident) {
  const latest = incident.notes[incident.notes.length - 1]?.text || 'No recent updates.';
  return `${incident.title} at ${incident.location}. Current status is ${incident.status} with ${incident.connectivity} connectivity. Latest update: ${latest}`;
}

function suggestNextActions(incident, severity) {
  const shared = [
    'Capture one more structured update for the timeline',
    'Prepare a concise handoff note for the next operator'
  ];

  if (severity === 'high') {
    return [
      'Dispatch field support immediately',
      'Reduce operational load until inspection is completed',
      'Escalate to maintenance lead and attach incident summary',
      ...shared
    ];
  }

  if (severity === 'medium') {
    return [
      'Schedule inspection within the next operational window',
      'Isolate nearby risk points if conditions worsen',
      'Keep monitoring and collect another verification update',
      ...shared
    ];
  }

  return [
    'Continue monitoring with periodic updates',
    'Document closure criteria before resolving the incident',
    ...shared
  ];
}

function buildHandoff(incident, summary, severity, rationale, actions, role = 'supervisor') {
  const roleIntro = {
    supervisor: 'Supervisor handoff',
    field: 'Field operator handoff',
    maintenance: 'Maintenance handoff'
  }[role] || 'Team handoff';

  const tailoredActions = role === 'field'
    ? actions.filter((action) => !/maintenance lead/i.test(action))
    : role === 'maintenance'
      ? actions.filter((action) => !/Prepare a concise handoff/i.test(action))
      : actions;

  return [
    `${roleIntro}`,
    `Incident: ${incident.title}`,
    `Location: ${incident.location}`,
    `Reporter: ${incident.reporter}`,
    `Recommended severity: ${severity}`,
    `Why: ${rationale}`,
    `Summary: ${summary}`,
    'Immediate next actions:',
    ...tailoredActions.map((a) => `- ${a}`)
  ].join('\n');
}

module.exports = {
  classifySeverity: scoreIncident,
  buildSummary,
  suggestNextActions,
  buildHandoff
};
