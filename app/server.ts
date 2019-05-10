/**
 * Module dependencies.
 */
const cluster = require('cluster');
import normalizePort from "normalize-port";
import app from "./app";
// comment below line to start cluster with maximum workers
const workers = 1;
// uncomment below line to start cluster with maximum workers
// const workers = process.env.WORKERS || require('os').cpus().length;

if (cluster.isMaster) {
  console.log('Master cluster is running on %s with %s workers', process.pid, workers);
  for (var i = 0; i < workers; ++i) {
    var worker = cluster.fork().process;
    console.log('worker %s on %s started', i+1, worker.pid);
  }
  cluster.on('exit', function(worker, code, signal) {
    console.log('worker %s died. restarting...', worker.process.pid);
    cluster.fork();
  });
}

if (cluster.isWorker) {
  const http = require('http');
  const debug = require('debug')('node-express-typescript-project:server');
  const ON_DEATH = require('death');
  /**
   * Get port from environment and store in Express.
   */
  const port = normalizePort(process.env.PORT || '3000');
  app.set('port', port);
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
  server.on('error', (error) => {
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
   ON_DEATH(function(signal, err) {
     console.log('\nServer is going down now...');
     server.close();
     process.exit();
   });
}
