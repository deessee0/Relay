# Relay Architecture

## Goal
Build the strongest possible Amazon Nova AI Hackathon submission around a practical AI incident copilot.

## Product direction
Relay helps teams turn fragmented incident updates into structured operational context. The product is designed to reduce coordination friction by producing:
- concise summaries
- severity recommendations with rationale
- next-step suggestions
- clean handoff drafts

## Core architecture
- Product interface for incident creation, review, and triage
- Incident timeline model with structured updates
- AI reasoning layer powered by Amazon Nova for summary, severity assessment, and next-step generation
- Local product demo flow that feels credible and fast to understand

## MVP user flow
1. User creates or opens an incident.
2. User adds structured observations and coordination notes.
3. Relay produces a concise AI summary.
4. Relay recommends severity with rationale.
5. Relay suggests next actions.
6. Relay generates a handoff draft for another operator or supervisor.

## Submission positioning
### Primary
- Agentic AI

### Secondary
- Best Student App

## Architecture rule
Any implementation detail that does not improve demo clarity, product credibility, or Nova judging value should be deprioritized.
