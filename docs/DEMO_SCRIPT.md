# Relay Demo Script

## Demo goal
Show that Relay turns raw operational updates into a clear, actionable workflow that remains usable even when connectivity is unstable.

## Flow
1. If AWS credentials are configured, start with `node src/index.js nova-check`.
2. Use that quick proof to say clearly that Amazon Nova is reachable live before the main walkthrough begins.
3. Run `node src/index.js board`.
4. Call out the new `Nova proof:` line first so judges can see the last successful live verification is persisted inside the product, not just flashed once in the terminal, and that the proof is still fresh.
5. Explain that Relay is not a chat demo: it is an incident command surface showing severity, confidence, blockers, the next checkpoint, and ranked attention across active incidents.
6. Run `node src/index.js command-center`.
7. Call out the AI runtime line first. If Bedrock is configured, point out that the portfolio reasoning is coming from Amazon Nova. If not, note that the demo can still run locally because Relay degrades gracefully.
8. Highlight the portfolio outputs in this order:
   - portfolio summary
   - command posture
   - ranked incident priority order
   - cross-incident risks and resource tensions
   - next command brief
9. Open a live incident with `node src/index.js view inc-001`.
10. Walk judges through the structured timeline and sync-state section.
11. Highlight the incident AI outputs in this order:
   - summary
   - recommended severity, confidence, and evidence status
   - stored command-package source so judges can see whether the current incident package came from Amazon Nova or local fallback
   - commander intent
   - blockers and information needed next
   - operational impact
   - next actions and next checkpoint
   - command brief
12. Re-open the same incident with a maintenance handoff: `node src/index.js view inc-001 maintenance`.
13. Create a new incident live.
14. Add a follow-up note.
15. Run `node src/index.js refresh <new-incident-id>` to show that Relay stores a fresh command package and can update the incident picture over time.
16. Run `node src/index.js eval`.
17. Show that Relay includes a scenario-based evaluation harness with measurable scoring, which makes the Nova integration look like engineered product infrastructure rather than a prompt demo.
18. If time permits, call out `npm test` as a lightweight smoke check for the parsing and offline command workflow.
19. Return to `node src/index.js command-center` and then `node src/index.js board` to show the refreshed command surface.

## What judges should feel
- This solves a real operational coordination problem.
- Amazon Nova is doing useful decision-support work at both the incident level and the portfolio command level, not decorative text generation.
- The live Nova path has an explicit proof step, so the demo does not rely on trust.
- The product still feels useful when connectivity is inconsistent.
- The workflow supports disciplined command updates and handoffs, not just note-taking.
- This could credibly help utilities, facilities, logistics, campus operations, or field service teams.
