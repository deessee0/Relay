# Relay Architecture

## Goal
Build one project that can be submitted to both Amazon Nova AI Hackathon and PowerSync AI Hackathon.

## Core architecture
- Frontend UI for incident creation and timeline review
- Local-first client state and local storage model
- Sync layer powered by PowerSync Sync Streams
- Backend database for shared incident state
- Amazon Nova powered reasoning for summary, severity estimation, and next-step suggestions

## MVP user flow
1. User creates an incident locally.
2. User adds structured notes and observations.
3. AI generates a concise summary.
4. AI suggests severity and next actions.
5. State synchronizes across sessions/devices when connectivity is available.

## Submission positioning
### Amazon Nova
- Agentic AI / Best Student App
- real-world operational decision support

### PowerSync
- meaningful use of PowerSync
- meaningful use of Sync Streams
- local-first and offline-capable workflow
