const test = require('node:test');
const assert = require('node:assert/strict');

const { extractJsonBlock } = require('../src/nova');
const { classifySeverity, buildFallbackAnalysis } = require('../src/analyze');

test('extractJsonBlock pulls JSON out of fenced output', () => {
  const raw = [
    'Here is the result:',
    '```json',
    '{"summary":"ok","severity":"low"}',
    '```'
  ].join('\n');

  assert.equal(extractJsonBlock(raw), '{"summary":"ok","severity":"low"}');
});

test('classifySeverity treats near-miss scenarios as high severity', () => {
  const result = classifySeverity([
    { text: 'Forklift near-miss reported in loading area.' },
    { text: 'Supervisor wants immediate control actions.' }
  ]);

  assert.equal(result.severity, 'high');
});

test('fallback analysis includes command-ready fields for offline demo flow', () => {
  const incident = {
    id: 'inc-test-001',
    title: 'Pump pressure drop',
    location: 'West Intake',
    reporter: 'Operator S. Kim',
    status: 'open',
    connectivity: 'intermittent',
    createdAt: '2026-03-13T12:00:00Z',
    updatedAt: '2026-03-13T12:05:00Z',
    notes: [
      { at: '2026-03-13T12:00:00Z', type: 'observation', text: 'Pressure alarm triggered twice.' },
      { at: '2026-03-13T12:05:00Z', type: 'risk', text: 'Pump sounds abnormal and load remains elevated.' }
    ],
    analysisHistory: []
  };

  const result = buildFallbackAnalysis(incident);

  assert.equal(result.provider, 'local-fallback');
  assert.equal(result.analysis.severity, 'high');
  assert.ok(result.analysis.commanderIntent.length > 20);
  assert.ok(result.analysis.nextActions.length >= 3);
  assert.equal(result.analysis.handoff.maintenance.includes('Maintenance handoff'), true);
});
