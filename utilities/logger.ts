import winston from "winston";

export class LoggerUtil {

  public logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.colorize({
          all: true
      }),
      winston.format.printf(
          data => `${data.level} : ${data.message}`
      )
    ),
    transports: [
      new winston.transports.Console({
        level: 'silly'
      }),
      new winston.transports.File({
        level: 'silly',
        filename: './log/ServerData.log'
      })
    ]
  });

  public silly(message: any) {
    this.logger.log('silly', message);
  }

  public debug(message: any) {
    this.logger.log('debug', message);
  }

  public verbose(message: any) {
    this.logger.log('verbose', message);
  }

  public info(message: any) {
    this.logger.log('info', message);
  }

  public warn(message: any) {
    this.logger.log('warn', message);
  }

  public error(message: any) {
    this.logger.log('error', message);
  }

}
