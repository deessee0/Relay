const fs = require('fs');
const path = require('path');
const { analyzeIncident } = require('./analyze');

const EVAL_PATH = path.join(__dirname, '..', 'data', 'eval-scenarios.json');

function loadScenarios() {
  return JSON.parse(fs.readFileSync(EVAL_PATH, 'utf8'));
}

function scoreScenario(result, scenario) {
  const analysis = result.analysis || {};
  const expected = scenario.expectations || {};
  const haystack = [
    analysis.summary,
    analysis.severityRationale,
    analysis.commandBrief,
    ...(analysis.nextActions || []),
    ...(analysis.escalationTriggers || []),
    ...(analysis.informationNeeds || []),
    ...(analysis.blockers || [])
  ].join(' ').toLowerCase();

  const keywordHits = (expected.keywords || []).filter((keyword) => haystack.includes(String(keyword).toLowerCase()));
  const uncertaintyMentions = /(uncertain|uncertainty|incomplete|pending|unverified|not yet confirmed)/.test(haystack);
  const severityCorrect = analysis.severity === expected.severity;
  const actionCountGood = (analysis.nextActions || []).length >= 3;

  const checks = {
    severityCorrect,
    actionCountGood,
    keywordCoverage: `${keywordHits.length}/${(expected.keywords || []).length}`,
    uncertaintyHandled: expected.mustMentionUncertainty ? uncertaintyMentions : true
  };

  let score = 0;
  if (severityCorrect) score += 50;
  score += Math.round((keywordHits.length / Math.max((expected.keywords || []).length, 1)) * 30);
  if (checks.uncertaintyHandled) score += 10;
  if (actionCountGood) score += 10;

  return {
    scenarioId: scenario.id,
    title: scenario.title,
    provider: result.provider,
    modelId: result.modelId,
    severity: analysis.severity,
    expectedSeverity: expected.severity,
    checks,
    score,
    summary: analysis.summary
  };
}

async function runEvaluation() {
  const scenarios = loadScenarios();
  const results = [];

  for (const scenario of scenarios) {
    const incident = {
      id: scenario.id,
      title: scenario.title,
      location: scenario.location,
      reporter: scenario.reporter,
      status: scenario.status,
      connectivity: scenario.connectivity,
      createdAt: scenario.notes[0]?.at || new Date().toISOString(),
      updatedAt: scenario.notes[scenario.notes.length - 1]?.at || new Date().toISOString(),
      notes: scenario.notes,
      analysisHistory: []
    };

    const result = await analyzeIncident(incident);
    results.push(scoreScenario(result, scenario));
  }

  const averageScore = results.length
    ? Math.round(results.reduce((sum, item) => sum + item.score, 0) / results.length)
    : 0;

  return {
    runAt: new Date().toISOString(),
    provider: process.env.RELAY_AI_PROVIDER || 'auto',
    scenarioCount: results.length,
    averageScore,
    results
  };
}

module.exports = {
  runEvaluation
};
