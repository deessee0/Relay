# Relay Demo Script

## Demo goal
Show that Relay turns raw operational updates into a clear, actionable workflow that remains usable even when connectivity is unstable.

## Flow
1. Start with `node src/index.js board`.
2. Explain that Relay is not a chat demo: it is an incident command surface showing severity, confidence, blockers, and the next checkpoint across active incidents.
3. Open a live incident with `node src/index.js view inc-001`.
4. Call out the AI runtime line first. If Bedrock is configured, point out that the reasoning output is coming from Amazon Nova. If not, note that the demo can still run locally because Relay degrades gracefully.
5. Walk judges through the structured timeline and sync-state section.
6. Highlight the AI outputs in this order:
   - summary
   - recommended severity and confidence
   - blockers and information needed next
   - operational impact
   - next actions and next checkpoint
   - command brief
7. Re-open the same incident with a maintenance handoff: `node src/index.js view inc-001 maintenance`.
8. Create a new incident live.
9. Add a follow-up note.
10. Run `node src/index.js refresh <new-incident-id>` to show that Relay stores a fresh command package and can update the incident picture over time.
11. Return to `node src/index.js board` to show the refreshed command surface.

## What judges should feel
- This solves a real operational coordination problem.
- Amazon Nova is doing useful decision-support work, not decorative text generation.
- The product still feels useful when connectivity is inconsistent.
- The workflow supports disciplined command updates and handoffs, not just note-taking.
- This could credibly help utilities, facilities, logistics, campus operations, or field service teams.
