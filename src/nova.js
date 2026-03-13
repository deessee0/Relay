const DEFAULT_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const DEFAULT_MODEL_ID = process.env.RELAY_NOVA_MODEL_ID || 'us.amazon.nova-lite-v1:0';

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

function extractJsonBlock(text) {
  const match = text.match(/\{[\s\S]*\}$/);
  return match ? match[0] : text;
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

  return {
    provider: 'amazon-nova',
    modelId: DEFAULT_MODEL_ID,
    region: DEFAULT_REGION,
    rawText: text,
    analysis: parsed
  };
}

module.exports = {
  DEFAULT_MODEL_ID,
  DEFAULT_REGION,
  analyzeWithNova
};
