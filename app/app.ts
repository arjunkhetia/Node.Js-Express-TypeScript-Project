import toobusy from "node-toobusy";
import express from "express";
import path from "path";
import favicon from "serve-favicon";
import logger from "morgan";
import loggerutil from "../utilities/logger";
import datalogger from "../utilities/datalogger";
import fs from "fs";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import hbs from "express-handlebars";
import rfs from "rotating-file-stream";
import helmet from "helmet";
import compression from "compression";

// Defining routes
import { Routes } from "../routes";

class App {

    public app: express.Application;
    public router: Routes = new Routes();
    public rootDirectory = __dirname.substring(0, __dirname.length-4);
    public logDirectory;
    public accessLogStream;

    constructor() {
      // Generating an express app
      this.app = express();
      this.config();
    }

    private config(): void{
      // Express Status Monitor for monitoring server status
      this.app.use(require('express-status-monitor')({
        title: 'Server Status',
        path: '/status',
        // websocket: existingSocketIoInstance,
        spans: [{
          interval: 1,
          retention: 60
        }, {
          interval: 5,
          retention: 60
        }, {
          interval: 15,
          retention: 60
        }],
        chartVisibility: {
          cpu: true,
          mem: true,
          load: true,
          responseTime: true,
          rps: true,
          statusCodes: true
        },
        healthChecks: [{
          protocol: 'http',
          host: 'localhost',
          path: '/',
          port: '3000'
        }]
      }));

      // compress all responses
      this.app.use(compression());

      // middleware which blocks requests when server is too busy
      this.app.use(function(req, res, next) {
        if (toobusy()) {
          res.status(503);
          res.send("Server is busy right now, sorry.");
        } else {
          next();
        }
      });

      // Linking log folder and ensure directory exists
      this.logDirectory = path.join(this.rootDirectory, '/log');
      fs.existsSync(this.logDirectory) || fs.mkdirSync(this.logDirectory);
      fs.appendFile('./log/ServerData.log', '', function (err) {
        if (err) throw err;
      });

      // view engine setup - Express-Handlebars
      this.app.engine('hbs', hbs({
          extname: 'hbs',
          defaultLayout: 'layout',
          layoutsDir: this.rootDirectory + '/views/'
      }));
      this.app.set('views', path.join(this.rootDirectory, '/views'));
      this.app.set('view engine', 'hbs');

      // Create a rotating write stream
      this.accessLogStream = rfs('Server.log', {
          interval: '1d', // rotate daily
          path: this.logDirectory
      });

      // Generating date and time for logger
      logger.token('datetime', function displayTime() {
          return new Date().toString();
      });

      // defining mode of logging
      this.app.use(logger('dev'));
      this.app.use(logger(':remote-addr :remote-user :datetime :req[header] :method :url HTTP/:http-version :status :res[content-length] :res[header] :response-time[digits] :referrer :user-agent', {
          stream: this.accessLogStream
      }));

      // uncomment to redirect global console object to log file
      // datalogger.logfile();

      // Allowing access headers and requests
      this.app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "HEAD, OPTIONS, GET, POST, PUT, PATCH, DELETE, CONNECT");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        next();
      });

      // Helmet helps for securing Express apps by setting various HTTP headers
      this.app.use(helmet());

      this.app.use(bodyParser.json());
      this.app.use(bodyParser.urlencoded({ extended: true }));
      this.app.use(cookieParser());
      this.app.use(express.static(path.join(this.rootDirectory, 'public')));

      this.app.use(favicon(path.join(this.rootDirectory, 'public', 'ficon.ico')));

      // Linking routes
      this.router.routes(this.app);

      // catch 404 and forward to error handler
      this.app.use(function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
      });

      // error handler
      this.app.use(function(err, req, res, next) {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        res.status(err.status || 500);
        // uncomment to just send error as JSON
        res.send({"message":"404 Page Not Found..!"});
        // uncomment to render the error page
        // res.render('error');
      });

      // globally catching unhandled promise rejections
      process.once('unhandledRejection', (reason, promise) => {
         console.error('Unhandled Rejection at promise '+promise+' reason ', reason);
         console.log('Server is still running...\n');
      });

      // globally catching unhandled exceptions
      process.once('uncaughtException', (error) => {
         console.error('Uncaught Exception is thrown with ',error+'\n');
         console.log('Server is still running...\n');
      });
    }

}

export default new App().app;
