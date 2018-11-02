const child_process = require('child_process');

function blockCpuFor(ms) {
  const now = new Date().getTime();
  console.log('START', now);
  let result = 0;
  while (true) {
    result += Math.random() * Math.random();
    if (new Date().getTime() > now + ms)
      break;
  }
  console.log('END', new Date().getTime());
}

function stress(stressTime, idleTime, newProcess) {
  if (newProcess) {
    console.log('FORKED');
    const c = child_process.fork('./stress.process.js', [stressTime, idleTime]);
    const kill = () => {
      return c.kill();
    };
    process.on('exit', kill);
    return kill;
  }
  if (newProcess === false) console.log('MAIN');
  const i = setInterval(() => {
    blockCpuFor(stressTime);
  }, stressTime + idleTime);
  return () => {
    return clearInterval(i);
  }
}

module.exports = {
  blockCpuFor,
  stress,
};
