const { analyzeWithNova, DEFAULT_MODEL_ID, DEFAULT_REGION } = require('./nova');
const { getLatestAnalysis } = require('./incidents');

function severityRank(severity) {
  return { high: 3, medium: 2, low: 1, pending: 0 }[severity] || 0;
}

function confidenceRank(confidence) {
  return { high: 3, medium: 2, low: 1 }[confidence] || 0;
}

function computeAttentionScore(incident) {
  const latest = getLatestAnalysis(incident)?.analysis || {};
  const severity = latest.severity || incident.severity || 'pending';
  const blockers = latest.blockers?.length || 0;
  const informationNeeds = latest.informationNeeds?.length || 0;
  const connectivityPenalty = incident.connectivity === 'online'
    ? 0
    : incident.connectivity === 'intermittent'
      ? 2
      : 3;

  return severityRank(severity) * 10 + blockers * 2 + informationNeeds + connectivityPenalty;
}

function buildPortfolioInput(incidents) {
  return incidents.map((incident) => {
    const latest = getLatestAnalysis(incident)?.analysis || {};
    return {
      id: incident.id,
      title: incident.title,
      location: incident.location,
      status: incident.status,
      connectivity: incident.connectivity,
      updatedAt: incident.updatedAt,
      attentionScore: computeAttentionScore(incident),
      latestAnalysis: latest,
      latestNotes: incident.notes.slice(-3)
    };
  });
}

function buildPortfolioPrompt(incidents) {
  return [
    'You are Relay Command, an operational command-center copilot.',
    'Review the active incident portfolio and return STRICT JSON only.',
    'Your job is to help a duty commander decide where attention goes next across multiple incidents.',
    'JSON schema:',
    '{',
    '  "portfolioSummary": "string",',
    '  "commandPosture": "stable|watch|escalated",',
    '  "priorityOrder": [',
    '    {',
    '      "incidentId": "string",',
    '      "rank": 1,',
    '      "whyNow": "string",',
    '      "commanderAction": "string"',
    '    }',
    '  ],',
    '  "crossIncidentRisks": ["string"],',
    '  "resourceTensions": ["string"],',
    '  "nextCommandBrief": "string"',
    '}',
    'Requirements:',
    '- Ground everything in the provided incidents only.',
    '- Rank all incidents from highest to lowest command attention.',
    '- Use severity, connectivity, evidence quality, blockers, and commander intent together when prioritizing.',
    '- Portfolio summary must be 3 sentences max.',
    '- commandPosture should reflect the whole portfolio, not one incident only.',
    '- crossIncidentRisks and resourceTensions should contain 1 to 3 concrete items when applicable.',
    '- commanderAction should be specific and near-term.',
    '- nextCommandBrief should sound like a real operations update.',
    '',
    'Incident portfolio JSON:',
    JSON.stringify(buildPortfolioInput(incidents), null, 2)
  ].join('\n');
}

function buildFallbackPortfolio(incidents) {
  const ranked = [...incidents]
    .map((incident) => {
      const latest = getLatestAnalysis(incident)?.analysis || {};
      return {
        incident,
        latest,
        attentionScore: computeAttentionScore(incident)
      };
    })
    .sort((a, b) => {
      if (b.attentionScore !== a.attentionScore) {
        return b.attentionScore - a.attentionScore;
      }

      return confidenceRank(b.latest.confidence) - confidenceRank(a.latest.confidence);
    });

  const posture = ranked.some((item) => (item.latest.severity || item.incident.severity) === 'high')
    ? 'escalated'
    : ranked.some((item) => (item.latest.severity || item.incident.severity) === 'medium')
      ? 'watch'
      : 'stable';

  const priorityOrder = ranked.map((item, index) => ({
    incidentId: item.incident.id,
    rank: index + 1,
    whyNow: `${item.incident.title} is ${item.latest.severity || item.incident.severity || 'pending'} severity with ${item.incident.connectivity} connectivity, ${item.latest.evidenceStatus || 'mixed'} evidence, and ${item.latest.blockers?.[0] || 'no major blocker reported'}.`,
    commanderAction: item.latest.commanderIntent || item.latest.nextActions?.[0] || 'Refresh the incident and confirm the next owner.'
  }));

  const crossIncidentRisks = [];
  if (ranked.some((item) => item.incident.connectivity !== 'online')) {
    crossIncidentRisks.push('Degraded connectivity across active incidents can delay shared situational awareness and handoffs.');
  }
  if (ranked.filter((item) => (item.latest.severity || item.incident.severity) === 'high').length > 0) {
    crossIncidentRisks.push('At least one high-severity incident may consume field and maintenance attention faster than updates can be validated.');
  }

  const resourceTensions = [];
  if (ranked.length > 1) {
    resourceTensions.push('Command attention must split between immediate stabilization work and lower-severity verification tasks.');
  }
  if (ranked.some((item) => item.incident.connectivity === 'offline-first' || item.incident.connectivity === 'intermittent')) {
    resourceTensions.push('Teams may need to operate from locally cached briefs before full sync is restored.');
  }

  const top = ranked[0];
  const portfolioSummary = top
    ? `${top.incident.title} currently deserves the highest command attention. The active portfolio mixes operational risk with degraded connectivity, so disciplined refreshes and explicit ownership matter. Relay keeps each incident locally usable while preserving a ranked command picture.`
    : 'No active incidents in the portfolio.';

  return {
    provider: 'local-fallback',
    modelId: 'heuristic-command-center-v1',
    region: 'local',
    analysis: {
      portfolioSummary,
      commandPosture: posture,
      priorityOrder,
      crossIncidentRisks: crossIncidentRisks.slice(0, 3),
      resourceTensions: resourceTensions.slice(0, 3),
      nextCommandBrief: top
        ? `Command brief: portfolio posture is ${posture}. First attention goes to ${top.incident.title} (${top.incident.id}) because it combines ${top.latest.severity || top.incident.severity} severity, ${top.incident.connectivity} connectivity, and ${top.latest.evidenceStatus || 'mixed'} evidence quality. Immediate command intent is ${top.latest.commanderIntent || 'to refresh the incident and keep ownership explicit'}. Secondary incidents remain in view, but ownership and checkpoint discipline must stay explicit.`
        : 'Command brief: no active incidents require action.'
    }
  };
}

async function analyzePortfolio(incidents) {
  const provider = process.env.RELAY_AI_PROVIDER || 'auto';
  const wantsNova = provider === 'amazon-nova' || provider === 'bedrock' || provider === 'auto';

  if (wantsNova) {
    try {
      return await analyzeWithNova({
        kind: 'incident-portfolio',
        prompt: buildPortfolioPrompt(incidents)
      });
    } catch (error) {
      if (provider === 'amazon-nova' || provider === 'bedrock') {
        throw new Error([
          'Amazon Nova portfolio analysis was requested, but Relay could not reach Bedrock successfully.',
          `Model: ${DEFAULT_MODEL_ID}`,
          `Region: ${DEFAULT_REGION}`,
          `Cause: ${error.message}`,
          'Set AWS credentials for Bedrock access, or use RELAY_AI_PROVIDER=auto/local to keep the demo running.'
        ].join('\n'));
      }
    }
  }

  return buildFallbackPortfolio(incidents);
}

function getPortfolioRuntimeLabel(result) {
  if (result.provider === 'amazon-nova') {
    return `Amazon Nova via Bedrock (${result.modelId}, ${result.region})`;
  }

  return `Local fallback (${result.modelId}) — set RELAY_AI_PROVIDER=amazon-nova to use Amazon Nova on AWS`;
}

module.exports = {
  analyzePortfolio,
  getPortfolioRuntimeLabel,
  computeAttentionScore
};
