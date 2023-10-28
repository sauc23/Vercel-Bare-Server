const http = require("node:http");
const { createBareServer } = require("@tomphttp/bare-server-node");
const express = require("express");
const fs = require("fs");
const path = require("path");

// Create an Express app
const app = express();

// Serve the index.html file when the root URL is requested
app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "index.html");

  fs.readFile(indexPath, "utf8", (err, data) => {
    if (err) {
      res.status(500).send("Internal Server Error");
    } else {
      res.setHeader("Content-Type", "text/html");
      res.status(200).send(data);
    }
  });
});

// Your existing HTTP server code
const httpServer = http.createServer();
const bareServer = createBareServer("/bare/");

httpServer.on("request", (req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res);
  } else {
    res.writeHead(400);
    res.end("Not found.");
  }
});

httpServer.on("upgrade", (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

httpServer.on("listening", () => {
  console.log("HTTP server listening");
});

httpServer.listen({
  port: 8000,
});
