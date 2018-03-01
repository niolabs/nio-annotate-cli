const readline = require('readline-sync');

module.exports = (title) => {
  let buffer = "";
  if (title) { console.log(title) }
  let more;
  do {
    const line = readline.prompt({ keepWhitespace: true });
    more = /(\\|  )$/.test(line)
    buffer += line.replace(/(\\|  )$/, '\n');
  } while (more);
  return buffer;
}
