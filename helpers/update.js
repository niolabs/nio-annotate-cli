const readline = require('readline-sync');

const positions = ['absolute', 'right', 'below', 'left', 'above'];

module.exports = (serviceConfig, annotation = {}) => {
  const isRelative = readline.question(
    'Position relatively? [y/n] ($<defaultInput>) ',
    {
      defaultInput: annotation.position !== 0 ? 'y' : 'n',
      limit: ['y', 'n', 'yes', 'no'],
    }
  ).match(/^(?:y|yes)/i);

  const blocks = serviceConfig.execution.map(b => b.name).sort();
  const targetIndex = (isRelative) ? readline.keyInSelect(
    blocks,
    "target:",
    { cancel: annotation.target ? `current: ${annotation.target}` : false }
  ) : null;

  const target = (targetIndex === null) ? null :
    (targetIndex === -1) ? annotation.target :
    blocks[targetIndex];

  const positionRaw = (isRelative) ? readline.question(
    'side: ($<defaultInput>) ',
    {
      defaultInput: positions[annotation.position] || 'right',
      limit: ['right', 'below', 'left', 'above']
    },
  ) : 'absolute';
  const position = positions.indexOf(positionRaw);

  const left = readline.questionFloat(
    isRelative ? 'x-offset: ($<defaultInput>) ' : 'x: ($<defaultInput>) ',
    { defaultInput: 0 },
  );

  const top = readline.questionFloat(
    isRelative ? 'y-offset: ($<defaultInput>) ' : 'y: ($<defaultInput>) ',
    { defaultInput: 0 },
  );

  const width = readline.questionFloat(
    'width: ($<defaultInput>) ', {
      defaultInput: annotation.width || 200
    }
  );

  const align = readline.question(
    'align: ($<defaultInput>) ',
    {
      defaultInput: annotation.align || 'left',
      limit: ['left', 'right', 'center'],
    },
  );

  const content = annotation.content || readline.question('content: ');

  return {
    position,
    target,
    left,
    top,
    width,
    align,
    content,
  };
};
