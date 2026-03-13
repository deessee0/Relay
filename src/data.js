const { listIncidents } = require('./incidents');

module.exports = {
  incidents: listIncidents()
};
