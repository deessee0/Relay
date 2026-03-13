const REQUIRED_ANALYSIS_FIELDS = [
  'summary',
  'severity',
  'severityRationale',
  'confidence',
  'evidenceStatus',
  'commanderIntent',
  'escalationTriggers',
  'informationNeeds',
  'blockers',
  'nextActions',
  'nextCheckpoint',
  'commandBrief',
  'handoff',
  'impact'
];

function asString(value, fallback = 'n/a') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function asEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function asStringArray(value, { min = 0, max = 5, fallback = [] } = {}) {
  const items = Array.isArray(value)
    ? value.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
    : [];

  if (!items.length && fallback.length) {
    return fallback.slice(0, max);
  }

  return items.slice(0, Math.max(min, max));
}

function normalizeAnalysis(raw) {
  const handoff = raw?.handoff || {};
  const impact = raw?.impact || {};

  return {
    summary: asString(raw?.summary),
    severity: asEnum(raw?.severity, ['low', 'medium', 'high'], 'medium'),
    severityRationale: asString(raw?.severityRationale),
    confidence: asEnum(raw?.confidence, ['low', 'medium', 'high'], 'low'),
    evidenceStatus: asEnum(raw?.evidenceStatus, ['confirmed', 'mixed', 'unverified'], 'mixed'),
    commanderIntent: asString(raw?.commanderIntent, 'Refresh the incident and confirm the next owner.'),
    escalationTriggers: asStringArray(raw?.escalationTriggers, { max: 3 }),
    informationNeeds: asStringArray(raw?.informationNeeds, { max: 3 }),
    blockers: asStringArray(raw?.blockers, { max: 3 }),
    nextActions: asStringArray(raw?.nextActions, { min: 3, max: 5, fallback: ['Confirm the next responsible owner and refresh the incident.'] }),
    nextCheckpoint: asString(raw?.nextCheckpoint),
    commandBrief: asString(raw?.commandBrief),
    handoff: {
      supervisor: asString(handoff.supervisor),
      field: asString(handoff.field),
      maintenance: asString(handoff.maintenance)
    },
    impact: {
      operations: asString(impact.operations),
      safety: asString(impact.safety),
      continuity: asString(impact.continuity)
    }
  };
}

function validateAnalysisShape(raw) {
  const missing = REQUIRED_ANALYSIS_FIELDS.filter((field) => raw == null || raw[field] == null);
  const problems = [];

  if (missing.length) {
    problems.push(`Missing top-level fields: ${missing.join(', ')}`);
  }

  if (!['low', 'medium', 'high'].includes(raw?.severity)) {
    problems.push('severity must be low, medium, or high');
  }

  if (!['low', 'medium', 'high'].includes(raw?.confidence)) {
    problems.push('confidence must be low, medium, or high');
  }

  if (!['confirmed', 'mixed', 'unverified'].includes(raw?.evidenceStatus)) {
    problems.push('evidenceStatus must be confirmed, mixed, or unverified');
  }

  if (typeof raw?.commanderIntent !== 'string' || !raw.commanderIntent.trim()) {
    problems.push('commanderIntent must be a non-empty string');
  }

  if (!Array.isArray(raw?.nextActions) || raw.nextActions.length < 3) {
    problems.push('nextActions must contain at least 3 items');
  }

  if (typeof raw?.handoff !== 'object' || raw.handoff == null) {
    problems.push('handoff must be an object');
  }

  if (typeof raw?.impact !== 'object' || raw.impact == null) {
    problems.push('impact must be an object');
  }

  return {
    ok: problems.length === 0,
    problems
  };
}

module.exports = {
  normalizeAnalysis,
  validateAnalysisShape
};
