# Relay Architecture

## Goal
Build the strongest possible Amazon Nova AI Hackathon submission around a practical AI incident copilot.

## Product direction
Relay helps teams turn fragmented incident updates into structured operational context. The product is designed to reduce coordination friction by producing:
- concise summaries
- severity recommendations with rationale
- next-step suggestions
- command briefs for leaders
- clean handoff drafts for downstream teams

## Core architecture
- Local-first product interface for incident creation, review, and triage
- Incident timeline model with structured updates stored on device
- Amazon Nova reasoning layer via Amazon Bedrock for:
  - summary generation
  - severity assessment
  - operational impact framing
  - command brief generation
  - role-specific handoffs
- Fallback heuristic layer so the demo remains usable without cloud access
- Sync-state simulation that reinforces the offline-first product value

## Why Nova fits
Relay is strongest when Nova is clearly the reasoning core, not just decorative copy generation.

Amazon Nova is responsible for the high-value decision-support output:
- interpreting fragmented incident updates
- producing concise command-ready summaries
- translating the same incident into different handoff formats
- preserving uncertainty instead of overclaiming

This improves the hackathon score in the most important category, Technical Implementation, because the AI layer is central to the workflow and product outcome.

## MVP user flow
1. User creates or opens an incident.
2. User adds structured observations and coordination notes.
3. Relay sends the current incident state to Amazon Nova.
4. Nova returns a concise summary, severity recommendation, rationale, impact framing, next actions, command brief, and handoff drafts.
5. Relay stores the underlying incident locally and keeps the workflow usable during connectivity degradation.
6. The user can reopen the incident for different audiences without rebuilding context.

## Submission positioning
### Primary
- Agentic AI

### Secondary
- Best Student App

## Demo principle
The winning version of Relay should feel like a product solving a painful coordination problem, not a hackathon toy. Anything that weakens clarity, Nova centrality, or real-world credibility should be cut.
