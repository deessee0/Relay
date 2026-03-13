# Relay Demo Script

## Demo goal
Show that Relay turns raw operational updates into a clear, actionable workflow that remains usable even when connectivity is unstable.

## Flow
1. Open Relay and run `node src/index.js list`.
2. Open one incident with `node src/index.js view inc-001`.
3. Point out the structured timeline, AI summary, severity recommendation, and recommended next actions.
4. Show the sync state block to reinforce the offline-first behavior.
5. Re-open the same incident with a maintenance handoff: `node src/index.js view inc-001 maintenance`.
6. Create a new incident live.
7. Add a follow-up note.
8. Re-open the incident to show that the local state persisted and the handoff updated.

## What judges should feel
- This solves a real operational coordination problem.
- AI is reducing delay and ambiguity, not adding novelty theater.
- The product still feels useful when connectivity is inconsistent.
- The workflow supports handoff discipline, not just note-taking.
