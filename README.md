# Relay

Relay is a local-first incident copilot for teams that need to capture, triage, and hand off operational issues under pressure, even when connectivity is unreliable.

## Product promise

Relay helps frontline teams turn fragmented updates into a shared operational picture:

- create incidents quickly
- capture structured timeline notes
- generate concise AI summaries
- recommend incident severity with rationale
- suggest next actions
- prepare role-specific handoff drafts
- preserve usability when the network is unstable

## Current demo

The current prototype is a runnable local CLI that simulates the core product loop:

1. create an incident locally
2. add timeline notes over time
3. assess severity from the latest facts
4. generate a summary and next-step guidance
5. produce a handoff draft for supervisors, field operators, or maintenance
6. show a simulated sync state for offline-first workflows

Data is persisted to `data/incidents.json`, so the demo behaves more like a product and less like a static mock.

## Run it

```bash
npm run demo
```

Useful commands:

```bash
node src/index.js list
node src/index.js view inc-001
node src/index.js view inc-001 maintenance
node src/index.js create "Pump pressure drop" "West Intake" "Operator S. Kim" intermittent
node src/index.js note inc-pump-pressure-drop-3 observation "Pressure remains unstable after reset."
node src/index.js status inc-pump-pressure-drop-3 monitoring
```

## Why it matters

Operational teams do not fail because they lack data alone. They fail when critical context arrives late, fragments across people, or becomes unusable offline. Relay is designed to reduce that coordination drag.

## Near-term scope

In scope:

- incident model
- timeline capture
- AI summary
- severity recommendation
- next-step recommendation
- role-specific handoff
- simulated sync state
- persistent local demo data

Out of scope for now:

- production auth
- image understanding
- voice features
- complex workflow automation
- large-scale backend polish
