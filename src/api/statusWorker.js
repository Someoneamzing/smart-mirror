const si = require('systeminformation')
console.log("Hello from statusFork");
si.observe({
  cpuTemperature: 'main',
  networkInterfaces: '*',
}, 5000, process.send.bind(process))
