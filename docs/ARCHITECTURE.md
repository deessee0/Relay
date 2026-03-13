# Relay Architecture

## Goal
Build the strongest possible Amazon Nova AI Hackathon submission around a practical AI incident copilot.

## Product direction
Relay helps teams turn fragmented incident updates into structured operational context. The product is designed to reduce coordination friction by producing:
- concise summaries
- severity recommendations with rationale
- confidence estimates grounded in evidence quality
- escalation triggers and missing-information requests
- next-step suggestions and the next command checkpoint
- command briefs for leaders
- clean handoff drafts for downstream teams

## Core architecture
- Local-first product interface for incident creation, review, and triage
- Incident timeline model with structured updates stored on device
- Amazon Nova reasoning layer via Amazon Bedrock for:
  - summary generation
  - severity assessment
  - confidence estimation
  - operational impact framing
  - blocker detection
  - escalation trigger extraction
  - command brief generation
  - role-specific handoffs
- Persisted analysis snapshots so the incident command picture evolves over time instead of being stateless text generation
- Portfolio-level command-center reasoning that ranks incidents, exposes cross-incident risks, and recommends the next commander move
- Fallback heuristic layer so the demo remains usable without cloud access
- Sync-state simulation that reinforces the offline-first product value

## Why Nova fits
Relay is strongest when Nova is clearly the reasoning core, not just decorative copy generation.

Amazon Nova is responsible for the high-value decision-support output:
- interpreting fragmented incident updates
- producing concise command-ready summaries
- estimating severity and confidence from incomplete evidence
- identifying what must happen next versus what is still unknown
- translating the same incident into different handoff formats
- preserving uncertainty instead of overclaiming
- prioritizing command attention across competing incidents instead of analyzing each case in isolation

This improves the hackathon score in the most important category, Technical Implementation, because the AI layer is central to the workflow and product outcome.

## MVP user flow
1. User creates or opens an incident.
2. User adds structured observations and coordination notes.
3. Relay sends the current incident state to Amazon Nova.
4. Nova returns a command package with summary, severity, confidence, blockers, information needs, impact framing, next actions, next checkpoint, command brief, and handoff drafts.
5. Relay stores the incident and the generated analysis locally so the operating picture survives connectivity problems and can be refreshed over time.
6. The user can reopen the same incident for different audiences without rebuilding context.
7. Relay synthesizes the active portfolio into a command-center view so a duty commander can prioritize attention across incidents.
8. The user can scan the command board across incidents to decide where attention is needed next.

## Submission positioning
### Primary
- Agentic AI

### Secondary
- Best Student App

## Demo principle
The winning version of Relay should feel like a product solving a painful coordination problem, not a hackathon toy. Anything that weakens clarity, Nova centrality, or real-world credibility should be cut.
