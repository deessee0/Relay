const { normalizeAnalysis, validateAnalysisShape } = require('./schema');

const DEFAULT_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const DEFAULT_MODEL_ID = process.env.RELAY_NOVA_MODEL_ID || 'us.amazon.nova-lite-v1:0';

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

function extractBalancedJsonObject(text) {
  const start = text.indexOf('{');
  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === '{') {
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return null;
}

function extractJsonBlock(text) {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    const fencedJson = extractBalancedJsonObject(fencedMatch[1].trim());
    if (fencedJson) {
      return fencedJson;
    }
  }

  return extractBalancedJsonObject(text) || text;
}

async function getBedrockClient() {
  const sdk = require('@aws-sdk/client-bedrock-runtime');
  return new sdk.BedrockRuntimeClient({ region: DEFAULT_REGION });
}

function buildPrompt(incident) {
  return [
    'You are Relay, an operational incident copilot for frontline teams.',
    'Analyze the incident and return STRICT JSON only.',
    'Your job is to create an enterprise-grade triage output that is concise, practical, and safe.',
    'The JSON schema is:',
    '{',
    '  "summary": "string",',
    '  "severity": "low|medium|high",',
    '  "severityRationale": "string",',
    '  "confidence": "low|medium|high",',
    '  "evidenceStatus": "confirmed|mixed|unverified",',
    '  "commanderIntent": "string",',
    '  "escalationTriggers": ["string", "..."],',
    '  "informationNeeds": ["string", "..."],',
    '  "blockers": ["string", "..."],',
    '  "nextActions": ["string", "..."],',
    '  "nextCheckpoint": "string",',
    '  "commandBrief": "string",',
    '  "handoff": {',
    '    "supervisor": "string",',
    '    "field": "string",',
    '    "maintenance": "string"',
    '  },',
    '  "impact": {',
    '    "operations": "string",',
    '    "safety": "string",',
    '    "continuity": "string"',
    '  }',
    '}',
    'Requirements:',
    '- Use only facts grounded in the incident data.',
    '- Keep summary to 2 sentences max.',
    '- Provide 3 to 5 next actions.',
    '- Provide 1 to 3 escalationTriggers, informationNeeds, and blockers when applicable.',
    '- Set confidence based on evidence quality, not optimism.',
    '- Set evidenceStatus to confirmed, mixed, or unverified based on how solid the incident evidence is.',
    '- commanderIntent must be one sentence describing the immediate command objective.',
    '- Make nextCheckpoint concrete and time-oriented.',
    '- Make commandBrief sound like a shift commander update.',
    '- Tailor each handoff to its audience.',
    '- Mention uncertainty when evidence is incomplete.',
    '',
    'Incident JSON:',
    JSON.stringify(incident, null, 2)
  ].join('\n');
}

async function analyzeWithNova(input) {
  const client = await getBedrockClient();
  const { ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');
  const prompt = typeof input?.prompt === 'string' ? input.prompt : buildPrompt(input);
  const command = new ConverseCommand({
    modelId: DEFAULT_MODEL_ID,
    messages: [
      {
        role: 'user',
        content: [{ text: prompt }]
      }
    ],
    inferenceConfig: {
      maxTokens: 1200,
      temperature: 0.2,
      topP: 0.9
    }
  });

  const response = await client.send(command);
  const text = response.output?.message?.content
    ?.filter((item) => item.text)
    .map((item) => item.text)
    .join('\n') || '';

  const parsed = safeJsonParse(extractJsonBlock(text));
  if (!parsed) {
    throw new Error(`Amazon Nova returned non-JSON output: ${text}`);
  }

  const validation = validateAnalysisShape(parsed);

  return {
    provider: 'amazon-nova',
    modelId: DEFAULT_MODEL_ID,
    region: DEFAULT_REGION,
    rawText: text,
    validation,
    analysis: normalizeAnalysis(parsed)
  };
}

async function probeNova() {
  const result = await analyzeWithNova({
    kind: 'nova-probe',
    prompt: [
      'Return STRICT JSON only.',
      '{',
      '  "summary": "Nova connectivity verified for Relay.",',
      '  "severity": "low",',
      '  "severityRationale": "This is a connectivity probe, not a live incident.",',
      '  "confidence": "high",',
      '  "evidenceStatus": "confirmed",',
      '  "commanderIntent": "Confirm that Bedrock and Amazon Nova are reachable for the live demo.",',
      '  "escalationTriggers": ["No escalation needed"],',
      '  "informationNeeds": ["None"],',
      '  "blockers": ["None"],',
      '  "nextActions": ["Proceed with the live incident demo", "Call out the Amazon Nova runtime line", "Run Relay evaluation if time allows"],',
      '  "nextCheckpoint": "Ready now.",',
      '  "commandBrief": "Relay probe succeeded. Amazon Nova is reachable and ready for the demo.",',
      '  "handoff": {',
      '    "supervisor": "Nova probe succeeded. Bedrock is reachable.",',
      '    "field": "Nova probe succeeded. No field action needed.",',
      '    "maintenance": "Nova probe succeeded. No maintenance action needed."',
      '  },',
      '  "impact": {',
      '    "operations": "Demo readiness confirmed.",',
      '    "safety": "No safety impact.",',
      '    "continuity": "Live Amazon Nova path is available."',
      '  }',
      '}',
      'Do not add commentary outside the JSON object.'
    ].join('\n')
  });

  return {
    checkedAt: new Date().toISOString(),
    provider: result.provider,
    modelId: result.modelId,
    region: result.region,
    validation: result.validation,
    analysis: result.analysis
  };
}

module.exports = {
  DEFAULT_MODEL_ID,
  DEFAULT_REGION,
  analyzeWithNova,
  extractJsonBlock,
  probeNova
};
