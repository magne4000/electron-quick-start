const stress = require('./stress').stress;

const cleanExit = function() { process.exit() };
process.on('SIGINT', cleanExit); // catch ctrl-c
process.on('SIGTERM', cleanExit); // catch kill

return stress(parseInt(process.argv[2], 0), parseInt(process.argv[3], 0));
