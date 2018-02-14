const program = require('commander');
const fetch = require('node-fetch');
const readline = require('readline-sync');
const truncate = require('cli-truncate');
const { readFileSync } = require('fs');
const chalk = require('chalk');
const endOfLine = require('os').EOL;
const wrap = require('word-wrap');

const save = require('./helpers/save');
const update = require('./helpers/update');

const annotationsKey = 'd29b0693-de28-5b3e-9753-65b464106540';
const sysMetadataKey = 'sys_metadata';

const format = list => (
  list.map((item, idx) => ([
    chalk`{green ${idx}:}`,
    chalk`{dim position:} ${['absolute', 'right', 'below', 'left', 'above'][item.position] || 'unknown'}`,
    item.position === 0 ? null : chalk`{dim target:} ${item.target}`,
    chalk`{dim position:} [${item.left}px, ${item.top}px]`,
    chalk`{dim width:} ${item.width}px`,
    chalk`{dim align:} ${item.align}`,
    chalk`{dim content:}${endOfLine}${wrap(item.content)}`,
    chalk`{dim ------------------------}`,
  ].filter(x => x).join(endOfLine))).join(endOfLine)
);

const isOk = (r) => {
  if (r.status < 200 || r.status >= 300) { throw new Error(r.statusText); }
  return r;
}

program.version('0.0.1')
  .description("A CLI tool for managing nio service annotations")
  .option('-a, --auth <basic>', 'auth', 'Admin:Admin')
  .option('-h, --host <host>', 'nio host', 'http://127.0.0.1:8181')
  .option('-v, --verbose');

async function chooseService(program) {
  const headers = {};
  if (program.auth) {
    headers['Authorization'] = `Basic ${new Buffer(program.auth).toString('base64')}`
  }
  const url = `${program.host}/services`;
  const services = await fetch(url, { headers }).then(isOk).then(r => r.json());
  const options = Object.keys(services).filter(n => n !== '__instance_metadata__').sort();
  const selection = readline.keyInSelect(options, "service: ", { cancel: chalk.red.dim("[CANCEL]") });
  if (selection === -1) { process.exit(-1); }
  return options[selection];
}

const preview = ({content}) => truncate(`“${content.split('\n', 1)}”`, 40);

function chooseIndex(annotations) {
  if (annotations.length === 0) {
    readline.keyInPause('\nThis service no annotations. exiting...');
    process.exit(-1);
  }

  const options = annotations.map(preview);
  const selection = readline.keyInSelect(options, "annotation: ", { cancel: chalk.red.dim("[CANCEL]") });
  if (selection === -1) { process.exit(-1); }
  return selection;
}

program
  .command('list')
  .alias('ls')
  .description('list service annoations')
  .option('-s, --service <service>', 'service name')
  .option('--json', 'output as json')
  .action(async (options) => {
    try {
      const service = await (options.service || chooseService(program));

      const headers = {};
      if (program.auth) {
        headers['Authorization'] = `Basic ${new Buffer(program.auth).toString('base64')}`
      }

      const url = `${program.host}/services/${encodeURIComponent(service)}`
      const s = await fetch(url, { headers }).then(isOk).then(r => r.json());
      const annotations = JSON.parse(s[sysMetadataKey])[annotationsKey] || [];
      const output = options.json ? JSON.stringify(annotations) : `\n${format(annotations)}\n`;
      console.log(output);
    } catch(ex) {
      console.error("An error has occured...");
      if (program.verbose) { console.error(ex); }
      process.exit(-1);
    }
  });

program
  .command('add')
  .description('add a new annotation')
  .option('-s, --service <service>', 'service name')
  .action(async (options) => {
    try {
      const service = await (options.service || chooseService(program));

      const headers = {};
      if (program.auth) {
        headers['Authorization'] = `Basic ${new Buffer(program.auth).toString('base64')}`
      }

      const url = `${program.host}/services/${encodeURIComponent(service)}`
      const serviceConfig = await fetch(url, { headers }).then(isOk).then(r => r.json());
      const metadata = JSON.parse(serviceConfig[sysMetadataKey]);
      const annotations = metadata[annotationsKey] || [];

      const updated = update(serviceConfig, {});
      const total = annotations.push(updated);
      console.log('\nupdating...');
      await save(program, service, serviceConfig, annotations);
      console.log('done...\n');

      console.log(`added annotation at: ${total - 1}`)

    } catch(ex) {
      console.error("An error has occured...");
      if (program.verbose) { console.error(ex); }
      process.exit(-1);
    }
  });

program
  .command('update')
  .description('update an annotation meta')
  .option('-s, --service <service>', 'service name')
  .option('-i, --index <index>', 'annotation index', i => parseInt(i, 10), -1)
  .action(async (options) => {
    try {
      const service = await (options.service || chooseService(program));

      const headers = {};
      if (program.auth) {
        headers['Authorization'] = `Basic ${new Buffer(program.auth).toString('base64')}`
      }

      const url = `${program.host}/services/${encodeURIComponent(service)}`

      const serviceConfig = await fetch(url, { headers }).then(isOk).then(r => r.json());
      const metadata = JSON.parse(serviceConfig[sysMetadataKey]);
      const annotations = metadata[annotationsKey] || [];

      const index = (options.index !== -1) ?  options.index : chooseIndex(annotations);

      const updated = update(serviceConfig, annotations[index]);
      annotations.splice(index, 1, updated);

      console.log('\nupdating...');
      await save(program, service, serviceConfig, annotations);
      console.log('done...\n');
    } catch(ex) {
      console.error("An error has occured...");
      if (program.verbose) { console.error(ex); }
      process.exit(-1);
    }
  });

program
  .command('set-content <file>')
  .alias('set')
  .description('set an annotation content')
  .option('-s, --service <service>', 'service name')
  .option('-i, --index <index>', 'annotation index', i => parseInt(i, 10), -1)
  .action(async (file, options) => {
    try {
      const content = readFileSync(file, { encoding: 'utf8'});

      const service = await (options.service || chooseService(program));

      const headers = {};
      if (program.auth) {
        headers['Authorization'] = `Basic ${new Buffer(program.auth).toString('base64')}`
      }

      const url = `${program.host}/services/${encodeURIComponent(service)}`

      const serviceConfig = await fetch(url, { headers }).then(isOk).then(r => r.json());
      const metadata = JSON.parse(serviceConfig[sysMetadataKey]);
      const annotations = metadata[annotationsKey] || [];

      const index = (options.index !== -1) ?  options.index : chooseIndex(annotations);

      const updated = {
        ...annotations[index],
        content,
      };

      annotations.splice(index, 1, updated);

      console.log('\nupdating...');
      await save(program, service, serviceConfig, annotations);
      console.log('done...\n');
    } catch(ex) {
      console.error("An error has occured...");
      if (program.verbose) { console.error(ex); }
      process.exit(-1);
    }
  });


program
  .command('show')
  .description('show a single annotation')
  .alias('cat')
  .option('-s, --service <service>', 'service name')
  .option('-i, --index <index>', 'annotation index', i => parseInt(i, 10), -1)
  .option('--content-only', 'show content only', false)
  .option('--json', 'output as json')
  .action(async (options) => {
    try {
      const service = await (options.service || chooseService(program));

      const headers = {};
      if (program.auth) {
        headers['Authorization'] = `Basic ${new Buffer(program.auth).toString('base64')}`
      }

      const url = `${program.host}/services/${encodeURIComponent(service)}`

      const serviceConfig = await fetch(url, { headers }).then(isOk).then(r => r.json());
      const metadata = JSON.parse(serviceConfig[sysMetadataKey]);
      const annotations = metadata[annotationsKey] || [];

      const index = (options.index !== -1) ?  options.index : chooseIndex(annotations);
      const annotation = annotations[index];
      if (options.contentOnly) {
        console.log(options.json ? JSON.stringify(annotation.content) : annotation.content);
      } else {
        console.log(options.json ? JSON.stringify(annotation) : format([annotation]));
      }
    } catch(ex) {
      console.error("An error has occured...");
      if (program.verbose) { console.error(ex); }
      process.exit(-1);
    }
  });

program
  .command('delete')
  .alias('rm')
  .description('remove an annotation')
  .option('-s, --service <service>', 'service name')
  .option('-i, --index <index>', 'index to remove', i => parseInt(i, 10), -1)
  .action(async (options) => {
    try {
      const service = await (options.service || chooseService(program));

      const headers = {};
      if (program.auth) {
        headers['Authorization'] = `Basic ${new Buffer(program.auth).toString('base64')}`
      }

      const url = `${program.host}/services/${encodeURIComponent(service)}`
      const serviceConfig = await fetch(url, { headers }).then(isOk).then(r => r.json());
      const metadata = JSON.parse(serviceConfig[sysMetadataKey]);
      const annotations = metadata[annotationsKey] || [];

      const index = (options.index !== -1) ?  options.index : chooseIndex(annotations);

      annotations.splice(options.index, 1);

      console.log('\nupdating...');
      await save(program, service, serviceConfig, annotations)
      console.log('done...\n');
    } catch (ex) {
      console.error("An error has occured...");
      if (program.verbose) { console.error(ex); }
      process.exit(-1);
    }
  });

program
  .command('clear')
  .description('clear all annotations')
  .option('-s, --service <service>', 'service name')
  .action(async (options) => {
    try {
      const service = await (options.service || chooseService(program));

      const headers = {};
      if (program.auth) {
        headers['Authorization'] = `Basic ${new Buffer(program.auth).toString('base64')}`
      }

      const url = `${program.host}/services/${encodeURIComponent(service)}`
      const serviceConfig = await fetch(url, { headers }).then(isOk).then(r => r.json());
      const emptyAnnotations = [];

      console.log('\nupdating...');
      await save(program, service, serviceConfig, emptyAnnotations)
      console.log('done...\n');
    } catch (ex) {
      console.error("An error has occured...");
      if (program.verbose) { console.error(ex); }
      process.exit(-1);
    }
  });

program.parse(process.argv);
if (!program.args.length) program.help();
