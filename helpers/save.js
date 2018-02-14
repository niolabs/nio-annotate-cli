const fetch = require('node-fetch');

module.exports = async function save(program, serviceName, service, annotations) {
  const metadata = JSON.parse(service['sys_metadata']);
  const next = {
    ...service,
    'sys_metadata': JSON.stringify({
      ...metadata,
      'd29b0693-de28-5b3e-9753-65b464106540': annotations,
    }),
  };

  const headers = {};
  if (program.auth) {
    headers['Authorization'] = `Basic ${new Buffer(program.auth).toString('base64')}`
  }

  const url = `${program.host}/services/${encodeURIComponent(serviceName)}`

  await fetch(url, { headers, method: 'PUT', body: JSON.stringify(next) })
};
