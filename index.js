"use strict";

const https = require("https");

const SMTPServer = require("smtp-server").SMTPServer;

module.exports = {
  createServer({ hostname, path }) {
    return new SMTPServer({
      disabledCommands: ["AUTH"],
      onData(stream, session, callback) {
        post({ hostname, path, stream });
        stream.on("end", callback);
      }
    });
  }
};

function post({ stream, hostname, path }) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port: 443,
      path,
      method: "POST"
    };
    const req = https.request(options, res => {
      res.on("data", d => {
        // process.stdout.write(d);
      });
    });

    req.on("error", error => {
      console.error(error);
    });
    stream.pipe(req);
    req.on("end", () => {
      resolve();
    });
  });
}
