# Relay Demo Script

## Demo goal
Show that Relay turns raw operational updates into a clear, actionable workflow that remains usable even when connectivity is unstable.

## Flow
1. If AWS credentials are configured, start with `node src/index.js nova-check`.
2. Use that quick proof to say clearly that Amazon Nova is reachable live before the main walkthrough begins.
3. Run `node src/index.js board`.
4. Explain that Relay is not a chat demo: it is an incident command surface showing severity, confidence, blockers, the next checkpoint, and ranked attention across active incidents.
5. Run `node src/index.js command-center`.
6. Call out the AI runtime line first. If Bedrock is configured, point out that the portfolio reasoning is coming from Amazon Nova. If not, note that the demo can still run locally because Relay degrades gracefully.
7. Highlight the portfolio outputs in this order:
   - portfolio summary
   - command posture
   - ranked incident priority order
   - cross-incident risks and resource tensions
   - next command brief
8. Open a live incident with `node src/index.js view inc-001`.
9. Walk judges through the structured timeline and sync-state section.
10. Highlight the incident AI outputs in this order:
   - summary
   - recommended severity, confidence, and evidence status
   - commander intent
   - blockers and information needed next
   - operational impact
   - next actions and next checkpoint
   - command brief
11. Re-open the same incident with a maintenance handoff: `node src/index.js view inc-001 maintenance`.
12. Create a new incident live.
13. Add a follow-up note.
14. Run `node src/index.js refresh <new-incident-id>` to show that Relay stores a fresh command package and can update the incident picture over time.
15. Run `node src/index.js eval`.
16. Show that Relay includes a scenario-based evaluation harness with measurable scoring, which makes the Nova integration look like engineered product infrastructure rather than a prompt demo.
17. If time permits, call out `npm test` as a lightweight smoke check for the parsing and offline command workflow.
18. Return to `node src/index.js command-center` and then `node src/index.js board` to show the refreshed command surface.

## What judges should feel
- This solves a real operational coordination problem.
- Amazon Nova is doing useful decision-support work at both the incident level and the portfolio command level, not decorative text generation.
- The live Nova path has an explicit proof step, so the demo does not rely on trust.
- The product still feels useful when connectivity is inconsistent.
- The workflow supports disciplined command updates and handoffs, not just note-taking.
- This could credibly help utilities, facilities, logistics, campus operations, or field service teams.
