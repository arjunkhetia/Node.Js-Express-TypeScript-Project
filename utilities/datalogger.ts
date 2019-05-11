import fs from "fs";

export class DataLogger {

  public logfile() {
    // redirect global console object to log file
    const Console: any = console.constructor;
    var con = Console(fs.createWriteStream('./log/ServerData.log', {'flags': 'a'}));
    Object.keys(Console.prototype).forEach(name => {
        eval('console')[name] = function() {
            con[name].apply(con, arguments);
        };
    });
  }

}
