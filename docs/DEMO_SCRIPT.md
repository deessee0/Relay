# Relay Demo Script

## Demo goal
Show that Relay turns raw operational updates into a clear, actionable workflow that remains usable even when connectivity is unstable.

## Flow
1. Start with `node src/index.js list`.
2. Open a live incident with `node src/index.js view inc-001`.
3. Call out the AI runtime line first. If Bedrock is configured, point out that the reasoning output is coming from Amazon Nova. If not, note that the demo can still run locally because Relay degrades gracefully.
4. Walk judges through the structured timeline and sync-state section.
5. Highlight the AI outputs in this order:
   - summary
   - recommended severity and rationale
   - operational impact
   - next actions
   - command brief
6. Re-open the same incident with a maintenance handoff: `node src/index.js view inc-001 maintenance`.
7. Create a new incident live.
8. Add a follow-up note.
9. Re-open the incident to show that local state persisted and the AI analysis updates from the latest timeline.

## What judges should feel
- This solves a real operational coordination problem.
- Amazon Nova is doing useful decision-support work, not decorative text generation.
- The product still feels useful when connectivity is inconsistent.
- The workflow supports handoff discipline, not just note-taking.
- This could credibly help utilities, facilities, logistics, campus operations, or field service teams.
