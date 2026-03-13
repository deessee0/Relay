function buildSyncLog(incident) {
  const mode = incident.connectivity;
  const noteCount = incident.notes.length;

  const events = [
    {
      state: 'local-write',
      detail: `Saved ${noteCount} timeline event${noteCount === 1 ? '' : 's'} on device.`
    }
  ];

  if (mode === 'offline-first') {
    events.push(
      {
        state: 'queued',
        detail: 'Connectivity is degraded; Relay keeps the incident writable locally.'
      },
      {
        state: 'sync-ready',
        detail: 'Changes will merge automatically when a connection becomes available.'
      }
    );
  } else if (mode === 'intermittent') {
    events.push(
      {
        state: 'retrying',
        detail: 'Relay detected unstable network conditions and is retrying the sync stream.'
      },
      {
        state: 'partial-sync',
        detail: 'Metadata can be shared before large attachments or follow-up notes.'
      }
    );
  } else {
    events.push({
      state: 'synced',
      detail: 'Incident is in sync across connected devices.'
    });
  }

  events.push({
    state: 'handoff-safe',
    detail: 'A fresh summary and handoff draft can be generated from the latest local state.'
  });

  return events;
}

module.exports = { buildSyncLog };
