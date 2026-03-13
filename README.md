# Relay

Relay is a local-first incident copilot for teams that need to capture, triage, and hand off operational issues under pressure, even when connectivity is unreliable.

## Product promise

Relay helps frontline teams turn fragmented updates into a shared operational picture:

- create incidents quickly
- capture structured timeline notes
- generate concise AI summaries
- recommend incident severity with rationale
- surface confidence, evidence status, blockers, escalation triggers, and missing information
- suggest next actions, explicit commander intent, and the next command checkpoint
- produce role-specific handoff drafts
- preserve usability when the network is unstable
- rank command attention across multiple active incidents

## Why this is strong on Amazon Nova

Relay is designed around a practical agentic loop rather than a chatbot gimmick:

1. collect structured field context locally
2. send the current incident state to Amazon Nova on AWS for reasoning
3. return a command package with severity, confidence, evidence status, commander intent, impact framing, blockers, escalation triggers, next actions, and role-specific handoffs
4. synthesize a portfolio-level command view that ranks where a duty commander should focus next across active incidents
5. persist the analysis so teams can track how incident understanding changes over time
6. keep the workflow usable even when the network is unstable by falling back to local persistence and local heuristics

That gives the demo a credible real-world story: Nova is doing the high-value operational reasoning, while Relay handles capture, continuity, execution discipline, and evaluation rigor.

Relay also includes a built-in evaluation harness (`npm run eval`) with realistic incident scenarios so judges can see that the Nova-powered reasoning layer is not just present — it is testable, structured, and measurable.

## Current demo

The current prototype is a runnable local CLI that simulates the core product loop:

1. create an incident locally
2. add timeline notes over time
3. prove Bedrock connectivity with a one-command Nova readiness check when AWS credentials are available
4. analyze the incident with Amazon Nova via Amazon Bedrock
5. fall back to local heuristic triage when Nova is unavailable so the demo is still runnable offline
6. generate a stored command package with summary, severity, confidence, evidence status, commander intent, impact, blockers, missing information, next-step guidance, next checkpoint, command brief, and role-specific handoff
7. show an incident command board so multiple incidents feel like a real operating surface
8. generate a command-center portfolio ranking that surfaces cross-incident risk and where leadership attention goes next
9. run a built-in evaluation harness to show that the triage output is structured, measurable, and benchmarkable across realistic scenarios
10. show a simulated sync state for offline-first workflows

Data is persisted to `data/incidents.json`, so the demo behaves more like a product and less like a static mock.

## Run it

```bash
npm install
npm run demo
```

Useful commands:

```bash
node src/index.js nova-check
node src/index.js list
node src/index.js board
node src/index.js view inc-001
node src/index.js view inc-001 maintenance
node src/index.js refresh inc-001
node src/index.js command-center
node src/index.js analyze inc-001
node src/index.js eval
npm test
node src/index.js create "Pump pressure drop" "West Intake" "Operator S. Kim" intermittent
node src/index.js note inc-pump-pressure-drop-3 observation "Pressure remains unstable after reset."
node src/index.js status inc-pump-pressure-drop-3 monitoring
```

## Use Amazon Nova on AWS

Relay defaults to Amazon Nova automatically when the Bedrock runtime is available.

Example environment:

```bash
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export RELAY_AI_PROVIDER=amazon-nova
export RELAY_NOVA_MODEL_ID=us.amazon.nova-lite-v1:0
node src/index.js nova-check
npm run demo
```

If Nova is not configured, Relay falls back to local heuristic analysis so the product loop still works in an offline demo. If you force `RELAY_AI_PROVIDER=amazon-nova`, Relay will fail loudly with setup guidance instead of silently masking the missing Bedrock configuration.

## What Relay produces

For each incident, Relay generates:

- AI summary
- recommended severity and rationale
- confidence signal and explicit evidence status
- commander intent for the immediate operational objective
- operational impact framing across operations, safety, and continuity
- escalation triggers
- missing information requests
- recommended next actions
- next command checkpoint
- command brief for leadership updates
- role-specific handoff drafts for supervisor, field, and maintenance audiences
- portfolio-level command ranking across multiple incidents
- cross-incident risk and resource-tension visibility
- sync-state visibility for unreliable connectivity scenarios
- stored analysis history for longitudinal command updates
- evaluation scenarios and a scoring harness for measurable triage quality

## Why it matters

Operational teams do not fail because they lack data alone. They fail when critical context arrives late, fragments across people, or becomes unusable offline. Relay is designed to reduce that coordination drag.

## Near-term scope

In scope:

- incident model
- timeline capture
- Amazon Nova reasoning via Bedrock
- one-command Nova readiness proof for live demos
- local fallback analysis for resilience and demos
- severity recommendation
- confidence and blocker detection
- escalation trigger and information-gap extraction
- next-step recommendation
- next checkpoint recommendation
- role-specific handoff
- command brief generation
- stored analysis snapshots
- incident command board
- simulated sync state
- persistent local demo data
- minimal automated smoke tests for the core workflow

Out of scope for now:

- production auth
- image understanding
- voice features
- complex workflow automation
- large-scale backend polish
