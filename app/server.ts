/**
 * Module dependencies.
 */
// A tool to find an open port or domain socket on the machine
import portfinder from "portfinder";
// const cluster = require('cluster');
import cluster from "cluster";
const normalizePort = require("normalize-port");
import { App } from "./app";
// comment below line to start cluster with maximum workers
const workers = 1;
// uncomment below line to start cluster with maximum workers
// const workers = process.env.WORKERS || require('os').cpus().length;
var port = 3000;
var portSpan = 999;

if (cluster.isMaster) {
  portfinder.getPort({
    port: port,    // minimum port number
    stopPort: port + portSpan // maximum port number
  }, function (err, openPort) {
    if (err) throw err;
    port = openPort;
    console.log('Server will start on port ' + port);
    console.log('Master cluster is running on %s with %s workers', process.pid, workers);
    for (var i = 0; i < workers; ++i) {
      var worker = cluster.fork().process;
      console.log('worker %s on %s started', i+1, worker.pid);
    }
    cluster.on('exit', function(worker, code, signal) {
      console.log('worker %s died. restarting...', worker.process.pid);
      cluster.fork();
    });
  });
}

if (cluster.isWorker) {
  const http = require('http');
  const debug = require('debug')('node-express-typescript-project:server');
  const ON_DEATH = require('death');
  const app = new App();
  /**
   * Get port from environment and store in Express.
   */
  port = normalizePort(process.env.PORT || port);
  /**
   * Create HTTP server.
   */
  const server = http.createServer(app);
  /**
   * Listen on provided port, on all network interfaces.
   */
  server.listen(port, () => {
    console.log('Node-Express-TypeScript-Server Started on http://localhost:'+port+'\n');
  });
  /**
   * Event listener for HTTP server "listening" event.
   */
  server.on('listening', () => {
    var addr = server.address();
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    debug('Listening on ' + bind);
  });
  /**
   * Event listener for HTTP server "error" event.
   */
  server.on('error', (error: any) => {
    if (error.syscall !== 'listen') {
      throw error;
    }
    var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  });
  /**
   * Event listener for HTTP server "close" event.
   * It sets the callback on SIGINT, SIGQUIT & SIGTERM.
   */
   ON_DEATH(function(signal: any, err: any) {
     console.log('\nServer is going down now...');
     server.close();
     process.exit();
   });
}
